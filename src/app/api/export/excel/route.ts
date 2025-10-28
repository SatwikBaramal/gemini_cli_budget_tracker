import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import ExcelJS from 'exceljs';
import { connectToDatabase } from '@/lib/mongodb';
import { Expense, IExpense } from '@/lib/models/Expense';
import { Goal, IGoal } from '@/lib/models/Goal';
import { Setting, ISetting } from '@/lib/models/Setting';
import { FixedExpense, IFixedExpense } from '@/lib/models/FixedExpense';
import { FixedExpenseOverride, IFixedExpenseOverride } from '@/lib/models/FixedExpenseOverride';
import { MonthlyIncomeOverride, IMonthlyIncomeOverride } from '@/lib/models/MonthlyIncomeOverride';
import { Types } from 'mongoose';

// Force this route to use Node.js runtime (not Edge) to support mongoose and exceljs
export const runtime = 'nodejs';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface YearData {
  expenses: (IExpense & { _id: Types.ObjectId })[];
  settings: (ISetting & { _id: Types.ObjectId })[];
  fixedExpenses: (IFixedExpense & { _id: Types.ObjectId })[];
  fixedExpenseOverrides: (IFixedExpenseOverride & { _id: Types.ObjectId })[];
  monthlyIncomeOverrides: (IMonthlyIncomeOverride & { _id: Types.ObjectId })[];
}

interface MonthlyData {
  expenses: (IExpense & { _id: Types.ObjectId })[];
  fixedExpenses: (IFixedExpense & { _id: Types.ObjectId })[];
  fixedExpenseOverrides: (IFixedExpenseOverride & { _id: Types.ObjectId })[];
}

interface FixedExpenseData {
  fixedExpenses: (IFixedExpense & { _id: Types.ObjectId })[];
  fixedExpenseOverrides: (IFixedExpenseOverride & { _id: Types.ObjectId })[];
}

