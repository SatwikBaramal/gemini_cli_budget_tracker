import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import OpenAI from 'openai';

const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1-nano";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const db = await getDb();

    // Fetch all data in parallel to provide context to the chatbot
    const [yearlyIncomeRes, monthlyIncomeRes, yearlyExpenses, monthlyExpenses] = await Promise.all([
      db.get("SELECT value FROM settings WHERE key = 'yearlyIncome'"),
      db.get("SELECT value FROM settings WHERE key = 'monthlyIncome'"),
      db.all("SELECT * FROM expenses WHERE type = 'yearly'"),
      db.all("SELECT * FROM expenses WHERE type = 'monthly'"),
    ]);

    const yearlyIncome = Number(yearlyIncomeRes?.value) || 0;
    const monthlyIncome = Number(monthlyIncomeRes?.value) || 0;
    const totalYearlyExpenses = yearlyExpenses.reduce((acc, e) => acc + e.amount, 0);
    const totalMonthlyExpenses = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0);
    const yearlyExpenseDetails = yearlyExpenses.map(e => `- ${e.name}: ₹${e.amount.toFixed(2)}`).join('\n');
    const monthlyExpenseDetails = monthlyExpenses.map(e => `- ${e.name}: ₹${e.amount.toFixed(2)}`).join('\n');

    const systemPrompt = `
      You are a helpful and friendly financial assistant for a personal budgeting application.
      Your name is "FinBot".
      You must answer questions based ONLY on the provided financial data and general financial knowledge about budgeting.
      You can perform calculations on the provided data if the user asks (e.g., "what is my total spending on food?").
      If a question is outside this scope (e.g., celebrity news, weather), you must politely decline to answer and state that you can only help with financial questions.
      Keep your answers concise and to the point.
      Feel free to be a little creative with the user's finances, but do not make up any data.
      You have the ability to split the expenses into categories based on common knowledge (e.g., groceries, utilities, entertainment) if the user asks for category-wise breakdowns.

      Here is the user's current financial data for your context:
      --- Yearly Data ---
      Yearly Income: ₹${yearlyIncome.toFixed(2)}
      Total Yearly Expenses: ₹${totalYearlyExpenses.toFixed(2)}
      Yearly Expenses Breakdown:
      ${yearlyExpenseDetails || 'No yearly expenses recorded.'}

      --- Monthly Data ---
      Monthly Income: ₹${monthlyIncome.toFixed(2)}
      Total Monthly Expenses: ₹${totalMonthlyExpenses.toFixed(2)}
      Monthly Expenses Breakdown:
      ${monthlyExpenseDetails || 'No monthly expenses recorded.'}
    `;

    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is not set.');
    }

    const client = new OpenAI({ baseURL: endpoint, apiKey: token });

    // Prepend the system prompt to the user's message history
    const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];

    const response = await client.chat.completions.create({
      messages: fullMessages,
      temperature: 0.7,
      top_p: 1.0,
      // max_tokens: 400,
      model: model
    });

    const botResponse = response.choices[0].message.content;

    return NextResponse.json({ response: botResponse });
  } catch (error) {
    console.error('Error in chat API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Failed to get response from AI.', details: errorMessage }, { status: 500 });
  }
}