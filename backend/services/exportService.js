import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure exports directory exists
const exportsDir = path.join(process.cwd(), 'exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

/**
 * Generate PDF report
 */
export const generatePDFReport = async ({ type, data, dateRange, includeCharts = true }) => {
  return new Promise((resolve, reject) => {
    try {
      const timestamp = Date.now();
      const fileName = `${type}-report-${timestamp}.pdf`;
      const filePath = path.join(exportsDir, fileName);
      
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const writeStream = fs.createWriteStream(filePath);
      
      doc.pipe(writeStream);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').fillColor('#1e293b')
         .text(`${type.toUpperCase()} REPORT`, { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').fillColor('#64748b')
         .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      
      if (dateRange?.start && dateRange?.end) {
        doc.text(`Period: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`, { align: 'center' });
      }
      
      doc.moveDown(2);
      
      // Draw separator line
      doc.strokeColor('#e2e8f0').lineWidth(1)
         .moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      
      doc.moveDown();

      // Summary Section
      if (data.summary || data.data?.summary) {
        const summary = data.summary || data.data?.summary;
        
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a')
           .text('Summary', { underline: true });
        doc.moveDown(0.5);
        
        doc.fontSize(11).font('Helvetica');
        
        Object.entries(summary).forEach(([key, value]) => {
          if (typeof value === 'object') return; // Skip nested objects
          
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const displayValue = formatValue(value);
          
          doc.fillColor('#334155').text(`${label}:`, 70, doc.y, { continued: true })
             .fillColor('#0f172a').text(`  ${displayValue}`, { align: 'left' });
          doc.moveDown(0.3);
        });
        
        doc.moveDown();
      }

      // Financial Section
      if (type === 'financial' || type === 'overview') {
        if (data.financial?.summary) {
          addFinancialSection(doc, data.financial.summary);
        }
      }

      // Tasks Section
      if (type === 'tasks') {
        if (data.summary || data.data?.summary) {
          addTasksSection(doc, data.summary || data.data?.summary);
        }
      }

      // KPIs Section
      if (type === 'kpis') {
        if (data.kpis || data.data?.kpis) {
          addKPISection(doc, data.kpis || data.data?.kpis);
        }
      }

      // Bookings Section
      if (type === 'bookings') {
        if (data.summary) {
          addBookingsSection(doc, data.summary);
        }
      }

      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        
        // Footer line
        doc.strokeColor('#e2e8f0').lineWidth(1)
           .moveTo(50, doc.page.height - 50).lineTo(545, doc.page.height - 50).stroke();
        
        doc.fontSize(8).fillColor('#94a3b8')
           .text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 35, { align: 'center' });
        
        doc.text('HotelTaskPro Management System', 50, doc.page.height - 35, { align: 'left' });
        doc.text(new Date().toLocaleDateString(), 50, doc.page.height - 35, { align: 'right' });
      }

      doc.end();

      writeStream.on('finish', () => {
        resolve({
          success: true,
          fileName,
          filePath,
          downloadUrl: `/api/reports/download/${fileName}`
        });
      });

      writeStream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Excel report
 */
export const generateExcelReport = async ({ type, data, dateRange, includeCharts = true }) => {
  try {
    const timestamp = Date.now();
    const fileName = `${type}-report-${timestamp}.xlsx`;
    const filePath = path.join(exportsDir, fileName);
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HotelTaskPro';
    workbook.created = new Date();
    
    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary', {
      properties: { tabColor: { argb: 'FF4F46E5' } }
    });
    
    // Title
    summarySheet.mergeCells('A1:E1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = `${type.toUpperCase()} REPORT`;
    titleCell.font = { size: 18, bold: true, color: { argb: 'FF1e293b' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFe0e7ff' }
    };
    summarySheet.getRow(1).height = 30;
    
    // Date info
    summarySheet.mergeCells('A2:E2');
    const dateCell = summarySheet.getCell('A2');
    dateCell.value = `Generated: ${new Date().toLocaleString()}`;
    dateCell.font = { size: 10, color: { argb: 'FF64748b' } };
    dateCell.alignment = { horizontal: 'center' };
    
    if (dateRange?.start && dateRange?.end) {
      summarySheet.mergeCells('A3:E3');
      const periodCell = summarySheet.getCell('A3');
      periodCell.value = `Period: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`;
      periodCell.font = { size: 10, color: { argb: 'FF64748b' } };
      periodCell.alignment = { horizontal: 'center' };
    }
    
    let currentRow = 5;
    
    // Summary Data
    if (data.summary || data.data?.summary) {
      const summary = data.summary || data.data?.summary;
      
      summarySheet.getCell(`A${currentRow}`).value = 'Summary';
      summarySheet.getCell(`A${currentRow}`).font = { size: 14, bold: true };
      summarySheet.getCell(`A${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFf1f5f9' }
      };
      currentRow += 2;
      
      // Headers
      summarySheet.getCell(`A${currentRow}`).value = 'Metric';
      summarySheet.getCell(`B${currentRow}`).value = 'Value';
      summarySheet.getRow(currentRow).font = { bold: true };
      summarySheet.getRow(currentRow).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFe0e7ff' }
      };
      currentRow++;
      
      Object.entries(summary).forEach(([key, value]) => {
        if (typeof value === 'object') return;
        
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        summarySheet.getCell(`A${currentRow}`).value = label;
        summarySheet.getCell(`B${currentRow}`).value = formatValue(value);
        currentRow++;
      });
    }
    
    // Auto-fit columns
    summarySheet.columns = [
      { key: 'metric', width: 30 },
      { key: 'value', width: 20 },
      { key: 'c', width: 15 },
      { key: 'd', width: 15 },
      { key: 'e', width: 15 }
    ];
    
    // Add borders to all used cells
    for (let row = 1; row <= currentRow; row++) {
      for (let col = 1; col <= 5; col++) {
        const cell = summarySheet.getRow(row).getCell(col);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFe2e8f0' } },
          left: { style: 'thin', color: { argb: 'FFe2e8f0' } },
          bottom: { style: 'thin', color: { argb: 'FFe2e8f0' } },
          right: { style: 'thin', color: { argb: 'FFe2e8f0' } }
        };
      }
    }
    
    // Financial Sheet
    if (type === 'financial' || type === 'overview') {
      if (data.financial) {
        addFinancialSheetToExcel(workbook, data.financial);
      }
    }
    
    // Tasks Sheet
    if (type === 'tasks' && data.byDepartment) {
      addTasksSheetToExcel(workbook, data);
    }
    
    // KPIs Sheet
    if (type === 'kpis' && (data.kpis || data.data?.kpis)) {
      addKPISheetToExcel(workbook, data.kpis || data.data?.kpis);
    }
    
    await workbook.xlsx.writeFile(filePath);
    
    return {
      success: true,
      fileName,
      filePath,
      downloadUrl: `/api/reports/download/${fileName}`
    };
    
  } catch (error) {
    throw error;
  }
};

// Helper Functions

function formatValue(value) {
  if (typeof value === 'number') {
    if (value % 1 === 0) {
      return value.toLocaleString();
    }
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return value;
}

function addFinancialSection(doc, summary) {
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a')
     .text('Financial Overview', { underline: true });
  doc.moveDown(0.5);
  
  doc.fontSize(11).font('Helvetica');
  
  const metrics = [
    { label: 'Total Revenue', key: 'totalRevenue', prefix: 'LKR' },
    { label: 'Total Expenses', key: 'totalExpenses', prefix: 'LKR' },
    { label: 'Net Profit', key: 'netProfit', prefix: 'LKR' },
    { label: 'Profit Margin', key: 'profitMargin', suffix: '%' },
    { label: 'Average Daily Revenue', key: 'avgDailyRevenue', prefix: 'LKR' },
    { label: 'Occupancy Rate', key: 'occupancyRate', suffix: '%' }
  ];
  
  metrics.forEach(({ label, key, prefix, suffix }) => {
    if (summary[key] !== undefined) {
      const value = formatValue(summary[key]);
      const displayValue = `${prefix ? prefix + ' ' : ''}${value}${suffix || ''}`;
      
      doc.fillColor('#334155').text(`${label}:`, 70, doc.y, { continued: true })
         .fillColor('#0f172a').text(`  ${displayValue}`, { align: 'left' });
      doc.moveDown(0.3);
    }
  });
  
  doc.moveDown();
}

function addTasksSection(doc, summary) {
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a')
     .text('Task Statistics', { underline: true });
  doc.moveDown(0.5);
  
  doc.fontSize(11).font('Helvetica');
  
  const metrics = [
    { label: 'Total Tasks', key: 'totalTasks' },
    { label: 'Completed Tasks', key: 'completedTasks' },
    { label: 'Pending Tasks', key: 'pendingTasks' },
    { label: 'In Progress', key: 'inProgressTasks' },
    { label: 'Completion Rate', key: 'completionRate', suffix: '%' }
  ];
  
  metrics.forEach(({ label, key, suffix }) => {
    if (summary[key] !== undefined) {
      const value = formatValue(summary[key]);
      const displayValue = `${value}${suffix || ''}`;
      
      doc.fillColor('#334155').text(`${label}:`, 70, doc.y, { continued: true })
         .fillColor('#0f172a').text(`  ${displayValue}`, { align: 'left' });
      doc.moveDown(0.3);
    }
  });
  
  doc.moveDown();
}

function addKPISection(doc, kpis) {
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a')
     .text('Key Performance Indicators', { underline: true });
  doc.moveDown(0.5);
  
  doc.fontSize(11).font('Helvetica');
  
  const metrics = [
    { label: 'Occupancy Rate', key: 'occupancy', suffix: '%' },
    { label: 'Revenue', key: 'revenue', prefix: 'LKR' },
    { label: 'Profit Margin', key: 'profitMargin', suffix: '%' },
    { label: 'Guest Satisfaction', key: 'guestSatisfaction', suffix: '/5' },
    { label: 'Task Completion', key: 'taskCompletion', suffix: '%' },
    { label: 'Average Room Rate', key: 'averageRoomRate', prefix: 'LKR' }
  ];
  
  metrics.forEach(({ label, key, prefix, suffix }) => {
    if (kpis[key]?.current !== undefined) {
      const value = formatValue(kpis[key].current);
      const displayValue = `${prefix ? prefix + ' ' : ''}${value}${suffix || ''}`;
      
      doc.fillColor('#334155').text(`${label}:`, 70, doc.y, { continued: true })
         .fillColor('#0f172a').text(`  ${displayValue}`, { align: 'left' });
      doc.moveDown(0.3);
    }
  });
  
  doc.moveDown();
}

function addBookingsSection(doc, summary) {
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a')
     .text('Booking Statistics', { underline: true });
  doc.moveDown(0.5);
  
  doc.fontSize(11).font('Helvetica');
  
  Object.entries(summary).forEach(([key, value]) => {
    if (typeof value === 'object') return;
    
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const displayValue = formatValue(value);
    
    doc.fillColor('#334155').text(`${label}:`, 70, doc.y, { continued: true })
       .fillColor('#0f172a').text(`  ${displayValue}`, { align: 'left' });
    doc.moveDown(0.3);
  });
  
  doc.moveDown();
}

function addFinancialSheetToExcel(workbook, financial) {
  const sheet = workbook.addWorksheet('Financial Details', {
    properties: { tabColor: { argb: 'FF22c55e' } }
  });
  
  // Title
  sheet.mergeCells('A1:C1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'FINANCIAL DETAILS';
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFd1fae5' }
  };
  
  let row = 3;
  
  if (financial.summary) {
    sheet.getCell(`A${row}`).value = 'Metric';
    sheet.getCell(`B${row}`).value = 'Amount (LKR)';
    sheet.getRow(row).font = { bold: true };
    sheet.getRow(row).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFe0e7ff' }
    };
    row++;
    
    Object.entries(financial.summary).forEach(([key, value]) => {
      if (typeof value !== 'object') {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        sheet.getCell(`A${row}`).value = label;
        sheet.getCell(`B${row}`).value = typeof value === 'number' ? value : value;
        row++;
      }
    });
  }
  
  sheet.columns = [
    { key: 'metric', width: 30 },
    { key: 'value', width: 20 },
    { key: 'change', width: 15 }
  ];
}

function addTasksSheetToExcel(workbook, data) {
  const sheet = workbook.addWorksheet('Tasks by Department', {
    properties: { tabColor: { argb: 'FF3b82f6' } }
  });
  
  sheet.mergeCells('A1:D1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'TASKS BY DEPARTMENT';
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFdbeafe' }
  };
  
  let row = 3;
  
  sheet.getCell(`A${row}`).value = 'Department';
  sheet.getCell(`B${row}`).value = 'Total';
  sheet.getCell(`C${row}`).value = 'Completed';
  sheet.getCell(`D${row}`).value = 'Pending';
  sheet.getRow(row).font = { bold: true };
  sheet.getRow(row).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFe0e7ff' }
  };
  row++;
  
  if (data.byDepartment) {
    data.byDepartment.forEach(dept => {
      sheet.getCell(`A${row}`).value = dept.department || dept._id || 'Unknown';
      sheet.getCell(`B${row}`).value = dept.total || 0;
      sheet.getCell(`C${row}`).value = dept.completed || 0;
      sheet.getCell(`D${row}`).value = dept.pending || 0;
      row++;
    });
  }
  
  sheet.columns = [
    { key: 'department', width: 25 },
    { key: 'total', width: 15 },
    { key: 'completed', width: 15 },
    { key: 'pending', width: 15 }
  ];
}

function addKPISheetToExcel(workbook, kpis) {
  const sheet = workbook.addWorksheet('KPI Details', {
    properties: { tabColor: { argb: 'FFf59e0b' } }
  });
  
  sheet.mergeCells('A1:C1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'KEY PERFORMANCE INDICATORS';
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFfef3c7' }
  };
  
  let row = 3;
  
  sheet.getCell(`A${row}`).value = 'KPI';
  sheet.getCell(`B${row}`).value = 'Current Value';
  sheet.getCell(`C${row}`).value = 'Unit';
  sheet.getRow(row).font = { bold: true };
  sheet.getRow(row).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFe0e7ff' }
  };
  row++;
  
  const kpiMetrics = [
    { label: 'Occupancy Rate', key: 'occupancy', unit: '%' },
    { label: 'Revenue', key: 'revenue', unit: 'LKR' },
    { label: 'Profit Margin', key: 'profitMargin', unit: '%' },
    { label: 'Guest Satisfaction', key: 'guestSatisfaction', unit: '/5' },
    { label: 'Task Completion', key: 'taskCompletion', unit: '%' },
    { label: 'Average Room Rate', key: 'averageRoomRate', unit: 'LKR' }
  ];
  
  kpiMetrics.forEach(({ label, key, unit }) => {
    if (kpis[key]?.current !== undefined) {
      sheet.getCell(`A${row}`).value = label;
      sheet.getCell(`B${row}`).value = kpis[key].current;
      sheet.getCell(`C${row}`).value = unit;
      row++;
    }
  });
  
  sheet.columns = [
    { key: 'kpi', width: 30 },
    { key: 'value', width: 20 },
    { key: 'unit', width: 15 }
  ];
}

export default {
  generatePDFReport,
  generateExcelReport
};
