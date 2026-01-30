import ExcelJS from 'exceljs';

interface ColumnConfig {
  header: string;
  key: string;
  width?: number;
}

interface ExportOptions {
  sheetName: string;
  fileName: string;
  columns: ColumnConfig[];
  data: Record<string, unknown>[];
}

/**
 * Export data to Excel file using ExcelJS (secure alternative to xlsx)
 */
export async function exportToExcel(options: ExportOptions): Promise<void> {
  const { sheetName, fileName, columns, data } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Visa System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ rightToLeft: true }],
  });

  // Set columns with headers and widths
  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 20,
  }));

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { horizontal: 'center' };

  // Add data rows
  data.forEach((row) => {
    worksheet.addRow(row);
  });

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}
