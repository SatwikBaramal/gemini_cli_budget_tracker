import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IFixedExpenseOverride {
  fixedExpenseId: Types.ObjectId;
  month: number;
  overrideAmount: string; // Encrypted value stored as string
  date: string;
  year: number;
  userId: string;
}

const FixedExpenseOverrideSchema = new Schema<IFixedExpenseOverride>({
  fixedExpenseId: { type: Schema.Types.ObjectId, ref: 'FixedExpense', required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  overrideAmount: { type: String, required: true }, // Store encrypted string
  date: { type: String, required: true },
  year: { type: Number, required: true },
  userId: { type: String, required: true, index: true },
}, {
  timestamps: true,
});

// Create compound index for efficient lookups
FixedExpenseOverrideSchema.index({ userId: 1, fixedExpenseId: 1, month: 1, year: 1 });

export const FixedExpenseOverride: Model<IFixedExpenseOverride> = (mongoose.models?.FixedExpenseOverride as Model<IFixedExpenseOverride>) || mongoose.model<IFixedExpenseOverride>('FixedExpenseOverride', FixedExpenseOverrideSchema);

