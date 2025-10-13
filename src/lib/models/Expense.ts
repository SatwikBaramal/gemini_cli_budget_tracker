import mongoose, { Schema, Model } from 'mongoose';

export interface IExpense {
  name: string;
  amount: number;
  type: 'yearly' | 'monthly';
  month?: number;
  date?: string;
}

const ExpenseSchema = new Schema<IExpense>({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true, default: 'yearly', enum: ['yearly', 'monthly'] },
  month: { type: Number, min: 1, max: 12 },
  date: { type: String },
}, {
  timestamps: true,
});

// Create indexes for better performance
ExpenseSchema.index({ month: 1 });
ExpenseSchema.index({ type: 1 });

export const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

