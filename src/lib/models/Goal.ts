import mongoose, { Schema, Model } from 'mongoose';

export interface IContribution {
  amount: string; // Encrypted value stored as string
  date: string;
  note?: string;
  type: 'addition' | 'withdrawal';
}

export interface IGoal {
  name: string;
  targetAmount: string; // Encrypted value stored as string
  currentAmount: string; // Encrypted value stored as string
  deadline: string;
  monthlySavingsTarget?: number;
  userId: string;
  status: 'active' | 'completed' | 'archived';
  contributions: IContribution[];
}

const ContributionSchema = new Schema<IContribution>({
  amount: { type: String, required: true }, // Store encrypted string
  date: { type: String, required: true },
  note: { type: String },
  type: { type: String, required: true, enum: ['addition', 'withdrawal'], default: 'addition' },
}, { _id: false });

const GoalSchema = new Schema<IGoal>({
  name: { type: String, required: true },
  targetAmount: { type: String, required: true }, // Store encrypted string
  currentAmount: { type: String, required: true, default: '0' }, // Store encrypted string
  deadline: { type: String, required: true },
  monthlySavingsTarget: { type: Number, min: 0 },
  userId: { type: String, required: true, index: true },
  status: { 
    type: String, 
    required: true, 
    default: 'active',
    enum: ['active', 'completed', 'archived']
  },
  contributions: [ContributionSchema],
}, {
  timestamps: true,
});

// Create indexes for better performance
GoalSchema.index({ userId: 1, status: 1 });
GoalSchema.index({ deadline: 1 });

export const Goal: Model<IGoal> = (mongoose.models?.Goal as Model<IGoal>) || mongoose.model<IGoal>('Goal', GoalSchema);

