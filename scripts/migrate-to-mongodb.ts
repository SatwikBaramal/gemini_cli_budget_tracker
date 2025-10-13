import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import mongoose from 'mongoose';
import { Expense } from '../src/lib/models/Expense';
import { Setting } from '../src/lib/models/Setting';
import { FixedExpense } from '../src/lib/models/FixedExpense';
import { FixedExpenseOverride } from '../src/lib/models/FixedExpenseOverride';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || '';
const SQLITE_PATH = './budget.db';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  console.log('Please create a .env.local file with: MONGODB_URI=your_connection_string');
  process.exit(1);
}

async function migrate() {
  console.log('🚀 Starting migration from SQLite to MongoDB...\n');

  // Connect to SQLite
  console.log('📖 Opening SQLite database...');
  const sqliteDb = await open({
    filename: SQLITE_PATH,
    driver: sqlite3.Database,
  });

  // Connect to MongoDB
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  try {
    // Migrate Expenses
    console.log('📦 Migrating expenses...');
    const expenses = await sqliteDb.all('SELECT * FROM expenses');
    if (expenses.length > 0) {
      await Expense.insertMany(
        expenses.map(exp => ({
          name: exp.name,
          amount: exp.amount,
          type: exp.type || 'yearly',
          month: exp.month,
          date: exp.date,
        }))
      );
      console.log(`✅ Migrated ${expenses.length} expenses`);
    } else {
      console.log('ℹ️  No expenses to migrate');
    }

    // Migrate Settings
    console.log('⚙️  Migrating settings...');
    const settings = await sqliteDb.all('SELECT * FROM settings');
    if (settings.length > 0) {
      await Setting.insertMany(
        settings.map(setting => ({
          key: setting.key,
          value: setting.value,
        }))
      );
      console.log(`✅ Migrated ${settings.length} settings`);
    } else {
      console.log('ℹ️  No settings to migrate');
    }

    // Migrate Fixed Expenses
    console.log('📌 Migrating fixed expenses...');
    const fixedExpenses = await sqliteDb.all('SELECT * FROM fixed_expenses');
    if (fixedExpenses.length > 0) {
      const fixedExpenseMap = new Map();
      
      for (const fe of fixedExpenses) {
        const newFixedExpense = await FixedExpense.create({
          name: fe.name,
          amount: fe.amount,
          applicableMonths: JSON.parse(fe.applicable_months),
        });
        fixedExpenseMap.set(fe.id, newFixedExpense._id);
      }
      console.log(`✅ Migrated ${fixedExpenses.length} fixed expenses`);

      // Migrate Fixed Expense Overrides
      console.log('🔄 Migrating fixed expense overrides...');
      const overrides = await sqliteDb.all('SELECT * FROM fixed_expense_overrides');
      if (overrides.length > 0) {
        await FixedExpenseOverride.insertMany(
          overrides.map(override => ({
            fixedExpenseId: fixedExpenseMap.get(override.fixed_expense_id),
            month: override.month,
            overrideAmount: override.override_amount,
            date: override.date,
          }))
        );
        console.log(`✅ Migrated ${overrides.length} fixed expense overrides`);
      } else {
        console.log('ℹ️  No overrides to migrate');
      }
    } else {
      console.log('ℹ️  No fixed expenses to migrate');
    }

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const [expenseCount, settingCount, fixedExpenseCount, overrideCount] = await Promise.all([
      Expense.countDocuments(),
      Setting.countDocuments(),
      FixedExpense.countDocuments(),
      FixedExpenseOverride.countDocuments(),
    ]);

    console.log(`\n📊 Migration Summary:`);
    console.log(`   Expenses: ${expenseCount}`);
    console.log(`   Settings: ${settingCount}`);
    console.log(`   Fixed Expenses: ${fixedExpenseCount}`);
    console.log(`   Overrides: ${overrideCount}`);

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await sqliteDb.close();
    await mongoose.connection.close();
    console.log('\n🔌 Database connections closed.');
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('\n✨ All done! You can now use MongoDB with your app.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration error:', error);
    process.exit(1);
  });

