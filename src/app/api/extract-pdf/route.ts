import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json({ error: "PDF exceeds 10MB size limit" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await pdfParse(buffer);
    const text = (result.text || "").slice(0, 50_000);

    return NextResponse.json({ text });
  } catch (e) {
    console.error("[extract-pdf] extraction failed:", e);
    return NextResponse.json({ error: "PDF extraction failed" }, { status: 500 });
  }
}
