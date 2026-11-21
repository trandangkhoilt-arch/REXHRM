import * as XLSX from "xlsx";

/**
 * Generates an Excel XLSX buffer from an array of JSON objects.
 */
export function generateExcelBuffer(data: Record<string, any>[], sheetName = "Sheet1"): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

/**
 * Generates a UTF-8 CSV string with BOM from an array of JSON objects.
 */
export function generateCSVString(data: Record<string, any>[]): string {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  // Prepend UTF-8 BOM so Excel on Windows/Mac properly displays Vietnamese characters
  return "\uFEFF" + csv;
}
