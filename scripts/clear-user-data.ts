/**
 * Clear all data for a specific user except their account
 * 
 * This script will:
 * 1. Find the user by email
 * 2. Delete all associated data from all collections
 * 3. Keep the user account intact
 * 
 * Usage: npm run clear-user-data
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local BEFORE importing any application modules
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const USER_EMAIL = 'satwikbaramal854@gmail.com';

async function clearUserData() {
  console.log('🗑️  Starting user data cleanup...\n');
  
  // Dynamic imports to ensure dotenv runs first
  const { connectToDatabase } = await import('../src/lib/mongodb');
  const { User } = await import('../src/lib/models/User');
  const { Expense } = await import('../src/lib/models/Expense');
  const { FixedExpense } = await import('../src/lib/models/FixedExpense');
  const { FixedExpenseOverride } = await import('../src/lib/models/FixedExpenseOverride');
  const { Goal } = await import('../src/lib/models/Goal');
  const { Setting } = await import('../src/lib/models/Setting');
  const { FilterPreset } = await import('../src/lib/models/FilterPreset');
  const { MonthlyIncomeOverride } = await import('../src/lib/models/MonthlyIncomeOverride');
  const mongoose = await import('mongoose');
  
  try {
    await connectToDatabase();
    console.log('✓ Connected to database\n');

    // Find the user
    const user = await User.findOne({ email: USER_EMAIL });
    
    if (!user) {
      console.error(`❌ User with email "${USER_EMAIL}" not found!`);
      process.exit(1);
    }

    const userId = String(user._id);
    console.log(`✓ Found user: ${user.email}`);
    console.log(`  User ID: ${userId}`);
    console.log(`  Name: ${user.name || 'N/A'}`);
    console.log(`  Provider: ${user.provider}`);
    console.log(`  Created: ${user.createdAt}\n`);

    console.log('📋 Starting data deletion...\n');

    // Delete all user data
    const deletionResults: { [key: string]: number } = {};

    // 1. Delete Expenses
    const expensesResult = await Expense.deleteMany({ userId });
    deletionResults['Expenses'] = expensesResult.deletedCount || 0;
    console.log(`  ✓ Deleted ${deletionResults['Expenses']} expenses`);

    // 2. Delete Fixed Expenses
    const fixedExpensesResult = await FixedExpense.deleteMany({ userId });
    deletionResults['Fixed Expenses'] = fixedExpensesResult.deletedCount || 0;
    console.log(`  ✓ Deleted ${deletionResults['Fixed Expenses']} fixed expenses`);

    // 3. Delete Fixed Expense Overrides
    const fixedExpenseOverridesResult = await FixedExpenseOverride.deleteMany({ userId });
    deletionResults['Fixed Expense Overrides'] = fixedExpenseOverridesResult.deletedCount || 0;
    console.log(`  ✓ Deleted ${deletionResults['Fixed Expense Overrides']} fixed expense overrides`);

    // 4. Delete Goals
    const goalsResult = await Goal.deleteMany({ userId });
    deletionResults['Goals'] = goalsResult.deletedCount || 0;
    console.log(`  ✓ Deleted ${deletionResults['Goals']} goals`);

    // 5. Delete Settings
    const settingsResult = await Setting.deleteMany({ userId });
    deletionResults['Settings'] = settingsResult.deletedCount || 0;
    console.log(`  ✓ Deleted ${deletionResults['Settings']} settings`);

    // 6. Delete Filter Presets
    const filterPresetsResult = await FilterPreset.deleteMany({ userId });
    deletionResults['Filter Presets'] = filterPresetsResult.deletedCount || 0;
    console.log(`  ✓ Deleted ${deletionResults['Filter Presets']} filter presets`);

    // 7. Delete Monthly Income Overrides
    const monthlyIncomeOverridesResult = await MonthlyIncomeOverride.deleteMany({ userId });
    deletionResults['Monthly Income Overrides'] = monthlyIncomeOverridesResult.deletedCount || 0;
    console.log(`  ✓ Deleted ${deletionResults['Monthly Income Overrides']} monthly income overrides`);

    // Calculate totals
    const totalDeleted = Object.values(deletionResults).reduce((sum, count) => sum + count, 0);

    console.log('\n' + '='.repeat(60));
    console.log('📊 Data Cleanup Summary:');
    console.log('='.repeat(60));
    console.log(`User: ${user.email}`);
    console.log(`User ID: ${userId}`);
    console.log('-'.repeat(60));
    
    Object.entries(deletionResults).forEach(([key, count]) => {
      console.log(`${key.padEnd(30)} ${count}`);
    });
    
    console.log('-'.repeat(60));
    console.log(`${'Total items deleted:'.padEnd(30)} ${totalDeleted}`);
    console.log('='.repeat(60) + '\n');

    if (totalDeleted > 0) {
      console.log('✅ User data cleanup completed successfully!');
      console.log('📧 User account remains intact and can still log in.');
    } else {
      console.log('ℹ️  No data found for this user. User account is clean.');
    }

  } catch (error) {
    console.error('❌ Error during data cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.default.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the script
clearUserData();

