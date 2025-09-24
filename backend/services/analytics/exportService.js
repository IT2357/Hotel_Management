import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ExportService {
  constructor() {
    this.exportDir = path.join(process.cwd(), 'exports');
    this._ensureExportDirectory();
  }

  /**
   * Generate report in specified format
   */
  async generateReport({ type, format, data, includeCharts, dateRange, generatedBy }) {
    const fileName = this._generateFileName(type, format, dateRange);
    const filePath = path.join(this.exportDir, fileName);

    let result;
    
    if (format === 'pdf') {
      result = await this._generatePDFReport(filePath, type, data, includeCharts, dateRange);
    } else if (format === 'excel') {
      result = await this._generateExcelReport(filePath, type, data, dateRange);
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }

    const stats = await fs.promises.stat(filePath);

    return {
      downloadUrl: `/api/exports/${fileName}`,
      fileName,
      filePath,
      fileSize: stats.size,
      format,
      generatedAt: new Date(),
      generatedBy
    };
  }

  /**
   * Generate PDF report
   */
  async _generatePDFReport(filePath, type, data, includeCharts, dateRange) {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(fs.createWriteStream(filePath));

    // Header
    this._addPDFHeader(doc, type, dateRange);

    // Content based on report type
    switch (type) {
      case 'booking':
        await this._addBookingContent(doc, data, includeCharts);
        break;
      case 'financial':
        await this._addFinancialContent(doc, data, includeCharts);
        break;
      case 'kpi':
        await this._addKPIContent(doc, data, includeCharts);
        break;
    }

    // Footer
    this._addPDFFooter(doc);

    doc.end();

    return { success: true };
  }

  /**
   * Generate Excel report
   */
  async _generateExcelReport(filePath, type, data, dateRange) {
    const workbook = new ExcelJS.Workbook();
    
    workbook.creator = 'Hotel Management System';
    workbook.lastModifiedBy = 'System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Create worksheets based on report type
    switch (type) {
      case 'booking':
        await this._addBookingWorksheets(workbook, data, dateRange);
        break;
      case 'financial':
        await this._addFinancialWorksheets(workbook, data, dateRange);
        break;
      case 'kpi':
        await this._addKPIWorksheets(workbook, data, dateRange);
        break;
    }

    await workbook.xlsx.writeFile(filePath);

    return { success: true };
  }

  // PDF Helper Methods

  _addPDFHeader(doc, type, dateRange) {
    // Hotel logo and title
    doc.fontSize(24)
       .text('Hotel Management System', 50, 50);
    
    doc.fontSize(18)
       .text(`${this._formatReportTitle(type)} Report`, 50, 80);
    
    doc.fontSize(12)
       .text(`Report Period: ${format(dateRange.start, 'MMM dd, yyyy')} - ${format(dateRange.end, 'MMM dd, yyyy')}`, 50, 110)
       .text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 50, 125);

    // Add separator line
    doc.moveTo(50, 150)
       .lineTo(550, 150)
       .stroke();

    doc.y = 170;
  }

  async _addBookingContent(doc, data, includeCharts) {
    // Summary section
    doc.fontSize(16).text('Booking Summary', { underline: true });
    doc.moveDown();

    doc.fontSize(12)
       .text(`Total Bookings: ${data.summary?.totalBookings || 0}`)
       .text(`Total Revenue: $${(data.summary?.totalRevenue || 0).toLocaleString()}`)
       .text(`Average Booking Value: $${(data.summary?.averageBookingValue || 0).toFixed(2)}`)
       .text(`Occupancy Rate: ${(data.summary?.occupancyRate || 0).toFixed(1)}%`)
       .text(`Guest Satisfaction: ${(data.summary?.guestSatisfactionScore || 0).toFixed(1)}/5.0`);

    doc.moveDown(2);

    // Booking trends
    if (data.bookings?.trends) {
      doc.fontSize(14).text('Booking Trends', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(data.bookings.trends.description || 'No trend data available');
      doc.moveDown(2);
    }

    // Channel breakdown
    if (data.bookings?.byChannel) {
      doc.fontSize(14).text('Booking Channels', { underline: true });
      doc.moveDown();
      
      data.bookings.byChannel.forEach(channel => {
        doc.text(`${channel._id || 'Unknown'}: ${channel.count} bookings ($${channel.revenue.toLocaleString()})`);
      });
      doc.moveDown(2);
    }

    // Staff performance summary
    if (data.staff?.topPerformers) {
      doc.fontSize(14).text('Top Performing Staff', { underline: true });
      doc.moveDown();
      
      data.staff.topPerformers.slice(0, 5).forEach((staff, index) => {
        doc.text(`${index + 1}. ${staff.staffName}: ${staff.tasksCompleted} tasks (${staff.completionRate.toFixed(1)}%)`);
      });
    }
  }

  async _addFinancialContent(doc, data, includeCharts) {
    // Financial summary
    doc.fontSize(16).text('Financial Summary', { underline: true });
    doc.moveDown();

    doc.fontSize(12)
       .text(`Total Revenue: $${(data.summary?.totalRevenue || 0).toLocaleString()}`)
       .text(`Total Expenses: $${(data.summary?.totalExpenses || 0).toLocaleString()}`)
       .text(`Gross Profit: $${(data.summary?.grossProfit || 0).toLocaleString()}`)
       .text(`Net Profit: $${(data.summary?.netProfit || 0).toLocaleString()}`)
       .text(`Profit Margin: ${(data.summary?.profitMargin || 0).toFixed(1)}%`);

    doc.moveDown(2);

    // Revenue breakdown
    if (data.revenue?.bySource) {
      doc.fontSize(14).text('Revenue by Source', { underline: true });
      doc.moveDown();
      
      data.revenue.bySource.forEach(source => {
        doc.text(`${source._id}: $${source.amount.toLocaleString()} (${source.count} transactions)`);
      });
      doc.moveDown(2);
    }

    // Expense breakdown
    if (data.expenses?.byCategory) {
      doc.fontSize(14).text('Expenses by Category', { underline: true });
      doc.moveDown();
      
      data.expenses.byCategory.forEach(category => {
        doc.text(`${category._id}: $${category.amount.toLocaleString()} (${category.count} transactions)`);
      });
    }
  }

  async _addKPIContent(doc, data, includeCharts) {
    // KPI Overview
    doc.fontSize(16).text('Key Performance Indicators', { underline: true });
    doc.moveDown();

    const kpis = data.kpis || {};
    
    doc.fontSize(12)
       .text(`Occupancy Rate: ${(kpis.occupancy?.current || 0).toFixed(1)}% (Target: ${kpis.occupancy?.target || 0}%)`)
       .text(`Revenue: $${(kpis.revenue?.current || 0).toLocaleString()}`)
       .text(`Profit Margin: ${(kpis.profitMargin?.current || 0).toFixed(1)}% (Target: ${kpis.profitMargin?.target || 0}%)`)
       .text(`Guest Satisfaction: ${(kpis.guestSatisfaction?.current || 0).toFixed(1)}/5.0 (Target: ${kpis.guestSatisfaction?.target || 0})`)
       .text(`Task Completion Rate: ${(kpis.taskCompletion?.current || 0).toFixed(1)}% (Target: ${kpis.taskCompletion?.target || 0}%)`);

    doc.moveDown(2);

    // Performance metrics
    if (data.performance) {
      doc.fontSize(14).text('Performance Metrics', { underline: true });
      doc.moveDown();
      
      doc.fontSize(12)
         .text(`Revenue per Room: $${(data.performance.revenuePerRoom || 0).toFixed(2)}`)
         .text(`Task Efficiency: ${(data.performance.taskEfficiency || 0).toFixed(1)} minutes avg`)
         .text(`Staff Utilization: ${(data.performance.staffUtilization || 0).toFixed(1)}%`)
         .text(`Guest Retention: ${(data.performance.guestRetention || 0).toFixed(1)}%`);
    }

    // Alerts
    if (data.alerts && data.alerts.length > 0) {
      doc.moveDown(2);
      doc.fontSize(14).text('Alerts', { underline: true });
      doc.moveDown();
      
      data.alerts.forEach(alert => {
        doc.fontSize(10)
           .fillColor(alert.severity === 'high' ? 'red' : alert.severity === 'medium' ? 'orange' : 'black')
           .text(`⚠ ${alert.message}`)
           .fillColor('black');
      });
    }
  }

  _addPDFFooter(doc) {
    doc.fontSize(8)
       .text('Generated by Hotel Management System', 50, doc.page.height - 50)
       .text(`Page ${doc.page.count}`, doc.page.width - 100, doc.page.height - 50);
  }

  // Excel Helper Methods

  async _addBookingWorksheets(workbook, data, dateRange) {
    // Summary worksheet
    const summaryWs = workbook.addWorksheet('Summary');
    this._formatWorksheetHeader(summaryWs, 'Booking Report Summary', dateRange);

    // Add summary data
    summaryWs.addRow(['Metric', 'Value']);
    summaryWs.addRow(['Total Bookings', data.summary?.totalBookings || 0]);
    summaryWs.addRow(['Total Revenue', data.summary?.totalRevenue || 0]);
    summaryWs.addRow(['Average Booking Value', data.summary?.averageBookingValue || 0]);
    summaryWs.addRow(['Occupancy Rate (%)', data.summary?.occupancyRate || 0]);
    summaryWs.addRow(['Guest Satisfaction Score', data.summary?.guestSatisfactionScore || 0]);

    this._formatExcelTable(summaryWs, 'A4:B9');

    // Bookings by date worksheet
    if (data.bookings?.byDate) {
      const dateWs = workbook.addWorksheet('Bookings by Date');
      this._formatWorksheetHeader(dateWs, 'Bookings by Date', dateRange);

      dateWs.addRow(['Date', 'Bookings', 'Revenue', 'Average Value']);
      data.bookings.byDate.forEach(item => {
        const date = this._formatDateFromId(item._id);
        dateWs.addRow([date, item.bookings, item.revenue, item.averageValue]);
      });

      this._formatExcelTable(dateWs, `A4:D${4 + data.bookings.byDate.length}`);
    }

    // Channel performance worksheet
    if (data.bookings?.byChannel) {
      const channelWs = workbook.addWorksheet('Booking Channels');
      this._formatWorksheetHeader(channelWs, 'Booking Channels Performance', dateRange);

      channelWs.addRow(['Channel', 'Bookings', 'Revenue']);
      data.bookings.byChannel.forEach(channel => {
        channelWs.addRow([channel._id, channel.count, channel.revenue]);
      });

      this._formatExcelTable(channelWs, `A4:C${4 + data.bookings.byChannel.length}`);
    }
  }

  async _addFinancialWorksheets(workbook, data, dateRange) {
    // Summary worksheet
    const summaryWs = workbook.addWorksheet('Financial Summary');
    this._formatWorksheetHeader(summaryWs, 'Financial Report Summary', dateRange);

    summaryWs.addRow(['Metric', 'Value']);
    summaryWs.addRow(['Total Revenue', data.summary?.totalRevenue || 0]);
    summaryWs.addRow(['Total Expenses', data.summary?.totalExpenses || 0]);
    summaryWs.addRow(['Gross Profit', data.summary?.grossProfit || 0]);
    summaryWs.addRow(['Net Profit', data.summary?.netProfit || 0]);
    summaryWs.addRow(['Profit Margin (%)', data.summary?.profitMargin || 0]);

    this._formatExcelTable(summaryWs, 'A4:B9');

    // Revenue worksheet
    if (data.revenue?.bySource) {
      const revenueWs = workbook.addWorksheet('Revenue Analysis');
      this._formatWorksheetHeader(revenueWs, 'Revenue by Source', dateRange);

      revenueWs.addRow(['Source', 'Amount', 'Transactions']);
      data.revenue.bySource.forEach(source => {
        revenueWs.addRow([source._id, source.amount, source.count]);
      });

      this._formatExcelTable(revenueWs, `A4:C${4 + data.revenue.bySource.length}`);
    }

    // Expense worksheet
    if (data.expenses?.byCategory) {
      const expenseWs = workbook.addWorksheet('Expense Analysis');
      this._formatWorksheetHeader(expenseWs, 'Expenses by Category', dateRange);

      expenseWs.addRow(['Category', 'Amount', 'Transactions']);
      data.expenses.byCategory.forEach(expense => {
        expenseWs.addRow([expense._id, expense.amount, expense.count]);
      });

      this._formatExcelTable(expenseWs, `A4:C${4 + data.expenses.byCategory.length}`);
    }
  }

  async _addKPIWorksheets(workbook, data, dateRange) {
    // KPI Summary
    const kpiWs = workbook.addWorksheet('KPI Summary');
    this._formatWorksheetHeader(kpiWs, 'Key Performance Indicators', dateRange);

    kpiWs.addRow(['Metric', 'Current', 'Target', 'Status']);
    
    const kpis = data.kpis || {};
    Object.entries(kpis).forEach(([key, kpi]) => {
      if (typeof kpi === 'object' && kpi.current !== undefined) {
        const status = kpi.target ? (kpi.current >= kpi.target ? 'On Target' : 'Below Target') : 'N/A';
        kpiWs.addRow([key, kpi.current, kpi.target || 'N/A', status]);
      }
    });

    this._formatExcelTable(kpiWs, `A4:D${4 + Object.keys(kpis).length}`);

    // Department Performance
    if (data.departments) {
      const deptWs = workbook.addWorksheet('Department Performance');
      this._formatWorksheetHeader(deptWs, 'Department Performance', dateRange);

      deptWs.addRow(['Department', 'Total Tasks', 'Completed', 'Completion Rate (%)', 'Avg Time (min)']);
      data.departments.forEach(dept => {
        deptWs.addRow([
          dept.department,
          dept.totalTasks,
          dept.completedTasks,
          dept.completionRate,
          dept.averageCompletionTime
        ]);
      });

      this._formatExcelTable(deptWs, `A4:E${4 + data.departments.length}`);
    }
  }

  _formatWorksheetHeader(worksheet, title, dateRange) {
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = title;
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:E2');
    worksheet.getCell('A2').value = `${format(dateRange.start, 'MMM dd, yyyy')} - ${format(dateRange.end, 'MMM dd, yyyy')}`;
    worksheet.getCell('A2').font = { size: 12 };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.addRow([]); // Empty row
  }

  _formatExcelTable(worksheet, range) {
    worksheet.addTable({
      name: `Table${Math.random().toString(36).substr(2, 9)}`,
      ref: range,
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
    });
  }

  // Utility Methods

  _ensureExportDirectory() {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  _generateFileName(type, format, dateRange) {
    const startDate = format(dateRange.start, 'yyyy-MM-dd');
    const endDate = format(dateRange.end, 'yyyy-MM-dd');
    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
    
    return `${type}-report_${startDate}_to_${endDate}_${timestamp}.${format}`;
  }

  _formatReportTitle(type) {
    const titles = {
      booking: 'Booking & Operations',
      financial: 'Financial',
      kpi: 'Key Performance Indicators'
    };
    
    return titles[type] || 'Report';
  }

  _formatDateFromId(dateId) {
    if (dateId.day) {
      return format(new Date(dateId.year, dateId.month - 1, dateId.day), 'MMM dd, yyyy');
    } else if (dateId.month) {
      return format(new Date(dateId.year, dateId.month - 1, 1), 'MMM yyyy');
    } else {
      return dateId.year.toString();
    }
  }

  /**
   * Clean up old export files
   */
  async cleanupOldExports(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    try {
      const files = await fs.promises.readdir(this.exportDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const stats = await fs.promises.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.promises.unlink(filePath);
          console.log(`Deleted old export file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old exports:', error);
    }
  }
}

export const exportService = new ExportService();