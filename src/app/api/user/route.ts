import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { Expense } from '@/lib/models/Expense';
import { FixedExpense } from '@/lib/models/FixedExpense';
import { FixedExpenseOverride } from '@/lib/models/FixedExpenseOverride';
import { Goal } from '@/lib/models/Goal';
import { Setting } from '@/lib/models/Setting';
import { FilterPreset } from '@/lib/models/FilterPreset';
import { MonthlyIncomeOverride } from '@/lib/models/MonthlyIncomeOverride';

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    await connectToDatabase();

    // Delete all user data from all collections
    const deletionResults: { [key: string]: number } = {};

    // 1. Delete Expenses (both monthly and yearly)
    const expensesResult = await Expense.deleteMany({ userId });
    deletionResults['Expenses'] = expensesResult.deletedCount || 0;

    // 2. Delete Fixed Expenses
    const fixedExpensesResult = await FixedExpense.deleteMany({ userId });
    deletionResults['Fixed Expenses'] = fixedExpensesResult.deletedCount || 0;

    // 3. Delete Fixed Expense Overrides
    const fixedExpenseOverridesResult = await FixedExpenseOverride.deleteMany({ userId });
    deletionResults['Fixed Expense Overrides'] = fixedExpenseOverridesResult.deletedCount || 0;

    // 4. Delete Goals
    const goalsResult = await Goal.deleteMany({ userId });
    deletionResults['Goals'] = goalsResult.deletedCount || 0;

    // 5. Delete Settings
    const settingsResult = await Setting.deleteMany({ userId });
    deletionResults['Settings'] = settingsResult.deletedCount || 0;

    // 6. Delete Filter Presets
    const filterPresetsResult = await FilterPreset.deleteMany({ userId });
    deletionResults['Filter Presets'] = filterPresetsResult.deletedCount || 0;

    // 7. Delete Monthly Income Overrides
    const monthlyIncomeOverridesResult = await MonthlyIncomeOverride.deleteMany({ userId });
    deletionResults['Monthly Income Overrides'] = monthlyIncomeOverridesResult.deletedCount || 0;

    // 8. Delete the User account itself
    const userResult = await User.findByIdAndDelete(userId);
    if (!userResult) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // Calculate total items deleted
    const totalDeleted = Object.values(deletionResults).reduce((sum, count) => sum + count, 0);

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data deleted successfully',
      deletionSummary: {
        ...deletionResults,
        totalItems: totalDeleted,
      },
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account. Please try again.' },
      { status: 500 }
    );
  }
}





