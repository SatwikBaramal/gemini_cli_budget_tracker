import mongoose, { Schema, Model } from 'mongoose';

export interface IFilterPreset {
  name: string;
  userId: string;
  filters: {
    searchQuery?: string;
    dateRange?: {
      start: string;
      end: string;
    };
    amountRange?: {
      min: number;
      max: number;
    };
  };
  year: number;
}

const FilterPresetSchema = new Schema<IFilterPreset>({
  name: { type: String, required: true },
  userId: { type: String, required: true },
  filters: {
    searchQuery: { type: String },
    dateRange: {
      start: { type: String },
      end: { type: String },
    },
    amountRange: {
      min: { type: Number },
      max: { type: Number },
    },
  },
  year: { type: Number, required: true },
}, {
  timestamps: true,
});

// Create indexes for better performance
FilterPresetSchema.index({ userId: 1, year: 1 });

export const FilterPreset: Model<IFilterPreset> = (mongoose.models?.FilterPreset as Model<IFilterPreset>) || mongoose.model<IFilterPreset>('FilterPreset', FilterPresetSchema);

