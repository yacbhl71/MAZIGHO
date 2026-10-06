#!/usr/bin/env python3
"""Standard-library tests for the private WordPress WPRESS converter."""

from __future__ import annotations

import csv
import importlib.util
import io
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

SCRIPT = Path(__file__).with_name("wordpress_wpress_to_mazigho.py")
spec = importlib.util.spec_from_file_location("wordpress_wpress_to_mazigho", SCRIPT)
assert spec and spec.loader
converter = importlib.util.module_from_spec(spec)
import sys
sys.modules[spec.name] = converter
spec.loader.exec_module(converter)


def wpress_entry(path: str, content: bytes) -> bytes:
    prefix, _, name = path.rpartition("/")
    header = bytearray(converter.WPRESS_HEADER_SIZE)
    header[: len(name.encode())] = name.encode()
    size = str(len(content)).encode()
    header[converter.WPRESS_NAME_END : converter.WPRESS_NAME_END + len(size)] = size
    if prefix:
        prefix_bytes = prefix.encode()
        header[converter.WPRESS_MTIME_END : converter.WPRESS_MTIME_END + len(prefix_bytes)] = prefix_bytes
    return bytes(header) + content


def fixture_sql() -> bytes:
    return b"""
INSERT INTO `wp_posts` VALUES
(10,1,'2026-01-01','2026-01-01','<p>Une description <strong>complete</strong>.</p>','Huile d\\'olive','Une courte description','publish','open','open','','huile-olive','','','2026-01-01','2026-01-01','',0,'https://example.test/?p=10',0,'sc_product','',0),
(11,1,'2026-01-01','2026-01-01','','Image','', 'inherit','','','', 'huile.jpg','','','2026-01-01','2026-01-01','',10,'https://example.test/wp-content/uploads/2026/01/huile.jpg',0,'attachment','image/jpeg',0),
(20,1,'2026-01-01','2026-01-01','<p>Un produit Woo.</p>','Savon artisanal','','publish','open','open','','savon','','','2026-01-01','2026-01-01','',0,'https://example.test/?p=20',0,'product','',0);
INSERT INTO `wp_postmeta` VALUES
(1,10,'min_price_amount','19'),
(2,10,'available_stock','3'),
(3,10,'featured','1'),
(4,10,'_thumbnail_id','11'),
(5,11,'_wp_attached_file','2026/01/huile.jpg'),
(6,20,'_price','8.50'),
(7,20,'_stock','4');
INSERT INTO `wp_options` VALUES (1,'woocommerce_currency','EUR','yes');
"""


class WordpressWpressConverterTests(unittest.TestCase):
    def make_source(self, root: Path) -> Path:
        wpress = root / "source.wpress"
        wpress.write_bytes(
            wpress_entry("database.sql", fixture_sql())
            + wpress_entry("uploads/2026/01/huile.jpg", b"safe-image-placeholder")
            + b"\x00" * converter.WPRESS_HEADER_SIZE
        )
        outer = root / "source.zip"
        with zipfile.ZipFile(outer, "w", zipfile.ZIP_DEFLATED) as archive:
            archive.write(wpress, "backup.wpress")
        return outer

    def test_converts_surecart_and_woocommerce_products_without_private_data(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "mazigho.zip"
            result = converter.convert_wordpress_wpress(self.make_source(root), output, "CHF")

            self.assertEqual(result.product_count, 2)
            self.assertEqual(result.image_count, 1)
            self.assertEqual(result.currency, "CHF")
            self.assertLessEqual(output.stat().st_size, converter.MAX_OUTPUT_ARCHIVE_BYTES)
            with zipfile.ZipFile(output) as archive:
                self.assertEqual(set(archive.namelist()), {
                    "manifest.json",
                    "catalogue.csv",
                    "marque/wordpress-conversion-report.json",
                    "images/wp-10-11-huile.jpg",
                })
                manifest = json.loads(archive.read("manifest.json"))
                self.assertFalse(manifest["rightsConfirmed"])
                self.assertEqual(manifest["currency"], "CHF")
                rows = list(csv.DictReader(io.StringIO(archive.read("catalogue.csv").decode("utf-8-sig"))))
                self.assertEqual([row["name"] for row in rows], ["Huile d'olive", "Savon artisanal"])
                self.assertEqual(rows[0]["price"], "19.00")
                self.assertEqual(rows[0]["imageUrl"], "images/wp-10-11-huile.jpg")
                self.assertEqual(rows[1]["price"], "8.50")
                self.assertNotIn("example.test", archive.read("catalogue.csv").decode("utf-8"))

    def test_rejects_path_traversal_before_writing_output(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            unsafe = root / "unsafe.wpress"
            unsafe.write_bytes(wpress_entry("../database.sql", fixture_sql()) + b"\x00" * converter.WPRESS_HEADER_SIZE)
            output = root / "blocked.zip"
            with self.assertRaises(converter.ConversionError):
                converter.convert_wordpress_wpress(unsafe, output)
            self.assertFalse(output.exists())

    def test_refuses_existing_output_file(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = self.make_source(root)
            output = root / "exists.zip"
            output.write_bytes(b"do-not-overwrite")
            with self.assertRaises(converter.ConversionError):
                converter.convert_wordpress_wpress(source, output)
            self.assertEqual(output.read_bytes(), b"do-not-overwrite")

    def test_reserves_a_browser_safe_media_budget(self) -> None:
        entries = {
            "uploads/first.jpg": converter.WpressEntry(path="uploads/first.jpg", size=converter.OUTPUT_MEDIA_BUDGET_BYTES),
            "uploads/second.jpg": converter.WpressEntry(path="uploads/second.jpg", size=1),
        }
        selected, excluded, warnings = converter.fit_image_members_to_studio_archive(entries, {
            "one": [("uploads/first.jpg", "images/first.jpg")],
            "two": [("uploads/second.jpg", "images/second.jpg")],
        })

        self.assertEqual(selected, {"one": [("uploads/first.jpg", "images/first.jpg")]})
        self.assertEqual(excluded, 1)
        self.assertTrue(warnings)


if __name__ == "__main__":
    unittest.main(verbosity=2)