interface IncomeData {
  settings: (ISetting & { _id: Types.ObjectId })[];
  monthlyIncomeOverrides: (IMonthlyIncomeOverride & { _id: Types.ObjectId })[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const yearsParam = searchParams.get('years');

    if (!yearsParam) {
      return NextResponse.json({ error: 'Years parameter is required' }, { status: 400 });
    }

    const years = yearsParam.split(',').map(y => parseInt(y.trim())).filter(y => !isNaN(y));

    if (years.length === 0) {
      return NextResponse.json({ error: 'Invalid years parameter' }, { status: 400 });
    }

    await connectToDatabase();

    // Fetch all data
    const [expenses, goals, settings, fixedExpenses, fixedExpenseOverrides, monthlyIncomeOverrides] = await Promise.all([
      Expense.find({ userId, year: { $in: years } }).lean(),
      Goal.find({ userId }).lean(),
      Setting.find({ userId, year: { $in: years } }).lean(),
      FixedExpense.find({ userId, year: { $in: years } }).lean(),
      FixedExpenseOverride.find({ userId, year: { $in: years } }).lean(),
      MonthlyIncomeOverride.find({ userId, year: { $in: years } }).lean(),
    ]);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Vivaranam Budget Tracker';
    workbook.created = new Date();

    // Process each year
    for (const year of years.sort()) {
      // Add Overview Sheet
      await addOverviewSheet(workbook, year, {
        expenses: expenses.filter(e => e.year === year),
        settings: settings.filter(s => s.year === year),
        fixedExpenses: fixedExpenses.filter(f => f.year === year),
        fixedExpenseOverrides: fixedExpenseOverrides.filter(o => o.year === year),
        monthlyIncomeOverrides: monthlyIncomeOverrides.filter(m => m.year === year),
      });

      // Add Monthly Sheets (only for months with data)
      await addMonthlySheets(workbook, year, {
        expenses: expenses.filter(e => e.year === year),
        fixedExpenses: fixedExpenses.filter(f => f.year === year),
        fixedExpenseOverrides: fixedExpenseOverrides.filter(o => o.year === year),
      });

      // Add Yearly Expenses Sheet
      await addYearlyExpensesSheet(workbook, year, expenses.filter(e => e.year === year && e.type === 'yearly'));

      // Add Fixed Expenses Sheet
      await addFixedExpensesSheet(workbook, year, {
        fixedExpenses: fixedExpenses.filter(f => f.year === year),
        fixedExpenseOverrides: fixedExpenseOverrides.filter(o => o.year === year),
      });

      // Add Income Sheet
      await addIncomeSheet(workbook, year, {
        settings: settings.filter(s => s.year === year),
        monthlyIncomeOverrides: monthlyIncomeOverrides.filter(m => m.year === year),
      });
    }

    // Add Goals Sheet (all years combined, as goals are not year-specific)
    await addGoalsSheet(workbook, goals);

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=Budget_Data_${years.join('-')}.xlsx`,
      },
    });

  } catch (error) {
    console.error('Error generating Excel export:', error);
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}

async function addOverviewSheet(workbook: ExcelJS.Workbook, year: number, data: YearData) {
  const worksheet = workbook.addWorksheet(`Overview ${year}`);

  // Title
  worksheet.mergeCells('A1:D1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `Budget Overview - ${year}`;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).height = 30;

  worksheet.addRow([]);

  // Calculate totals
  const monthlyExpenses = data.expenses.filter((e) => e.type === 'monthly');
  const yearlyExpenses = data.expenses.filter((e) => e.type === 'yearly');
  
  const totalMonthlyExpenses = monthlyExpenses.reduce((sum: number, e) => sum + e.amount, 0);
  const totalYearlyExpenses = yearlyExpenses.reduce((sum: number, e) => sum + e.amount, 0);
  
  // Calculate fixed expenses total
  let totalFixedExpenses = 0;
  data.fixedExpenses.forEach((fe) => {
    fe.applicableMonths.forEach((month: number) => {
      const override = data.fixedExpenseOverrides.find(
        (o) => o.fixedExpenseId.toString() === fe._id.toString() && o.month === month
      );
      totalFixedExpenses += override ? override.overrideAmount : fe.amount;
    });
  });

  // Get monthly income
  const monthlyIncomeSetting = data.settings.find((s) => s.key === 'monthlyIncome');
  const monthlyIncome = monthlyIncomeSetting ? parseFloat(monthlyIncomeSetting.value) : 0;

  // Calculate total income with overrides
  let actualTotalIncome = 0;
  for (let month = 1; month <= 12; month++) {
    const override = data.monthlyIncomeOverrides.find((o) => o.month === month);
    actualTotalIncome += override ? override.overrideAmount : monthlyIncome;
  }

  const totalExpenses = totalMonthlyExpenses + totalYearlyExpenses + totalFixedExpenses;
  const netSavings = actualTotalIncome - totalExpenses;

  // Summary table
  const summaryData = [
    ['Category', 'Amount (₹)'],
    ['Total Income', actualTotalIncome],
    ['Monthly Expenses', totalMonthlyExpenses],
    ['Yearly Expenses', totalYearlyExpenses],
    ['Fixed Expenses', totalFixedExpenses],
    ['Total Expenses', totalExpenses],
    ['Net Savings', netSavings],
  ];

  summaryData.forEach((row, index) => {
    const excelRow = worksheet.addRow(row);
    
    if (index === 0) {
      // Header row
      excelRow.font = { bold: true };
      excelRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
      };
    }
    
    // Format currency
    if (index > 0) {
      excelRow.getCell(2).numFmt = '₹#,##0.00';
      
      // Color net savings
      if (index === summaryData.length - 1) {
        excelRow.font = { bold: true };
        excelRow.getCell(2).font = {
          ...excelRow.getCell(2).font,
          color: { argb: netSavings >= 0 ? 'FF00B050' : 'FFFF0000' }
        };
      }
    }

    excelRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Auto-fit columns
  worksheet.columns = [
    { key: 'category', width: 25 },
    { key: 'amount', width: 20 },
  ];

  // Freeze header
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];
}

async function addMonthlySheets(workbook: ExcelJS.Workbook, year: number, data: MonthlyData) {
  // Find months with data
  const monthsWithData = new Set<number>();
  
  data.expenses.forEach((e) => {
    if (e.type === 'monthly' && e.month) {
      monthsWithData.add(e.month);
    }
  });

  data.fixedExpenses.forEach((fe) => {
    fe.applicableMonths.forEach((month: number) => monthsWithData.add(month));
  });

  const sortedMonths = Array.from(monthsWithData).sort((a, b) => a - b);

  for (const month of sortedMonths) {
    const worksheet = workbook.addWorksheet(`${MONTH_NAMES[month - 1]} ${year}`);

    // Title
    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${MONTH_NAMES[month - 1]} ${year} - Expenses`;
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).height = 25;

    worksheet.addRow([]);

