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
import { decrypt } from '@/lib/encryption';
import OpenAI from 'openai';

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
    const monthsParam = searchParams.get('months');
    const aiParam = searchParams.get('ai');

    if (!yearsParam) {
      return NextResponse.json({ error: 'Years parameter is required' }, { status: 400 });
    }

    const years = yearsParam.split(',').map(y => parseInt(y.trim())).filter(y => !isNaN(y));
    const monthFilter: number[] | null = monthsParam
      ? monthsParam.split(',').map(m => parseInt(m.trim())).filter(m => !isNaN(m) && m >= 1 && m <= 12)
      : null;
    const includeAI = aiParam === 'true';

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

    // Generate AI insights if requested
    let aiInsights: Record<string, string> | null = null;
    if (includeAI) {
      aiInsights = await generateAIInsights(
        years,
        monthFilter,
        {
          expenses: expenses as (IExpense & { _id: Types.ObjectId })[],
          settings: settings as (ISetting & { _id: Types.ObjectId })[],
          fixedExpenses: fixedExpenses as (IFixedExpense & { _id: Types.ObjectId })[],
          fixedExpenseOverrides: fixedExpenseOverrides as (IFixedExpenseOverride & { _id: Types.ObjectId })[],
          monthlyIncomeOverrides: monthlyIncomeOverrides as (IMonthlyIncomeOverride & { _id: Types.ObjectId })[],
        }
      );
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Vivaranam Budget Tracker';
    workbook.created = new Date();

    const hasMonthFilter = monthFilter !== null && monthFilter.length > 0;

    // Process each year
    for (const year of years.sort()) {
      const yearExpenses = expenses.filter(e => e.year === year) as (IExpense & { _id: Types.ObjectId })[];
      const yearSettings = settings.filter(s => s.year === year) as (ISetting & { _id: Types.ObjectId })[];
      const yearFixedExpenses = fixedExpenses.filter(f => f.year === year) as (IFixedExpense & { _id: Types.ObjectId })[];
      const yearFixedOverrides = fixedExpenseOverrides.filter(o => o.year === year) as (IFixedExpenseOverride & { _id: Types.ObjectId })[];
      const yearIncomeOverrides = monthlyIncomeOverrides.filter(m => m.year === year) as (IMonthlyIncomeOverride & { _id: Types.ObjectId })[];

      if (!hasMonthFilter) {
        // Full year export: all sheets as before
        await addOverviewSheet(workbook, year, {
          expenses: yearExpenses,
          settings: yearSettings,
          fixedExpenses: yearFixedExpenses,
          fixedExpenseOverrides: yearFixedOverrides,
          monthlyIncomeOverrides: yearIncomeOverrides,
        });
      }

      // Monthly Sheets (filtered or all)
      await addMonthlySheets(workbook, year, {
        expenses: yearExpenses,
        fixedExpenses: yearFixedExpenses,
        fixedExpenseOverrides: yearFixedOverrides,
      }, monthFilter, includeAI, aiInsights);

      if (!hasMonthFilter) {
        // Yearly, Fixed, Income sheets only for full year export
        await addYearlyExpensesSheet(workbook, year, yearExpenses.filter(e => e.type === 'yearly'));

        await addFixedExpensesSheet(workbook, year, {
          fixedExpenses: yearFixedExpenses,
          fixedExpenseOverrides: yearFixedOverrides,
        });

        await addIncomeSheet(workbook, year, {
          settings: yearSettings,
          monthlyIncomeOverrides: yearIncomeOverrides,
        });
      }
    }

    // Goals sheet always included
    await addGoalsSheet(workbook, goals as (IGoal & { _id: Types.ObjectId })[]);

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Generate filename
    const yearPart = years.length === 1 ? `${years[0]}` : `${Math.min(...years)}-${Math.max(...years)}`;
    let filename: string;
    if (hasMonthFilter) {
      const monthNamesPart = monthFilter!.sort((a, b) => a - b).map(m => MONTH_NAMES[m - 1]).join('-');
      filename = `Budget_Data_${yearPart}_${monthNamesPart}.xlsx`;
    } else {
      filename = `Budget_Data_${yearPart}.xlsx`;
    }

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${filename}`,
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

async function generateAIInsights(
  years: number[],
  monthFilter: number[] | null,
  data: {
    expenses: (IExpense & { _id: Types.ObjectId })[];
    settings: (ISetting & { _id: Types.ObjectId })[];
    fixedExpenses: (IFixedExpense & { _id: Types.ObjectId })[];
    fixedExpenseOverrides: (IFixedExpenseOverride & { _id: Types.ObjectId })[];
    monthlyIncomeOverrides: (IMonthlyIncomeOverride & { _id: Types.ObjectId })[];
  }
): Promise<Record<string, string> | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  try {
    // Build financial context for the LLM
    let context = '';

    for (const year of years.sort()) {
      const yearExpenses = data.expenses.filter(e => e.year === year);
      const yearSettings = data.settings.filter(s => s.year === year);
      const yearFixedExpenses = data.fixedExpenses.filter(f => f.year === year);
      const yearFixedOverrides = data.fixedExpenseOverrides.filter(o => o.year === year);
      const yearIncomeOverrides = data.monthlyIncomeOverrides.filter(m => m.year === year);

      const monthlyIncomeSetting = yearSettings.find(s => s.key === 'monthlyIncome');
      const baseIncome = monthlyIncomeSetting ? parseFloat(decrypt(monthlyIncomeSetting.value)) : 0;

      context += `\n--- ${year} ---\n`;
      context += `Base Monthly Income: ₹${baseIncome.toFixed(0)}\n`;

      // Fixed expenses summary
      if (yearFixedExpenses.length > 0) {
        context += `Fixed Expenses: ${yearFixedExpenses.map(fe => `${fe.name} ₹${parseFloat(decrypt(fe.amount.toString())).toFixed(0)}`).join(', ')}\n`;
      }

      for (let month = 1; month <= 12; month++) {
        const monthExpenses = yearExpenses.filter(e => e.type === 'monthly' && e.month === month);
        const applicableFixed = yearFixedExpenses.filter(fe => fe.applicableMonths.includes(month));

        const incomeOverride = yearIncomeOverrides.find(o => o.month === month);
        const actualIncome = incomeOverride ? parseFloat(decrypt(incomeOverride.overrideAmount.toString())) : baseIncome;

        let fixedTotal = 0;
        applicableFixed.forEach(fe => {
          const override = yearFixedOverrides.find(
            o => o.fixedExpenseId.toString() === fe._id.toString() && o.month === month
          );
          fixedTotal += override ? parseFloat(decrypt(override.overrideAmount.toString())) : parseFloat(decrypt(fe.amount.toString()));
        });

        const variableTotal = monthExpenses.reduce((sum, e) => sum + parseFloat(decrypt(e.amount.toString())), 0);
        const total = variableTotal + fixedTotal;

        if (monthExpenses.length > 0 || fixedTotal > 0) {
          const topExpenses = monthExpenses
            .sort((a, b) => parseFloat(decrypt(b.amount.toString())) - parseFloat(decrypt(a.amount.toString())))
            .slice(0, 5)
            .map(e => `${e.name}: ₹${parseFloat(decrypt(e.amount.toString())).toFixed(0)}`)
            .join(', ');

          context += `${MONTH_NAMES[month - 1]}: Income ₹${actualIncome.toFixed(0)}, Variable ₹${variableTotal.toFixed(0)}, Fixed ₹${fixedTotal.toFixed(0)}, Total ₹${total.toFixed(0)}, Savings ₹${(actualIncome - total).toFixed(0)}`;
          if (topExpenses) context += ` | Top: ${topExpenses}`;
          context += `\n`;
        }
      }
    }

    // Determine which months to get insights for
    const requestedMonths: string[] = [];
    for (const year of years.sort()) {
      const months = monthFilter && monthFilter.length > 0 ? monthFilter : Array.from({ length: 12 }, (_, i) => i + 1);
      for (const month of months) {
        requestedMonths.push(`${MONTH_NAMES[month - 1]} ${year}`);
      }
    }

    const client = new OpenAI({
      baseURL: 'https://models.github.ai/inference',
      apiKey: token,
    });

    const response = await client.chat.completions.create({
      model: 'openai/gpt-4.1-nano',
      temperature: 0.3,
      stream: false,
      messages: [
        {
          role: 'system',
          content: 'You are a financial analyst. Respond ONLY with valid JSON, no markdown fences or extra text.',
        },
        {
          role: 'user',
          content: `Analyze the following financial data and provide insights for specific months.

${context}

Return a JSON object where each key is a month label (e.g. "${requestedMonths[0]}") and each value is a plain text string of concise bullet points separated by newlines. Each bullet starts with "• ".

Keep it to 3-5 bullet points per month. Focus on:
• Total spent vs income (e.g. "• Total: ₹X spent of ₹Y income, saving ₹Z")
• Biggest spending categories with amounts
• Change vs previous month (e.g. "• ₹X more/less than last month, driven by...")
• Any unusual spikes or notable items

Do NOT give advice, recommendations, or suggestions. Just state facts concisely. Use ₹ for currency.

Only include these months as keys: ${requestedMonths.join(', ')}

If a month has no data, the value should be "• No spending data available for this month."`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    // Parse JSON, handling potential markdown fences
    const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed as Record<string, string>;
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return null;
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

  // Calculate totals (decrypt amounts first)
  const monthlyExpenses = data.expenses.filter((e) => e.type === 'monthly');
  const yearlyExpenses = data.expenses.filter((e) => e.type === 'yearly');

  const totalMonthlyExpenses = monthlyExpenses.reduce((sum: number, e) => sum + parseFloat(decrypt(e.amount.toString())), 0);
  const totalYearlyExpenses = yearlyExpenses.reduce((sum: number, e) => sum + parseFloat(decrypt(e.amount.toString())), 0);

  // Calculate fixed expenses total (decrypt amounts first)
  let totalFixedExpenses = 0;
  data.fixedExpenses.forEach((fe) => {
    fe.applicableMonths.forEach((month: number) => {
      const override = data.fixedExpenseOverrides.find(
        (o) => o.fixedExpenseId.toString() === fe._id.toString() && o.month === month
      );
      totalFixedExpenses += override ? parseFloat(decrypt(override.overrideAmount.toString())) : parseFloat(decrypt(fe.amount.toString()));
    });
  });

  // Get monthly income (decrypt first)
  const monthlyIncomeSetting = data.settings.find((s) => s.key === 'monthlyIncome');
  const monthlyIncome = monthlyIncomeSetting ? parseFloat(decrypt(monthlyIncomeSetting.value)) : 0;

  // Calculate total income with overrides (decrypt amounts first)
  let actualTotalIncome = 0;
  for (let month = 1; month <= 12; month++) {
    const override = data.monthlyIncomeOverrides.find((o) => o.month === month);
    actualTotalIncome += override ? parseFloat(decrypt(override.overrideAmount.toString())) : monthlyIncome;
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

async function addMonthlySheets(
  workbook: ExcelJS.Workbook,
  year: number,
  data: MonthlyData,
  monthFilter: number[] | null,
  includeAI: boolean,
  aiInsights: Record<string, string> | null
) {
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

  let sortedMonths = Array.from(monthsWithData).sort((a, b) => a - b);

  // Apply month filter
  if (monthFilter && monthFilter.length > 0) {
    sortedMonths = sortedMonths.filter(m => monthFilter.includes(m));
  }

  const hasGithubToken = !!process.env.GITHUB_TOKEN;

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

    // Monthly expenses (decrypt amounts)
    const monthlyExpenses = data.expenses.filter((e) => e.type === 'monthly' && e.month === month);
    monthlyExpenses.forEach((expense) => {
      const row = worksheet.addRow([
        expense.date || '',
        expense.name,
        parseFloat(decrypt(expense.amount.toString())),
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
      const amount = override ? parseFloat(decrypt(override.overrideAmount.toString())) : parseFloat(decrypt(fixedExpense.amount.toString()));
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

    // Subtotal (decrypt amounts)
    const totalMonthlyExpenses = monthlyExpenses.reduce((sum: number, e) => sum + parseFloat(decrypt(e.amount.toString())), 0);
    const totalFixedExpenses = applicableFixedExpenses.reduce((sum: number, fe) => {
      const override = data.fixedExpenseOverrides.find(
        (o) => o.fixedExpenseId.toString() === fe._id.toString() && o.month === month
      );
      return sum + (override ? parseFloat(decrypt(override.overrideAmount.toString())) : parseFloat(decrypt(fe.amount.toString())));
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

    // AI Insights section
    if (includeAI) {
      worksheet.addRow([]);

      const insightKey = `${MONTH_NAMES[month - 1]} ${year}`;
      const insight = aiInsights?.[insightKey];

      if (!hasGithubToken) {
        // No API token configured
        const noteRow = worksheet.addRow(['', 'AI insights unavailable — GITHUB_TOKEN not configured', '', '']);
        noteRow.getCell(2).font = { italic: true, color: { argb: 'FFED7D31' } };
      } else if (insight) {
        // AI Insights header
        worksheet.mergeCells(`A${worksheet.rowCount + 1}:D${worksheet.rowCount + 1}`);
        const insightHeaderRow = worksheet.getRow(worksheet.rowCount);
        insightHeaderRow.getCell(1).value = 'AI Insights';
        insightHeaderRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        insightHeaderRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF7030A0' }
        };
        insightHeaderRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        insightHeaderRow.height = 22;

        // Write each bullet point as its own row
        const bullets = insight.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        for (const bullet of bullets) {
          worksheet.mergeCells(`A${worksheet.rowCount + 1}:D${worksheet.rowCount + 1}`);
          const bulletRow = worksheet.getRow(worksheet.rowCount);
          bulletRow.getCell(1).value = bullet;
          bulletRow.getCell(1).font = { size: 10 };
          bulletRow.getCell(1).alignment = { wrapText: true, vertical: 'middle' };
          bulletRow.height = 20;
        }
      } else {
        // AI was requested but insight is missing for this month
        const noteRow = worksheet.addRow(['', 'AI insights unavailable for this month', '', '']);
        noteRow.getCell(2).font = { italic: true, color: { argb: 'FF808080' } };
      }
    }

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

  // Data rows (decrypt amounts)
  let total = 0;
  yearlyExpenses.forEach((expense) => {
    const decryptedAmount = parseFloat(decrypt(expense.amount.toString()));
    const row = worksheet.addRow([
      expense.name,
      decryptedAmount,
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
    total += decryptedAmount;
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

  // Data rows (decrypt amounts)
  data.fixedExpenses.forEach((fixedExpense) => {
    const monthNames = fixedExpense.applicableMonths.map((m: number) => MONTH_NAMES[m - 1]).join(', ');
    const hasOverrides = data.fixedExpenseOverrides.some(
      (o) => o.fixedExpenseId.toString() === fixedExpense._id.toString()
    );

    const row = worksheet.addRow([
      fixedExpense.name,
      parseFloat(decrypt(fixedExpense.amount.toString())),
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

  // Get base monthly income (decrypt first)
  const monthlyIncomeSetting = data.settings.find((s) => s.key === 'monthlyIncome');
  const baseIncome = monthlyIncomeSetting ? parseFloat(decrypt(monthlyIncomeSetting.value)) : 0;

  // Data rows for each month (decrypt amounts)
  let totalIncome = 0;
  for (let month = 1; month <= 12; month++) {
    const override = data.monthlyIncomeOverrides.find((o) => o.month === month);
    const actualIncome = override ? parseFloat(decrypt(override.overrideAmount.toString())) : baseIncome;
    totalIncome += actualIncome;

    const row = worksheet.addRow([
      MONTH_NAMES[month - 1],
      baseIncome,
      override ? parseFloat(decrypt(override.overrideAmount.toString())) : '',
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

  // Data rows (decrypt amounts)
  goals.forEach((goal) => {
    const decryptedTargetAmount = parseFloat(decrypt(goal.targetAmount.toString()));
    const decryptedCurrentAmount = parseFloat(decrypt(goal.currentAmount.toString()));
    const progress = decryptedTargetAmount > 0 ? (decryptedCurrentAmount / decryptedTargetAmount * 100).toFixed(2) : '0.00';

    const row = worksheet.addRow([
      goal.name,
      decryptedTargetAmount,
      decryptedCurrentAmount,
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

  // Add contributions for each goal (decrypt amounts)
  goals.forEach((goal) => {
    if (goal.contributions && goal.contributions.length > 0) {
      goal.contributions.forEach((contrib) => {
        const row = worksheet.addRow([
          goal.name,
          contrib.date,
          parseFloat(decrypt(contrib.amount.toString())),
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
