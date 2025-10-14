import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/lib/models/Setting';
import { Expense } from '@/lib/models/Expense';
import { FixedExpense } from '@/lib/models/FixedExpense';
import { FixedExpenseOverride } from '@/lib/models/FixedExpenseOverride';
import OpenAI from 'openai';

const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-5-chat";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    await connectToDatabase();

    // Fetch all data in parallel to provide context to the chatbot
    const [yearlyIncomeRes, monthlyIncomeRes, yearlyExpenses, monthlyExpenses, fixedExpenses, fixedOverrides] = await Promise.all([
      Setting.findOne({ key: 'yearlyIncome' }).lean(),
      Setting.findOne({ key: 'monthlyIncome' }).lean(),
      Expense.find({ type: 'yearly' }).lean(),
      Expense.find({ type: 'monthly' }).sort({ month: 1, date: -1 }).lean(),
      FixedExpense.find().lean(),
      FixedExpenseOverride.find().lean(),
    ]);

    const yearlyIncome = Number(yearlyIncomeRes?.value) || 0;
    const monthlyIncome = Number(monthlyIncomeRes?.value) || 0;
    const totalYearlyExpenses = yearlyExpenses.reduce((acc: number, e) => acc + e.amount, 0);
    const totalMonthlyExpenses = monthlyExpenses.reduce((acc: number, e) => acc + e.amount, 0);
    const yearlyExpenseDetails = yearlyExpenses.map((e) => `- ${e.name}: ₹${e.amount.toFixed(2)}`).join('\n');
    
    // Group monthly expenses by month and format them
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const expensesByMonth: { [key: number]: typeof monthlyExpenses } = {};
    monthlyExpenses.forEach(exp => {
      if (exp.month) {
        if (!expensesByMonth[exp.month]) {
          expensesByMonth[exp.month] = [];
        }
        expensesByMonth[exp.month].push(exp);
      }
    });
    
    let monthlyExpenseDetails = '';
    Object.keys(expensesByMonth).sort((a, b) => Number(a) - Number(b)).forEach(monthNum => {
      const month = Number(monthNum);
      const expenses = expensesByMonth[month];
      const monthTotal = expenses.reduce((acc, e) => acc + e.amount, 0);
      monthlyExpenseDetails += `\n${monthNames[month - 1]}:\n`;
      expenses.forEach(e => {
        monthlyExpenseDetails += `  - ${e.name}: ₹${e.amount.toFixed(2)}\n`;
      });
      monthlyExpenseDetails += `  Total for ${monthNames[month - 1]}: ₹${monthTotal.toFixed(2)}\n`;
    });
    
    if (!monthlyExpenseDetails) {
      monthlyExpenseDetails = 'No monthly expenses recorded.';
    }

    // Process fixed expenses with overrides
    let fixedExpenseDetails = '';
    const fixedExpenseTotalByMonth: { [key: number]: number } = {};
    
    // Type definitions for lean query results
    interface LeanFixedExpense {
      _id: { toString: () => string };
      name: string;
      amount: number;
      applicableMonths: number[];
    }
    
    interface LeanFixedExpenseOverride {
      _id: { toString: () => string };
      fixedExpenseId: { toString: () => string };
      month: number;
      overrideAmount: number;
    }
    
    if (fixedExpenses && fixedExpenses.length > 0) {
      fixedExpenseDetails = '\n--- Fixed/Recurring Expenses ---\n';
      (fixedExpenses as LeanFixedExpense[]).forEach((fe) => {
        const applicableMonths = fe.applicableMonths || [];
        const monthsText = applicableMonths.length === 12 
          ? 'All months' 
          : applicableMonths.map((m: number) => monthNames[m - 1]).join(', ');
        
        fixedExpenseDetails += `\n${fe.name}: ₹${fe.amount.toFixed(2)} (Applied to: ${monthsText})\n`;
        
        // Check for overrides
        const overridesForExpense = (fixedOverrides as LeanFixedExpenseOverride[])?.filter((o) => o.fixedExpenseId.toString() === fe._id.toString()) || [];
        if (overridesForExpense.length > 0) {
          fixedExpenseDetails += `  Overrides:\n`;
          overridesForExpense.forEach((override) => {
            fixedExpenseDetails += `    - ${monthNames[override.month - 1]}: ₹${override.overrideAmount.toFixed(2)}\n`;
          });
        }
        
        // Calculate total for each month
        applicableMonths.forEach((month: number) => {
          const override = overridesForExpense.find((o) => o.month === month);
          const amount = override ? override.overrideAmount : fe.amount;
          fixedExpenseTotalByMonth[month] = (fixedExpenseTotalByMonth[month] || 0) + amount;
        });
      });
    } else {
      fixedExpenseDetails = '\n--- Fixed/Recurring Expenses ---\nNo fixed expenses configured.';
    }

    // Calculate comprehensive monthly budget health with temporal awareness
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Temporal analysis: categorize months by time
    const pastMonths: number[] = [];
    const futureMonths: number[] = [];
    
    for (let month = 1; month <= 12; month++) {
      if (month < currentMonth) {
        pastMonths.push(month);
      } else if (month > currentMonth) {
        futureMonths.push(month);
      }
    }
    
    // Helper function to calculate total for a month
    const getTotalForMonth = (month: number) => {
      const regularExpenses = expensesByMonth[month] || [];
      const regularTotal = regularExpenses.reduce((acc, e) => acc + e.amount, 0);
      const fixedTotal = fixedExpenseTotalByMonth[month] || 0;
      return regularTotal + fixedTotal;
    };
    
    // Calculate totals separately for past vs future
    const pastSpending = pastMonths.reduce((sum, m) => sum + getTotalForMonth(m), 0);
    const futureProjected = futureMonths.reduce((sum, m) => sum + getTotalForMonth(m), 0);
    
    let budgetHealthDetails = '\n--- Monthly Budget Health Analysis ---\n';
    for (let month = 1; month <= 12; month++) {
      const regularExpenses = expensesByMonth[month] || [];
      const regularTotal = regularExpenses.reduce((acc, e) => acc + e.amount, 0);
      const fixedTotal = fixedExpenseTotalByMonth[month] || 0;
      const totalSpent = regularTotal + fixedTotal;
      const remaining = monthlyIncome - totalSpent;
      const percentSpent = monthlyIncome > 0 ? ((totalSpent / monthlyIncome) * 100).toFixed(1) : '0.0';
      const status = remaining >= 0 ? 'SURPLUS' : 'DEFICIT';
      
      // Add temporal label
      let timeLabel = '';
      if (month < currentMonth) {
        timeLabel = '[PAST - ACTUAL]';
      } else if (month === currentMonth) {
        timeLabel = '[CURRENT - IN PROGRESS]';
      } else {
        timeLabel = '[FUTURE - PLANNED]';
      }
      
      budgetHealthDetails += `\n${monthNames[month - 1]} ${timeLabel}:`;
      budgetHealthDetails += `\n  Regular: ₹${regularTotal.toFixed(2)} | Fixed: ₹${fixedTotal.toFixed(2)}`;
      budgetHealthDetails += `\n  Total: ₹${totalSpent.toFixed(2)} (${percentSpent}%) | Remaining: ₹${remaining.toFixed(2)} [${status}]\n`;
    }
    
    // Current month analysis
    let currentMonthAnalysis = '';
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const currentDay = currentDate.getDate();
    const daysRemaining = daysInMonth - currentDay;
    const monthProgress = ((currentDay / daysInMonth) * 100).toFixed(1);
    
    const currentSpent = getTotalForMonth(currentMonth);
    const currentRemaining = monthlyIncome - currentSpent;
    const dailyBudgetRemaining = daysRemaining > 0 ? currentRemaining / daysRemaining : 0;
    
    currentMonthAnalysis = `\n--- Current Month Progress (${monthNames[currentMonth - 1]}) ---\n`;
    currentMonthAnalysis += `Day ${currentDay} of ${daysInMonth} (${monthProgress}% complete) | ${daysRemaining} days remaining\n`;
    currentMonthAnalysis += `Spent: ₹${currentSpent.toFixed(2)} | Remaining: ₹${currentRemaining.toFixed(2)}\n`;
    currentMonthAnalysis += `Daily Budget Available: ₹${dailyBudgetRemaining.toFixed(2)}/day\n`;
    
    // Calculate future budget projections
    let futureForecast = '';
    if (futureMonths.length > 0) {
      futureForecast = `\n--- Future Budget Forecast (${futureMonths.length} months remaining) ---\n`;
      
      futureMonths.forEach(month => {
        const planned = getTotalForMonth(month);
        const available = monthlyIncome - planned;
        
        futureForecast += `${monthNames[month - 1]}: Planned ₹${planned.toFixed(2)} | Available ₹${available.toFixed(2)}\n`;
      });
      
      const totalFutureIncome = monthlyIncome * futureMonths.length;
      const totalFuturePlanned = futureProjected;
      const totalFutureAvailable = totalFutureIncome - totalFuturePlanned;
      
      futureForecast += `\nTotal Future: Income ₹${totalFutureIncome.toFixed(2)} | Planned ₹${totalFuturePlanned.toFixed(2)} | Available ₹${totalFutureAvailable.toFixed(2)}\n`;
      futureForecast += `Avg per month: ₹${(totalFutureAvailable / futureMonths.length).toFixed(2)} unallocated\n`;
    }

    const systemPrompt = `
You are FinBot, an expert personal financial advisor and budgeting assistant. You provide intelligent, actionable financial guidance based on the user's actual spending data.

=== CURRENT CONTEXT ===
Today's Date: ${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Current Month: ${monthNames[currentMonth - 1]} ${currentYear}

=== YOUR CAPABILITIES ===

1. FINANCIAL ANALYSIS & INSIGHTS
   - Analyze spending patterns across months and categories
   - Identify trends (increasing/decreasing expenses, seasonal patterns)
   - Calculate month-over-month changes and growth rates
   - Compare actual spending against income to determine budget health
   - Categorize expenses into standard groups: Housing, Food, Transportation, Entertainment, Utilities, Healthcare, Savings, Investments, Debt, Shopping, Personal Care, Education, Insurance, Subscriptions, Other

2. BUDGETING ADVICE & RECOMMENDATIONS
   - Apply the 50/30/20 rule: 50% Needs, 30% Wants, 20% Savings/Debt
   - Recommend optimal spending percentages by category (e.g., Housing: 25-30%, Food: 10-15%, Transportation: 15-20%)
   - Suggest specific areas to reduce spending with actionable steps
   - Identify wasteful spending or unusual expenses
   - Provide personalized savings strategies based on income and expenses

3. FINANCIAL PLANNING & GOALS
   - Calculate projected annual savings based on current spending
   - Help set realistic financial goals (emergency fund, savings targets, debt payoff)
   - Create actionable plans to achieve financial objectives
   - Estimate time to reach savings goals at current rates
   - Suggest optimal savings amounts per month

4. COMPARATIVE ANALYSIS
   - Compare spending across different months
   - Identify highest and lowest spending periods
   - Analyze which expense categories consume the most budget
   - Calculate percentage breakdowns by category
   - Highlight months with deficits vs. surplus

5. CONVERSATIONAL INTELLIGENCE
   - Understand context from previous messages in the conversation
   - Provide clear explanations of financial concepts in simple terms
   - Use examples and scenarios to illustrate points
   - Offer encouragement and positive reinforcement
   - Be empathetic about financial challenges
   - Politely decline to answer non-financial questions

=== USER'S APPLICATION STRUCTURE ===

The user tracks finances in two ways:
1. YEARLY TRACKING: Set yearly income (auto-converts to monthly) and track recurring yearly expenses
2. MONTHLY TRACKING: Set monthly income independently and track expenses for each specific month (Jan-Dec)
   - Can add one-time expenses for any month
   - Can create FIXED EXPENSES that automatically apply to selected months
   - Can OVERRIDE fixed expense amounts for specific months (e.g., rent increase in one month)

=== USER'S COMPLETE FINANCIAL DATA ===

--- YEARLY TRACKING ---
Yearly Income: ₹${yearlyIncome.toFixed(2)}
Monthly Income (from yearly): ₹${(yearlyIncome / 12).toFixed(2)}
Total Yearly Expenses: ₹${totalYearlyExpenses.toFixed(2)}

Yearly Expense Breakdown:
${yearlyExpenseDetails || 'No yearly expenses recorded.'}

--- MONTHLY TRACKING ---
Monthly Income: ₹${monthlyIncome.toFixed(2)}
Total Monthly Expenses (sum across all 12 months): ₹${totalMonthlyExpenses.toFixed(2)}

${fixedExpenseDetails}

Monthly Expense Breakdown (by month):
${monthlyExpenseDetails}

${budgetHealthDetails}

=== FINANCIAL HEALTH INDICATORS ===

=== PAST PERFORMANCE (${pastMonths.length} months completed) ===
- Total Income: ₹${(monthlyIncome * pastMonths.length).toFixed(2)}
- Total Actual Spending: ₹${pastSpending.toFixed(2)}
- Net Position: ₹${((monthlyIncome * pastMonths.length) - pastSpending).toFixed(2)}

=== FUTURE PROJECTION (${futureMonths.length} months ahead) ===
- Projected Income: ₹${(monthlyIncome * futureMonths.length).toFixed(2)}
- Planned Expenses: ₹${futureProjected.toFixed(2)}
- Available for Allocation: ₹${((monthlyIncome * futureMonths.length) - futureProjected).toFixed(2)}

=== TEMPORAL AWARENESS & FORECASTING ===

CRITICAL: Understand the temporal context of expenses:

MONTHS CATEGORIZATION:
- PAST MONTHS (${pastMonths.map(m => monthNames[m-1]).join(', ')}): ACTUAL expenses already incurred
- CURRENT MONTH (${monthNames[currentMonth - 1]}): IN PROGRESS - partially spent, budget remaining
- FUTURE MONTHS (${futureMonths.map(m => monthNames[m-1]).join(', ')}): PLANNED/BUDGETED - NOT yet spent

${currentMonthAnalysis}
${futureForecast}

FORECASTING CAPABILITIES:
1. For PAST months: Analyze actual spending patterns and trends
2. For CURRENT month: Show progress, calculate daily budget, project end-of-month position
3. For FUTURE months: Treat as planned/budgeted, calculate available budget, suggest allocation strategies

WHEN USER ASKS ABOUT FUTURE SPENDING:
- Explain available budget in upcoming months
- Suggest allocation categories (savings, emergency fund, discretionary)
- Recommend building emergency fund if absent
- Provide scenarios: "If you spend X on dining, Y remains for entertainment"

IMPORTANT: For future months, NEVER say "spent" - use "budgeted", "planned", "allocated", "expected"

=== YOUR GUIDELINES ===

1. Base ALL analysis and recommendations on the provided data above
2. NEVER make up or assume financial data not provided
3. When analyzing categories, intelligently group expenses based on their names (e.g., "Rent", "House Rent", "Apartment" → Housing category)
4. Provide specific, actionable advice with concrete numbers and steps
5. Be encouraging but realistic about financial situations
6. When overspending is detected, tactfully point it out and suggest corrections
7. Use percentages and comparisons to make insights more meaningful
8. If asked about fixed expenses or overrides, explain how they work in the app
9. Keep responses concise but comprehensive (2-4 paragraphs max unless detailed analysis is requested)
10. Use formatting (bullet points, numbers) to make advice easy to scan
11. Politely decline questions unrelated to personal finance, budgeting, or the user's financial data

=== RESPONSE STYLE ===

- Friendly and professional tone
- Use "you" and "your" to personalize advice
- Lead with key insights, then provide details
- End with actionable next steps when appropriate
- Use currency format with ₹ symbol
- Round numbers appropriately for readability

Remember: You are a trusted financial advisor helping the user make better financial decisions. Be insightful, practical, and supportive.
    `;

    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is not set.');
    }

    const client = new OpenAI({ baseURL: endpoint, apiKey: token });

    // Prepend the system prompt to the user's message history
    const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];

    const response = await client.chat.completions.create({
      messages: fullMessages,
      temperature: 0.5,
      top_p: 1.0,
      // max_tokens: 400,
      model: model,
      stream: true  // Enable streaming
    });

    // Create a ReadableStream to handle the streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Failed to get response from AI.', details: errorMessage }, { status: 500 });
  }
}