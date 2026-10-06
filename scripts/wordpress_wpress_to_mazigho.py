#!/usr/bin/env python3
"""Convert a WordPress All-in-One WP Migration backup into a MAZIGHO import ZIP.

This is an OFFLINE, read-only source converter. It does not restore WordPress,
execute PHP/SQL, contact a network service, or import anything into MAZIGHO.
The generated ZIP must still be reviewed and explicitly confirmed in Studio.

Supported source data (v1):
- WordPress/WooCommerce `product` posts;
- SureCart `sc_product` posts with their WordPress post meta;
- linked WordPress media only when an attachment is explicitly referenced by a
  product thumbnail/gallery or has the product as parent.

Not copied: users, passwords, customers, orders, subscriptions, payments,
reviews, coupons, API keys, WordPress plugins/themes or site configuration.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import html
import io
import json
import re
import sys
import tempfile
import zipfile
from collections import defaultdict
from contextlib import contextmanager
from dataclasses import dataclass, field
from pathlib import Path, PurePosixPath
from typing import BinaryIO, Iterator

WPRESS_HEADER_SIZE = 4377
WPRESS_NAME_END = 255
WPRESS_SIZE_END = 269
WPRESS_MTIME_END = 281

MAX_SOURCE_BYTES = 2 * 1024 * 1024 * 1024
MAX_WPRESS_ENTRIES = 30_000
MAX_WPRESS_PAYLOAD_BYTES = 1 * 1024 * 1024 * 1024
MAX_DATABASE_BYTES = 64 * 1024 * 1024
MAX_PRODUCTS = 100
MAX_IMAGES = 40
MAX_IMAGE_BYTES = 5 * 1024 * 1024
MAX_OUTPUT_ARCHIVE_BYTES = 30 * 1024 * 1024
OUTPUT_MEDIA_BUDGET_BYTES = 24 * 1024 * 1024
SUPPORTED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
DEFAULT_CATEGORY = "Catalogue WordPress"

CATALOGUE_HEADERS = [
    "category",
    "name",
    "shortDescription",
    "longDescription",
    "price",
    "stock",
    "dimensions",
    "imageUrl",
    "featured",
]


class ConversionError(RuntimeError):
    """Raised when a source backup is malformed or outside the safety policy."""


@dataclass(frozen=True)
class WpressEntry:
    path: str
    size: int


@dataclass
class WordpressPost:
    post_id: str
    title: str
    content: str
    excerpt: str
    status: str
    post_type: str
    parent_id: str
    guid: str


@dataclass
class ImportedProduct:
    post_id: str
    name: str
    category: str
    short_description: str
    long_description: str
    price: str
    stock: int
    featured: bool
    attachment_ids: list[str] = field(default_factory=list)


@dataclass
class ConversionResult:
    source_path: Path
    output_path: Path
    product_count: int
    image_count: int
    skipped_image_count: int
    source_kind: str
    currency: str
    warnings: list[str]


@dataclass
class SqlSnapshot:
    products: list[ImportedProduct]
    attachments: dict[str, WordpressPost]
    attachment_files: dict[str, str]
    source_kind: str
    currency: str | None
    warnings: list[str]


def safe_archive_path(value: str) -> str:
    """Return a strict relative archive path or raise without writing anything."""
    raw = value.replace("\\", "/").strip()
    path = PurePosixPath(raw)
    if not raw or raw.startswith("/") or path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        raise ConversionError("L’archive source contient un chemin non autorisé.")
    return path.as_posix()


def decode_header_field(header: bytes, start: int, end: int) -> str:
    return header[start:end].split(b"\x00", 1)[0].decode("utf-8", errors="replace").strip()


def read_exact(stream: BinaryIO, size: int) -> bytes:
    chunks: list[bytes] = []
    remaining = size
    while remaining:
        chunk = stream.read(min(1024 * 1024, remaining))
        if not chunk:
            raise ConversionError("La sauvegarde WPRESS est tronquée.")
        chunks.append(chunk)
        remaining -= len(chunk)
    return b"".join(chunks)


def discard_exact(stream: BinaryIO, size: int) -> None:
    remaining = size
    while remaining:
        chunk = stream.read(min(1024 * 1024, remaining))
        if not chunk:
            raise ConversionError("La sauvegarde WPRESS est tronquée.")
        remaining -= len(chunk)


@contextmanager
def open_wpress_stream(source: Path) -> Iterator[tuple[BinaryIO, int]]:
    """Open a direct .wpress or the single .wpress member of an outer ZIP."""
    if not source.exists() or not source.is_file():
        raise ConversionError("La sauvegarde source est introuvable.")
    if source.stat().st_size > MAX_SOURCE_BYTES:
        raise ConversionError("La sauvegarde source dépasse la limite de 2 Gio du convertisseur privé.")

    if source.suffix.lower() == ".wpress":
        with source.open("rb") as stream:
            yield stream, source.stat().st_size
        return

    if source.suffix.lower() != ".zip":
        raise ConversionError("Choisissez un fichier .wpress ou un ZIP contenant exactement un fichier .wpress.")

    with zipfile.ZipFile(source) as outer:
        candidates = [entry for entry in outer.infolist() if not entry.is_dir() and entry.filename.lower().endswith(".wpress")]
        if len(candidates) != 1:
            raise ConversionError("Le ZIP doit contenir exactement un fichier .wpress.")
        candidate = candidates[0]
        if candidate.file_size > MAX_SOURCE_BYTES:
            raise ConversionError("Le fichier .wpress interne dépasse la limite de 2 Gio.")
        with outer.open(candidate, "r") as stream:
            yield stream, candidate.file_size


def iter_wpress_entries(stream: BinaryIO, total_bytes: int) -> Iterator[WpressEntry]:
    """Yield only validated entries and leave the stream positioned after each body."""
    consumed = 0
    entries = 0
    payload_bytes = 0
    while consumed < total_bytes:
        header = stream.read(WPRESS_HEADER_SIZE)
        if not header:
            break
        if len(header) != WPRESS_HEADER_SIZE:
            raise ConversionError("L’en-tête WPRESS est incomplet.")
        consumed += WPRESS_HEADER_SIZE
        if header == b"\x00" * WPRESS_HEADER_SIZE:
            break
        name = decode_header_field(header, 0, WPRESS_NAME_END)
        size_raw = decode_header_field(header, WPRESS_NAME_END, WPRESS_SIZE_END)
        prefix = decode_header_field(header, WPRESS_MTIME_END, WPRESS_HEADER_SIZE)
        try:
            size = int(size_raw)
        except ValueError as error:
            raise ConversionError("Une entrée WPRESS possède une taille invalide.") from error
        if size < 0 or size > total_bytes - consumed:
            raise ConversionError("Une entrée WPRESS dépasse les limites de la sauvegarde.")
        full_path = safe_archive_path(f"{prefix.rstrip('/')}/{name}" if prefix else name)
        entries += 1
        payload_bytes += size
        if entries > MAX_WPRESS_ENTRIES or payload_bytes > MAX_WPRESS_PAYLOAD_BYTES:
            raise ConversionError("La sauvegarde WPRESS dépasse les limites d’analyse privées.")
        yield WpressEntry(path=full_path, size=size)
        discard_exact(stream, size)
        consumed += size


def list_wpress_entries(source: Path) -> list[WpressEntry]:
    with open_wpress_stream(source) as (stream, total):
        return list(iter_wpress_entries(stream, total))


def read_wpress_member(source: Path, expected_path: str, max_bytes: int) -> bytes:
    normalized = safe_archive_path(expected_path)
    with open_wpress_stream(source) as (stream, total):
        consumed = 0
        while consumed < total:
            header = stream.read(WPRESS_HEADER_SIZE)
            if not header or header == b"\x00" * WPRESS_HEADER_SIZE:
                break
            if len(header) != WPRESS_HEADER_SIZE:
                raise ConversionError("L’en-tête WPRESS est incomplet.")
            consumed += WPRESS_HEADER_SIZE
            name = decode_header_field(header, 0, WPRESS_NAME_END)
            size_raw = decode_header_field(header, WPRESS_NAME_END, WPRESS_SIZE_END)
            prefix = decode_header_field(header, WPRESS_MTIME_END, WPRESS_HEADER_SIZE)
            try:
                size = int(size_raw)
            except ValueError as error:
                raise ConversionError("Une entrée WPRESS possède une taille invalide.") from error
            path = safe_archive_path(f"{prefix.rstrip('/')}/{name}" if prefix else name)
            if size < 0 or size > total - consumed:
                raise ConversionError("Une entrée WPRESS dépasse les limites de la sauvegarde.")
            if path == normalized:
                if size > max_bytes:
                    raise ConversionError(f"Le fichier {path} dépasse la limite autorisée.")
                return read_exact(stream, size)
            discard_exact(stream, size)
            consumed += size
    raise ConversionError(f"Le fichier requis {normalized} est absent de la sauvegarde.")


def read_wpress_members(source: Path, expected_paths: set[str], max_bytes: int) -> dict[str, bytes]:
    """Read several known small members in one sequential pass through WPRESS."""
    normalized_paths = {safe_archive_path(path) for path in expected_paths}
    found: dict[str, bytes] = {}
    with open_wpress_stream(source) as (stream, total):
        consumed = 0
        while consumed < total and len(found) < len(normalized_paths):
            header = stream.read(WPRESS_HEADER_SIZE)
            if not header or header == b"\x00" * WPRESS_HEADER_SIZE:
                break
            if len(header) != WPRESS_HEADER_SIZE:
                raise ConversionError("L’en-tête WPRESS est incomplet.")
            consumed += WPRESS_HEADER_SIZE
            name = decode_header_field(header, 0, WPRESS_NAME_END)
            size_raw = decode_header_field(header, WPRESS_NAME_END, WPRESS_SIZE_END)
            prefix = decode_header_field(header, WPRESS_MTIME_END, WPRESS_HEADER_SIZE)
            try:
                size = int(size_raw)
            except ValueError as error:
                raise ConversionError("Une entrée WPRESS possède une taille invalide.") from error
            path = safe_archive_path(f"{prefix.rstrip('/')}/{name}" if prefix else name)
            if size < 0 or size > total - consumed:
                raise ConversionError("Une entrée WPRESS dépasse les limites de la sauvegarde.")
            if path in normalized_paths:
                if size > max_bytes:
                    raise ConversionError(f"Le fichier {path} dépasse la limite autorisée.")
                found[path] = read_exact(stream, size)
            else:
                discard_exact(stream, size)
            consumed += size
    missing = sorted(normalized_paths.difference(found))
    if missing:
        raise ConversionError(f"Fichier(s) absent(s) de la sauvegarde : {', '.join(missing)}.")
    return found


def sha256_file(source: Path) -> str:
    digest = hashlib.sha256()
    with source.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def split_sql_cells(row: str) -> list[str]:
    cells: list[str] = []
    current: list[str] = []
    quoted = False
    escaped = False
    for character in row:
        if escaped:
            current.append(character)
            escaped = False
            continue
        if quoted and character == "\\":
            current.append(character)
            escaped = True
            continue
        if character == "'":
            quoted = not quoted
            current.append(character)
            continue
        if character == "," and not quoted:
            cells.append("".join(current))
            current = []
            continue
        current.append(character)
    cells.append("".join(current))
    return cells


def mysql_value(raw: str) -> str | None:
    value = raw.strip()
    if value.upper() == "NULL":
        return None
    if len(value) >= 2 and value[0] == value[-1] == "'":
        decoded = value[1:-1]
        return (
            decoded.replace("\\0", "\x00")
            .replace("\\n", "\n")
            .replace("\\r", "\r")
            .replace("\\Z", "\x1a")
            .replace("\\'", "'")
            .replace('\\"', '"')
            .replace("\\\\", "\\")
        )
    return value


def iter_sql_tuples(payload: str) -> Iterator[list[str | None]]:
    depth = 0
    quoted = False
    escaped = False
    start: int | None = None
    for index, character in enumerate(payload):
        if escaped:
            escaped = False
            continue
        if quoted and character == "\\":
            escaped = True
            continue
        if character == "'":
            quoted = not quoted
            continue
        if quoted:
            continue
        if character == "(":
            if depth == 0:
                start = index + 1
            depth += 1
        elif character == ")":
            depth -= 1
            if depth == 0 and start is not None:
                yield [mysql_value(cell) for cell in split_sql_cells(payload[start:index])]
                start = None
    if quoted or depth != 0:
        raise ConversionError("Le SQL WordPress contient une instruction incomplète.")


def iter_insert_statements(sql: str) -> Iterator[tuple[str, str]]:
    marker = re.compile(r"INSERT\s+INTO\s+`?([A-Za-z0-9_]+)`?\s+VALUES\s*", re.IGNORECASE)
    position = 0
    while True:
        match = marker.search(sql, position)
        if not match:
            return
        quoted = False
        escaped = False
        depth = 0
        end = match.end()
        while end < len(sql):
            character = sql[end]
            if escaped:
                escaped = False
            elif quoted and character == "\\":
                escaped = True
            elif character == "'":
                quoted = not quoted
            elif not quoted:
                if character == "(":
                    depth += 1
                elif character == ")":
                    depth = max(0, depth - 1)
                elif character == ";" and depth == 0:
                    yield match.group(1), sql[match.end():end]
                    position = end + 1
                    break
            end += 1
        else:
            raise ConversionError("Une instruction INSERT de la base WordPress est incomplète.")


def plain_text(value: str | None, limit: int) -> str:
    raw = value or ""
    raw = re.sub(r"<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>", " ", raw, flags=re.IGNORECASE | re.DOTALL)
    raw = re.sub(r"<[^>]+>", " ", raw)
    raw = html.unescape(raw).replace("\x00", " ")
    return re.sub(r"\s+", " ", raw).strip()[:limit]


def safe_amount(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip().replace(",", ".")
    if not re.fullmatch(r"\d+(?:\.\d{1,2})?", normalized):
        return None
    amount = float(normalized)
    if amount <= 0 or amount > 100_000:
        return None
    return f"{amount:.2f}"


def safe_stock(value: str | None) -> int:
    try:
        stock = int((value or "").strip())
    except ValueError:
        return 0
    return stock if 0 <= stock <= 999_999 else 0


def slug_file_name(name: str, fallback: str) -> str:
    candidate = re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip(".-").lower()
    return candidate or fallback


def detect_currency(option_values: dict[str, str | None]) -> str | None:
    for key, value in option_values.items():
        normalized = key.lower()
        candidate = (value or "").strip().upper()
        if "currency" in normalized and re.fullmatch(r"[A-Z]{3}", candidate):
            return candidate
    return None


def parse_wordpress_database(sql: str, requested_currency: str | None) -> SqlSnapshot:
    posts: dict[str, WordpressPost] = {}
    post_meta: dict[str, dict[str, list[str | None]]] = defaultdict(lambda: defaultdict(list))
    options: dict[str, str | None] = {}

    for table, payload in iter_insert_statements(sql):
        lower_table = table.lower()
        if lower_table.endswith("posts"):
            for row in iter_sql_tuples(payload):
                if len(row) < 23 or not row[0]:
                    continue
                posts[row[0]] = WordpressPost(
                    post_id=row[0],
                    content=row[4] or "",
                    title=row[5] or "",
                    excerpt=row[6] or "",
                    status=row[7] or "",
                    parent_id=row[17] or "",
                    guid=row[18] or "",
                    post_type=row[20] or "",
                )
        elif lower_table.endswith("postmeta"):
            for row in iter_sql_tuples(payload):
                if len(row) >= 4 and row[1] and row[2]:
                    post_meta[row[1]][row[2]].append(row[3])
        elif lower_table.endswith("options"):
            for row in iter_sql_tuples(payload):
                if len(row) >= 3 and row[1]:
                    options[row[1]] = row[2]

    product_posts = [post for post in posts.values() if post.post_type in {"product", "sc_product"} and post.status == "publish"]
    if not product_posts:
        raise ConversionError("Aucun produit publié WooCommerce ou SureCart n’a été trouvé dans la sauvegarde.")

    warnings: list[str] = []
    product_types = {post.post_type for post in product_posts}
    if product_types == {"sc_product"}:
        source_kind = "SureCart"
    elif product_types == {"product"}:
        source_kind = "WooCommerce"
    else:
        source_kind = "SureCart + WooCommerce"
    products: list[ImportedProduct] = []
    seen_names: set[str] = set()

    for post in sorted(product_posts, key=lambda item: int(item.post_id) if item.post_id.isdigit() else item.post_id):
        meta = post_meta.get(post.post_id, {})
        first = lambda *keys: next((values[0] for key in keys if (values := meta.get(key))), None)
        if post.post_type == "sc_product":
            price = safe_amount(first("min_price_amount", "display_amount"))
            stock = safe_stock(first("available_stock"))
            featured = first("featured") in {"1", "true", "yes", "oui"}
        else:
            price = safe_amount(first("_sale_price", "_price", "_regular_price"))
            stock = safe_stock(first("_stock"))
            featured = first("_featured") in {"yes", "1", "true"}

        name = plain_text(post.title, 200)
        if not name or not price:
            warnings.append(f"La fiche WordPress {post.post_id} a été écartée : nom ou prix inexploitable.")
            continue
        if name in seen_names:
            name = f"{name} — WordPress {post.post_id}"[:200]
            warnings.append("Des noms produits identiques ont été distingués par leur identifiant WordPress.")
        seen_names.add(name)
        short = plain_text(post.excerpt, 2000) or plain_text(post.content, 220)
        long = plain_text(post.content, 6000) or short

        attachment_ids: list[str] = []
        if post.parent_id:
            attachment_ids.extend([attachment.post_id for attachment in posts.values() if attachment.post_type == "attachment" and attachment.parent_id == post.post_id])
        for key in ("_thumbnail_id", "_product_image_gallery"):
            for candidate in meta.get(key, []):
                attachment_ids.extend(re.findall(r"\d+", candidate or ""))
        products.append(
            ImportedProduct(
                post_id=post.post_id,
                name=name,
                category=DEFAULT_CATEGORY,
                short_description=short,
                long_description=long,
                price=price,
                stock=stock,
                featured=featured,
                attachment_ids=list(dict.fromkeys(attachment_ids)),
            )
        )

    if not products:
        raise ConversionError("Les produits détectés ne possèdent aucun nom et prix importables.")
    if len(products) > MAX_PRODUCTS:
        warnings.append(f"{len(products) - MAX_PRODUCTS} produit(s) dépassent la limite Studio de {MAX_PRODUCTS} fiches et ne seront pas inclus.")
        products = products[:MAX_PRODUCTS]

    attachments = {post.post_id: post for post in posts.values() if post.post_type == "attachment"}
    attachment_files = {
        attachment_id: (values[0] or "")
        for attachment_id, values in ((identifier, metadata.get("_wp_attached_file", [])) for identifier, metadata in post_meta.items())
        if values
    }
    currency = requested_currency or detect_currency(options)
    if not currency:
        warnings.append("Devise WordPress non déterminée : le manifeste indique UNSPECIFIED. Vérifiez les prix avant import.")
        currency = "UNSPECIFIED"

    return SqlSnapshot(
        products=products,
        attachments=attachments,
        attachment_files=attachment_files,
        source_kind=source_kind,
        currency=currency,
        warnings=warnings,
    )


def image_member_map(entries: dict[str, WpressEntry], snapshot: SqlSnapshot) -> tuple[dict[str, list[tuple[str, str]]], list[str]]:
    """Return product id -> [(archive member, target path)] and safety warnings."""
    used: set[str] = set()
    mapping: dict[str, list[tuple[str, str]]] = defaultdict(list)
    warnings: list[str] = []
    selected_images = 0

    for product in snapshot.products:
        for attachment_id in product.attachment_ids:
            source_relative = snapshot.attachment_files.get(attachment_id, "").lstrip("/")
            source_path = f"uploads/{source_relative}" if source_relative else ""
            extension = Path(source_relative).suffix.lower()
            entry = entries.get(source_path)
            if not source_path or extension not in SUPPORTED_IMAGE_EXTENSIONS or not entry:
                continue
            if entry.size > MAX_IMAGE_BYTES:
                warnings.append(f"Une image liée au produit WordPress {product.post_id} dépasse 5 Mio et a été écartée.")
                continue
            if selected_images >= MAX_IMAGES:
                warnings.append(f"Les images au-delà de la limite Studio de {MAX_IMAGES} ont été écartées.")
                return mapping, warnings
            basename = slug_file_name(Path(source_relative).name, f"wordpress-{attachment_id}{extension}")
            target = f"images/wp-{product.post_id}-{attachment_id}-{basename}"
            if target in used:
                continue
            used.add(target)
            mapping[product.post_id].append((source_path, target))
            selected_images += 1
    return mapping, warnings


def fit_image_members_to_studio_archive(
    entries: dict[str, WpressEntry], image_members: dict[str, list[tuple[str, str]]]
) -> tuple[dict[str, list[tuple[str, str]]], int, list[str]]:
    """Keep deterministic linked media within the browser-safe ZIP budget."""
    selected: dict[str, list[tuple[str, str]]] = defaultdict(list)
    selected_bytes = 0
    excluded = 0
    for product_id, members in image_members.items():
        for source_path, target_path in members:
            entry = entries.get(source_path)
            if not entry:
                continue
            if selected_bytes + entry.size > OUTPUT_MEDIA_BUDGET_BYTES:
                excluded += 1
                continue
            selected[product_id].append((source_path, target_path))
            selected_bytes += entry.size
    warnings = []
    if excluded:
        warnings.append(
            f"{excluded} visuel(s) lié(s) ont été écartés pour conserver un ZIP catalogue inférieur à 30 Mio. "
            "Ils pourront être ajoutés plus tard depuis l’éditeur de catalogue."
        )
    return dict(selected), excluded, warnings


def write_catalogue_csv(products: list[ImportedProduct], image_paths: dict[str, list[str]]) -> bytes:
    output = io.StringIO(newline="")
    writer = csv.DictWriter(output, fieldnames=CATALOGUE_HEADERS, lineterminator="\r\n")
    writer.writeheader()
    for product in products:
        paths = image_paths.get(product.post_id, [])
        writer.writerow(
            {
                "category": product.category,
                "name": product.name,
                "shortDescription": product.short_description,
                "longDescription": product.long_description,
                "price": product.price,
                "stock": product.stock,
                "dimensions": "",
                "imageUrl": paths[0] if paths else "",
                "featured": "oui" if product.featured else "non",
            }
        )
    return ("\ufeff" + output.getvalue()).encode("utf-8")


def convert_wordpress_wpress(source: Path, output: Path, currency: str | None = None) -> ConversionResult:
    entries = list_wpress_entries(source)
    database_entries = [entry for entry in entries if entry.path == "database.sql"]
    if len(database_entries) != 1:
        raise ConversionError("La sauvegarde doit contenir exactement un fichier database.sql.")
    database = read_wpress_member(source, "database.sql", MAX_DATABASE_BYTES).decode("utf-8", errors="replace")
    snapshot = parse_wordpress_database(database, currency.upper() if currency else None)
    entry_map = {entry.path: entry for entry in entries}
    image_members, image_warnings = image_member_map(entry_map, snapshot)
    image_members, output_skipped_image_count, output_budget_warnings = fit_image_members_to_studio_archive(entry_map, image_members)
    image_paths = {product_id: [target for _, target in members] for product_id, members in image_members.items()}
    source_images = {source_path for members in image_members.values() for source_path, _ in members}
    if not source_images:
        image_warnings.append("Aucune image n’a été jointe : la sauvegarde ne relie pas les médias aux fiches produit de façon vérifiable. Aucune image n’est choisie au hasard.")
    image_bytes = read_wpress_members(source, source_images, MAX_IMAGE_BYTES) if source_images else {}

    manifest = {
        "source": f"WordPress {snapshot.source_kind} (.wpress)",
        "currency": snapshot.currency,
        "language": "und",
        "rightsConfirmed": False,
        "catalogue": "catalogue.csv",
        "imageMappings": {product.name: image_paths[product.post_id] for product in snapshot.products if image_paths.get(product.post_id)},
        "conversion": {
            "tool": "wordpress_wpress_to_mazigho.py",
            "sourceSha256": sha256_file(source),
            "products": len(snapshot.products),
            "linkedImages": sum(len(paths) for paths in image_paths.values()),
            "excludedLinkedImages": output_skipped_image_count,
            "mediaBudgetBytes": OUTPUT_MEDIA_BUDGET_BYTES,
            "excludedData": ["users", "customers", "orders", "payments", "passwords", "plugins", "themes", "settings"],
        },
    }
    report = {
        "source": manifest["source"],
        "products": len(snapshot.products),
        "linkedImages": manifest["conversion"]["linkedImages"],
        "excludedLinkedImages": output_skipped_image_count,
        "mediaBudgetBytes": OUTPUT_MEDIA_BUDGET_BYTES,
        "warnings": snapshot.warnings + image_warnings + output_budget_warnings,
        "note": "Ce rapport ne contient ni données clients, ni commandes, ni réglages WordPress.",
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        raise ConversionError("Le fichier de sortie existe déjà. Choisissez un nouveau nom pour éviter tout écrasement.")
    try:
        with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            archive.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
            archive.writestr("catalogue.csv", write_catalogue_csv(snapshot.products, image_paths))
            archive.writestr("marque/wordpress-conversion-report.json", json.dumps(report, ensure_ascii=False, indent=2) + "\n")
            for product in snapshot.products:
                for source_path, target_path in image_members.get(product.post_id, []):
                    archive.writestr(target_path, image_bytes[source_path])
        if output.stat().st_size > MAX_OUTPUT_ARCHIVE_BYTES:
            raise ConversionError("Le ZIP catalogue généré dépasse 30 Mio malgré la sélection média. Réduisez les médias ou utilisez une conversion hors ligne assistée.")
    except Exception:
        output.unlink(missing_ok=True)
        raise

    return ConversionResult(
        source_path=source,
        output_path=output,
        product_count=len(snapshot.products),
        image_count=sum(len(paths) for paths in image_paths.values()),
        skipped_image_count=output_skipped_image_count,
        source_kind=snapshot.source_kind,
        currency=snapshot.currency,
        warnings=snapshot.warnings + image_warnings + output_budget_warnings,
    )


def parser() -> argparse.ArgumentParser:
    command = argparse.ArgumentParser(description="Convertit hors ligne un .wpress WordPress vers une archive MAZIGHO Import Archive.")
    command.add_argument("source", type=Path, help="Fichier .wpress ou ZIP contenant exactement un .wpress")
    command.add_argument("output", type=Path, help="Nouveau ZIP MAZIGHO à créer (il ne doit pas déjà exister)")
    command.add_argument("--currency", metavar="CODE", help="Devise à déclarer (ex. CHF, EUR, DZD). Aucune conversion n’est faite.")
    return command


def main(argv: list[str] | None = None) -> int:
    arguments = parser().parse_args(argv)
    try:
        result = convert_wordpress_wpress(arguments.source, arguments.output, arguments.currency)
    except (ConversionError, OSError, zipfile.BadZipFile) as error:
        print(f"Conversion refusée : {error}", file=sys.stderr)
        return 2
    print(f"Archive MAZIGHO créée : {result.output_path}")
    print(f"Produits : {result.product_count} | Images liées : {result.image_count} | Source : {result.source_kind} | Devise : {result.currency}")
    for warning in result.warnings:
        print(f"Avertissement : {warning}")
    print("Aucune donnée n’a été importée ni publiée : chargez ensuite l’archive dans Studio pour l’aperçu et la confirmation explicite.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