    // Headers
    const headerRow = worksheet.addRow(['Date', 'Expense Name', 'Amount (₹)', 'Type']);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' }
    };
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Monthly expenses
    const monthlyExpenses = data.expenses.filter((e) => e.type === 'monthly' && e.month === month);
    monthlyExpenses.forEach((expense) => {
      const row = worksheet.addRow([
        expense.date || '',
        expense.name,
        expense.amount,
        'Variable'
      ]);
      row.getCell(3).numFmt = '₹#,##0.00';
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Fixed expenses
    const applicableFixedExpenses = data.fixedExpenses.filter((fe) => 
      fe.applicableMonths.includes(month)
    );

    applicableFixedExpenses.forEach((fixedExpense) => {
      const override = data.fixedExpenseOverrides.find(
        (o) => o.fixedExpenseId.toString() === fixedExpense._id.toString() && o.month === month
      );
      const amount = override ? override.overrideAmount : fixedExpense.amount;
      const date = override ? override.date : '';

      const row = worksheet.addRow([
        date,
        fixedExpense.name,
        amount,
        'Fixed'
      ]);
      row.getCell(3).numFmt = '₹#,##0.00';
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Subtotal
    const totalMonthlyExpenses = monthlyExpenses.reduce((sum: number, e) => sum + e.amount, 0);
    const totalFixedExpenses = applicableFixedExpenses.reduce((sum: number, fe) => {
      const override = data.fixedExpenseOverrides.find(
        (o) => o.fixedExpenseId.toString() === fe._id.toString() && o.month === month
      );
      return sum + (override ? override.overrideAmount : fe.amount);
    }, 0);
    const total = totalMonthlyExpenses + totalFixedExpenses;

    worksheet.addRow([]);
    const totalRow = worksheet.addRow(['', 'Total', total, '']);
    totalRow.font = { bold: true };
    totalRow.getCell(3).numFmt = '₹#,##0.00';
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF4B084' }
    };
    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
      };
    });

    // Auto-fit columns
    worksheet.columns = [
      { key: 'date', width: 15 },
      { key: 'name', width: 30 },
      { key: 'amount', width: 15 },
      { key: 'type', width: 12 },
    ];

    // Freeze header
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];
  }
}

async function addYearlyExpensesSheet(workbook: ExcelJS.Workbook, year: number, yearlyExpenses: (IExpense & { _id: Types.ObjectId })[]) {
  const worksheet = workbook.addWorksheet(`Yearly Expenses ${year}`);

  // Title
  worksheet.mergeCells('A1:C1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `Yearly Expenses - ${year}`;
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFC000' }
  };
  titleCell.font = { ...titleCell.font, color: { argb: 'FF000000' } };
  worksheet.getRow(1).height = 25;

  worksheet.addRow([]);

  // Headers
  const headerRow = worksheet.addRow(['Expense Name', 'Amount (₹)', 'Date']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' }
  };
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Data rows
  let total = 0;
  yearlyExpenses.forEach((expense) => {
    const row = worksheet.addRow([
      expense.name,
      expense.amount,
      expense.date || ''
    ]);
    row.getCell(2).numFmt = '₹#,##0.00';
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    total += expense.amount;
  });

  // Total
  if (yearlyExpenses.length > 0) {
    worksheet.addRow([]);
    const totalRow = worksheet.addRow(['Total', total, '']);
    totalRow.font = { bold: true };
    totalRow.getCell(2).numFmt = '₹#,##0.00';
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF4B084' }
    };
    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
      };
    });
  }

  // Auto-fit columns
  worksheet.columns = [
    { key: 'name', width: 35 },
    { key: 'amount', width: 15 },
    { key: 'date', width: 15 },
  ];

  // Freeze header
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];
}

async function addFixedExpensesSheet(workbook: ExcelJS.Workbook, year: number, data: FixedExpenseData) {
  const worksheet = workbook.addWorksheet(`Fixed Expenses ${year}`);

  // Title
  worksheet.mergeCells('A1:D1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `Fixed Expenses - ${year}`;
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF5B9BD5' }
  };
  titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).height = 25;

  worksheet.addRow([]);

  // Headers
  const headerRow = worksheet.addRow(['Expense Name', 'Base Amount (₹)', 'Applicable Months', 'Has Overrides']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' }
  };
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Data rows
  data.fixedExpenses.forEach((fixedExpense) => {
    const monthNames = fixedExpense.applicableMonths.map((m: number) => MONTH_NAMES[m - 1]).join(', ');
    const hasOverrides = data.fixedExpenseOverrides.some(
      (o) => o.fixedExpenseId.toString() === fixedExpense._id.toString()
    );

    const row = worksheet.addRow([
      fixedExpense.name,
      fixedExpense.amount,
      monthNames,
      hasOverrides ? 'Yes' : 'No'
    ]);
    row.getCell(2).numFmt = '₹#,##0.00';
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Auto-fit columns
  worksheet.columns = [
    { key: 'name', width: 30 },
    { key: 'amount', width: 20 },
    { key: 'months', width: 40 },
    { key: 'overrides', width: 15 },
  ];

  // Freeze header
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];
}

