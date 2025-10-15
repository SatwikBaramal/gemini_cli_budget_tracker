import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IFixedExpenseOverride {
  fixedExpenseId: Types.ObjectId;
  month: number;
  overrideAmount: number;
  date: string;
  year: number;
}

const FixedExpenseOverrideSchema = new Schema<IFixedExpenseOverride>({
  fixedExpenseId: { type: Schema.Types.ObjectId, ref: 'FixedExpense', required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  overrideAmount: { type: Number, required: true },
  date: { type: String, required: true },
  year: { type: Number, required: true },
}, {
  timestamps: true,
});

// Create compound index for efficient lookups
FixedExpenseOverrideSchema.index({ fixedExpenseId: 1, month: 1, year: 1 });

export const FixedExpenseOverride: Model<IFixedExpenseOverride> = mongoose.models.FixedExpenseOverride || mongoose.model<IFixedExpenseOverride>('FixedExpenseOverride', FixedExpenseOverrideSchema);

