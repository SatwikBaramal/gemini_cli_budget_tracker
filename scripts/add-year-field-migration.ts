import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || '';

async function migrate() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { dbName: 'budget_tracker' });
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;

  try {
    // 1. Update Expenses collection
    console.log('\n📝 Updating Expenses collection...');
    const expensesResult = await db.collection('expenses').updateMany(
      { year: { $exists: false } },
      { $set: { year: 2025 } }
    );
    console.log(`✅ Updated ${expensesResult.modifiedCount} expense documents`);

    // 2. Update Settings collection
    console.log('\n📝 Updating Settings collection...');
    
    // First, drop the old unique index on 'key' if it exists
    try {
      await db.collection('settings').dropIndex('key_1');
      console.log('✅ Dropped old unique index on key field');
    } catch (error: any) {
      if (error.code === 27) {
        console.log('ℹ️  Old index does not exist, skipping');
      } else {
        console.log('⚠️  Could not drop old index:', error.message);
      }
    }

    // Update settings documents to add year field
    const settingsResult = await db.collection('settings').updateMany(
      { year: { $exists: false } },
      { $set: { year: 2025 } }
    );
    console.log(`✅ Updated ${settingsResult.modifiedCount} setting documents`);

    // Create new compound unique index
    try {
      await db.collection('settings').createIndex(
        { key: 1, year: 1 },
        { unique: true }
      );
      console.log('✅ Created new compound unique index on key and year');
    } catch (error: any) {
      console.log('⚠️  Index might already exist:', error.message);
    }

    // 3. Update FixedExpenses collection
    console.log('\n📝 Updating FixedExpenses collection...');
    const fixedExpensesResult = await db.collection('fixedexpenses').updateMany(
      { year: { $exists: false } },
      { $set: { year: 2025 } }
    );
    console.log(`✅ Updated ${fixedExpensesResult.modifiedCount} fixed expense documents`);

    // 4. Update FixedExpenseOverrides collection
    console.log('\n📝 Updating FixedExpenseOverrides collection...');
    const overridesResult = await db.collection('fixedexpenseoverrides').updateMany(
      { year: { $exists: false } },
      { $set: { year: 2025 } }
    );
    console.log(`✅ Updated ${overridesResult.modifiedCount} override documents`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nSummary:');
    console.log(`- Expenses: ${expensesResult.modifiedCount} updated`);
    console.log(`- Settings: ${settingsResult.modifiedCount} updated`);
    console.log(`- Fixed Expenses: ${fixedExpensesResult.modifiedCount} updated`);
    console.log(`- Overrides: ${overridesResult.modifiedCount} updated`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

migrate();

