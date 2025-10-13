import mongoose, { Schema, Model } from 'mongoose';

export interface IFixedExpense {
  name: string;
  amount: number;
  applicableMonths: number[];
}

const FixedExpenseSchema = new Schema<IFixedExpense>({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  applicableMonths: { type: [Number], required: true },
}, {
  timestamps: true,
});

export const FixedExpense: Model<IFixedExpense> = mongoose.models.FixedExpense || mongoose.model<IFixedExpense>('FixedExpense', FixedExpenseSchema);

