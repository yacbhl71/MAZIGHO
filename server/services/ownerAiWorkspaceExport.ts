type WorkspaceExportFormat = "pdf" | "docx";

function safeFileStem(title: string) {
  const normalized = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return normalized.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "document-workspace";
}

function asDataUrl(mimeType: string, buffer: Buffer) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function splitContent(content: string) {
  return content.replace(/\r\n/g, "\n").split("\n");
}

async function makePdf(title: string, content: string) {
  const pdfkit = await import("pdfkit");
  const PDFDocument = pdfkit.default;
  return await new Promise<Buffer>((resolve, reject) => {
    const document = new PDFDocument({ margin: 54, size: "A4", info: { Title: title, Author: "MAZIGHO Workspace" } });
    const chunks: Buffer[] = [];
    document.on("data", chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    document.on("error", reject);
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.fontSize(22).fillColor("#1f2937").text(title, { underline: false });
    document.moveDown(0.4);
    document.fontSize(9).fillColor("#6b7280").text("Document préparé dans MAZIGHO Workspace · à relire avant utilisation");
    document.moveDown(1.1);
    for (const line of splitContent(content)) {
      if (!line.trim()) { document.moveDown(0.55); continue; }
      if (/^#{1,3}\s/.test(line)) {
        const heading = line.replace(/^#{1,3}\s+/, "");
        document.fontSize(line.startsWith("# ") ? 17 : 13).fillColor("#111827").text(heading);
        document.moveDown(0.35);
      } else {
        document.fontSize(10.5).fillColor("#374151").text(line, { lineGap: 3 });
      }
    }
    document.end();
  });
}

async function makeDocx(title: string, content: string) {
  const docx = await import("docx");
  const children = [
    new docx.Paragraph({ text: title, heading: docx.HeadingLevel.TITLE }),
    new docx.Paragraph({ children: [new docx.TextRun({ text: "Document préparé dans MAZIGHO Workspace · à relire avant utilisation", italics: true, color: "6B7280", size: 18 })] }),
    ...splitContent(content).map(line => {
      if (!line.trim()) return new docx.Paragraph({ text: "" });
      if (/^#{1,3}\s/.test(line)) {
        return new docx.Paragraph({ text: line.replace(/^#{1,3}\s+/, ""), heading: line.startsWith("# ") ? docx.HeadingLevel.HEADING_1 : docx.HeadingLevel.HEADING_2 });
      }
      return new docx.Paragraph({ text: line });
    }),
  ];
  const document = new docx.Document({ sections: [{ properties: {}, children }] });
  return Buffer.from(await docx.Packer.toBuffer(document));
}

export async function exportOwnerAiWorkspaceDocument(input: { title: string; content: string; format: WorkspaceExportFormat }) {
  const buffer = input.format === "pdf" ? await makePdf(input.title, input.content) : await makeDocx(input.title, input.content);
  const mimeType = input.format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return {
    fileName: `${safeFileStem(input.title)}.${input.format}`,
    mimeType,
    dataUrl: asDataUrl(mimeType, buffer),
  };
}