async function addIncomeSheet(workbook: ExcelJS.Workbook, year: number, data: IncomeData) {
  const worksheet = workbook.addWorksheet(`Income ${year}`);

  // Title
  worksheet.mergeCells('A1:D1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `Income - ${year}`;
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF00B050' }
  };
  titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).height = 25;

  worksheet.addRow([]);

  // Headers
  const headerRow = worksheet.addRow(['Month', 'Base Income (₹)', 'Override Amount (₹)', 'Actual Income (₹)']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' }
  };
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Get base monthly income
  const monthlyIncomeSetting = data.settings.find((s) => s.key === 'monthlyIncome');
  const baseIncome = monthlyIncomeSetting ? parseFloat(monthlyIncomeSetting.value) : 0;

  // Data rows for each month
  let totalIncome = 0;
  for (let month = 1; month <= 12; month++) {
    const override = data.monthlyIncomeOverrides.find((o) => o.month === month);
    const actualIncome = override ? override.overrideAmount : baseIncome;
    totalIncome += actualIncome;

    const row = worksheet.addRow([
      MONTH_NAMES[month - 1],
      baseIncome,
      override ? override.overrideAmount : '',
      actualIncome
    ]);

    row.getCell(2).numFmt = '₹#,##0.00';
    if (override) {
      row.getCell(3).numFmt = '₹#,##0.00';
    }
    row.getCell(4).numFmt = '₹#,##0.00';

    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }

  // Total
  worksheet.addRow([]);
  const totalRow = worksheet.addRow(['Total', baseIncome * 12, '', totalIncome]);
  totalRow.font = { bold: true };
  totalRow.getCell(2).numFmt = '₹#,##0.00';
  totalRow.getCell(4).numFmt = '₹#,##0.00';
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFC6E0B4' }
  };
  totalRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'medium' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' }
    };
  });

  // Auto-fit columns
  worksheet.columns = [
    { key: 'month', width: 15 },
    { key: 'base', width: 18 },
    { key: 'override', width: 20 },
    { key: 'actual', width: 18 },
  ];

  // Freeze header
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];
}

async function addGoalsSheet(workbook: ExcelJS.Workbook, goals: (IGoal & { _id: Types.ObjectId })[]) {
  const worksheet = workbook.addWorksheet('Goals');

  // Title
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'Savings Goals';
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF9966FF' }
  };
  titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).height = 25;

  worksheet.addRow([]);

  // Headers
  const headerRow = worksheet.addRow(['Goal Name', 'Target Amount (₹)', 'Current Amount (₹)', 'Progress %', 'Status', 'Deadline']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' }
  };
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Data rows
  goals.forEach((goal) => {
    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount * 100).toFixed(2) : '0.00';
    
    const row = worksheet.addRow([
      goal.name,
      goal.targetAmount,
      goal.currentAmount,
      parseFloat(progress),
      goal.status,
      goal.deadline
    ]);

    row.getCell(2).numFmt = '₹#,##0.00';
    row.getCell(3).numFmt = '₹#,##0.00';
    row.getCell(4).numFmt = '0.00"%"';

    // Color code status
    const statusCell = row.getCell(5);
    if (goal.status === 'completed') {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC6EFCE' }
      };
    } else if (goal.status === 'archived') {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }

    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Add contributions section
  worksheet.addRow([]);
  worksheet.addRow([]);
  
  const contributionsTitleRow = worksheet.addRow(['Goal Contributions History']);
  contributionsTitleRow.font = { bold: true, size: 12 };
  contributionsTitleRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE7E6E6' }
  };

  worksheet.addRow([]);

  // Contributions headers
  const contribHeaderRow = worksheet.addRow(['Goal Name', 'Date', 'Amount (₹)', 'Type', 'Note']);
  contribHeaderRow.font = { bold: true };
  contribHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' }
  };
  contribHeaderRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Add contributions for each goal
  goals.forEach((goal) => {
    if (goal.contributions && goal.contributions.length > 0) {
      goal.contributions.forEach((contrib) => {
        const row = worksheet.addRow([
          goal.name,
          contrib.date,
          contrib.amount,
          contrib.type,
          contrib.note || ''
        ]);

        row.getCell(3).numFmt = '₹#,##0.00';

        // Color code type
        if (contrib.type === 'withdrawal') {
          row.getCell(3).font = { color: { argb: 'FFFF0000' } };
        } else {
          row.getCell(3).font = { color: { argb: 'FF00B050' } };
        }

        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });
    }
  });

  // Auto-fit columns
  worksheet.columns = [
    { key: 'name', width: 30 },
    { key: 'target', width: 18 },
    { key: 'current', width: 18 },
    { key: 'progress', width: 12 },
    { key: 'status', width: 12 },
    { key: 'deadline', width: 15 },
  ];

  // Freeze header
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];
}

