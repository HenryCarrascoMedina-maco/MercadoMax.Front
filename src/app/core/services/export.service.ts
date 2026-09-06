import { Injectable } from '@angular/core';

export interface ExportMetric {
  label: string;
  value: string;
}

export interface ExportTableColumn {
  key: string;
  label: string;
}

export interface ExportTable {
  title: string;
  columns: ExportTableColumn[];
  rows: Array<Record<string, string | number | null | undefined>>;
}

export interface ExportSection {
  title: string;
  subtitle: string;
  metrics: ExportMetric[];
  table?: ExportTable;
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  async exportSectionToExcel(section: ExportSection, fileName: string): Promise<void> {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet(
      section.metrics.map(item => ({ Metric: item.label, Value: item.value }))
    );

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    if (section.table) {
      const table = section.table;
      const rows = section.table.rows.map(row => {
        const result: Record<string, string | number | null | undefined> = {};
        for (const column of table.columns) {
          result[column.label] = row[column.key];
        }
        return result;
      });

      const tableSheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, tableSheet, 'Detalle');
    }

    XLSX.writeFile(workbook, fileName);
  }

  async exportSectionToPdf(section: ExportSection, fileName: string): Promise<void> {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(section.title, 14, 18);
    doc.setFontSize(11);
    doc.text(section.subtitle, 14, 26);

    autoTable(doc, {
      startY: 34,
      head: [['Indicador', 'Valor']],
      body: section.metrics.map(item => [item.label, item.value]),
      styles: { fontSize: 10 }
    });

    if (section.table) {
      const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 40;
      doc.setFontSize(13);
      doc.text(section.table.title, 14, finalY + 10);
      autoTable(doc, {
        startY: finalY + 14,
        head: [section.table.columns.map(column => column.label)],
        body: section.table.rows.map(row => section.table!.columns.map(column => `${row[column.key] ?? ''}`)),
        styles: { fontSize: 9 }
      });
    }

    doc.save(fileName);
  }
}
