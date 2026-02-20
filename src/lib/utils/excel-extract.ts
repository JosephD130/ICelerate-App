// src/lib/utils/excel-extract.ts
// Client-side Excel and CSV text extraction using the xlsx library.

import * as XLSX from "xlsx";

const MAX_TEXT_LENGTH = 100_000;

/**
 * Extract readable text from an Excel (.xlsx, .xls) or CSV file.
 * Reads the file client-side and converts each sheet to text.
 */
export async function extractExcelText(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    const parts: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (csv.trim()) {
        parts.push(`## Sheet: ${sheetName}\n${csv}`);
      }
    }

    const fullText = parts.join("\n\n");
    return fullText.slice(0, MAX_TEXT_LENGTH);
  } catch {
    console.error("Excel/CSV extraction failed");
    return "";
  }
}
