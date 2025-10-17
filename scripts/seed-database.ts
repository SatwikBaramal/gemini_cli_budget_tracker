// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from the project root
const envPath = resolve(process.cwd(), '.env.local');
config({ path: envPath });

// Verify MongoDB URI is available before importing mongodb module
if (!process.env.MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables');
  console.error(`Looked for .env.local at: ${envPath}`);
  console.error('Please ensure you have a .env.local file with MONGODB_URI set in the project root');
  process.exit(1);
}

const YEAR = 2025;

// Helper function to generate random number between min and max
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate random date within a month
function randomDateInMonth(year: number, month: number): string {
  const daysInMonth = new Date(year, month, 0).getDate();
  const day = randomBetween(1, daysInMonth);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Helper function to randomly select from array
function randomSelect<T>(array: T[]): T {
  return array[randomBetween(0, array.length - 1)];
}

// Helper function to check if should include (probability based)
function shouldInclude(probability: number): boolean {
  return Math.random() < probability;
}

async function clearExistingData(Expense: any, FixedExpense: any, FixedExpenseOverride: any, Setting: any) {
  console.log('🗑️  Clearing existing 2025 data...');
  
  await Expense.deleteMany({ year: YEAR });
  await FixedExpense.deleteMany({ year: YEAR });
  await FixedExpenseOverride.deleteMany({ year: YEAR });
  await Setting.deleteMany({ year: YEAR });
  
  console.log('✅ Existing data cleared\n');
}

async function seedFixedExpenses(FixedExpense: any) {
  console.log('📝 Creating fixed expenses...');
  
  const fixedExpenses = [
    {
      name: 'Rent',
      amount: 12000,
      applicableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      year: YEAR
    },
    {
      name: 'Electricity Bill',
      amount: 1800,
      applicableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      year: YEAR
    },
    {
      name: 'Water Bill',
      amount: 400,
      applicableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      year: YEAR
    },
    {
      name: 'Internet',
      amount: 699,
      applicableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      year: YEAR
    },
    {
      name: 'Mobile Plan',
      amount: 449,
      applicableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      year: YEAR
    },
    {
      name: 'Vehicle Insurance',
      amount: 750,
      applicableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      year: YEAR
    },
    {
      name: 'Streaming Subscriptions',
      amount: 650,
      applicableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      year: YEAR
    },
    {
      name: 'Gym Membership',
      amount: 1200,
      applicableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      year: YEAR
    }
  ];

  const created = await FixedExpense.insertMany(fixedExpenses);
  console.log(`✅ Created ${created.length} fixed expenses\n`);
  
  return created;
}

async function seedFixedExpenseOverrides(FixedExpenseOverride: any, fixedExpenses: any[]) {
  console.log('🔄 Creating fixed expense overrides...');
  
  // Find electricity expense
  const electricityExpense = fixedExpenses.find(e => e.name === 'Electricity Bill');
  
  if (!electricityExpense) {
    console.log('⚠️  Electricity expense not found, skipping overrides\n');
    return;
  }
  
  // Create overrides for summer months (higher AC usage)
  const overrides = [
    {
      fixedExpenseId: electricityExpense._id,
      month: 5, // May
      overrideAmount: 3200,
      date: randomDateInMonth(YEAR, 5),
      year: YEAR
    },
    {
      fixedExpenseId: electricityExpense._id,
      month: 6, // June
      overrideAmount: 3800,
      date: randomDateInMonth(YEAR, 6),
      year: YEAR
    },
    {
      fixedExpenseId: electricityExpense._id,
      month: 7, // July
      overrideAmount: 3500,
      date: randomDateInMonth(YEAR, 7),
      year: YEAR
    }
  ];

  const created = await FixedExpenseOverride.insertMany(overrides);
  console.log(`✅ Created ${created.length} fixed expense overrides\n`);
}

async function seedMonthlyExpenses(Expense: any) {
  console.log('💰 Creating monthly expenses (Jan-Oct)...');
  
  const expenseCategories = {
    groceries: [
      'Big Bazaar Groceries', 'Dmart Shopping', 'Local Kirana Store',
      'Fresh Vegetables', 'Monthly Provisions', 'Milk & Dairy Products'
    ],
    dining: [
      'McDonald\'s', 'Domino\'s Pizza', 'Local Restaurant', 'Cafe Coffee Day',
      'Street Food', 'Zomato Order', 'Swiggy Delivery', 'Birthday Party'
    ],
    transport: [
      'Petrol', 'Metro Card Recharge', 'Ola Ride', 'Uber', 
      'Auto Rickshaw', 'Bike Service', 'Parking Fee'
    ],
    shopping: [
      'Clothing', 'Myntra Purchase', 'Amazon Shopping', 'Flipkart Order',
      'Shoes', 'Electronics', 'Phone Accessories'
    ],
    entertainment: [
      'Movie Tickets', 'PVR Cinema', 'Concert', 'Sports Event',
      'Gaming', 'Book Purchase', 'Music Concert'
    ],
    healthcare: [
      'Doctor Consultation', 'Medical Tests', 'Pharmacy', 'Health Checkup',
      'Dentist', 'Eye Test', 'Medicine'
    ],
    home: [
      'Plumber Service', 'Electrician', 'House Cleaning', 'Repairs',
      'Furniture', 'Kitchen Items', 'Home Decor'
    ],
    personal: [
      'Haircut', 'Salon', 'Grooming Products', 'Toiletries',
      'Cosmetics', 'Spa', 'Personal Care'
    ],
    gifts: [
      'Birthday Gift', 'Anniversary Gift', 'Diwali Gifts', 'Holi Gifts',
      'Wedding Gift', 'Festival Shopping'
    ],
    education: [
      'Online Course', 'Books', 'Udemy Course', 'Coursera Subscription',
      'Kindle Books', 'Study Material'
    ],
    travel: [
      'Train Tickets', 'Flight Booking', 'Hotel Stay', 'Vacation',
      'Weekend Trip', 'Bus Tickets', 'Travel Package'
    ]
  };

  const allExpenses = [];
  
  for (let month = 1; month <= 10; month++) {
    console.log(`  📅 Month ${month}...`);
    
    const monthExpenses = [];
    
    // Groceries (3-5 times per month)
    const groceryCount = randomBetween(3, 5);
    for (let i = 0; i < groceryCount; i++) {
      monthExpenses.push({
        name: randomSelect(expenseCategories.groceries),
        amount: randomBetween(800, 2500),
        type: 'monthly',
        month,
        date: randomDateInMonth(YEAR, month),
        year: YEAR
      });
    }
    
    // Dining (2-4 times per month)
    const diningCount = randomBetween(2, 4);
    for (let i = 0; i < diningCount; i++) {
      monthExpenses.push({
        name: randomSelect(expenseCategories.dining),
        amount: randomBetween(200, 1200),
        type: 'monthly',
        month,
        date: randomDateInMonth(YEAR, month),
        year: YEAR
      });
    }
    
    // Transport (3-4 times per month)
    const transportCount = randomBetween(3, 4);
    for (let i = 0; i < transportCount; i++) {
      monthExpenses.push({
        name: randomSelect(expenseCategories.transport),
        amount: randomBetween(300, 1500),
        type: 'monthly',
        month,
        date: randomDateInMonth(YEAR, month),
        year: YEAR
      });
    }
    
    // Shopping (only in some months)
    if (shouldInclude(0.4)) { // 40% chance
      monthExpenses.push({
        name: randomSelect(expenseCategories.shopping),
        amount: randomBetween(500, 4000),
        type: 'monthly',
        month,
        date: randomDateInMonth(YEAR, month),
        year: YEAR
      });
    }
    
    // Entertainment (1-2 times per month)
    const entertainmentCount = randomBetween(1, 2);
    for (let i = 0; i < entertainmentCount; i++) {
      monthExpenses.push({
        name: randomSelect(expenseCategories.entertainment),
        amount: randomBetween(300, 1000),
        type: 'monthly',
        month,
        date: randomDateInMonth(YEAR, month),
        year: YEAR
      });
    }
    
    // Healthcare (quarterly)
    if ([2, 5, 8].includes(month)) {
      monthExpenses.push({
        name: randomSelect(expenseCategories.healthcare),
        amount: randomBetween(300, 2500),
        type: 'monthly',
        month,
        date: randomDateInMonth(YEAR, month),
        year: YEAR
      });
    }
    
    // Home Maintenance (occasionally)
    if (shouldInclude(0.25)) { // 25% chance
      monthExpenses.push({
        name: randomSelect(expenseCategories.home),
        amount: randomBetween(500, 3000),
        type: 'monthly',
        month,
        date: randomDateInMonth(YEAR, month),
        year: YEAR
      });
    }
    
    // Personal Care (every month)
    monthExpenses.push({
      name: randomSelect(expenseCategories.personal),
      amount: randomBetween(200, 800),
      type: 'monthly',
      month,
      date: randomDateInMonth(YEAR, month),
      year: YEAR
    });
    
    // Gifts (in specific months)
    if ([3, 10].includes(month)) { // Holi (March), Diwali (October)
      const giftCount = randomBetween(2, 3);
      for (let i = 0; i < giftCount; i++) {
        monthExpenses.push({
          name: randomSelect(expenseCategories.gifts),
          amount: randomBetween(500, 2500),
          type: 'monthly',
          month,
          date: randomDateInMonth(YEAR, month),
          year: YEAR
        });
      }
    }
    
    // Education (occasionally)
    if (shouldInclude(0.3)) { // 30% chance
      monthExpenses.push({
        name: randomSelect(expenseCategories.education),
        amount: randomBetween(500, 3000),
        type: 'monthly',
        month,
        date: randomDateInMonth(YEAR, month),
        year: YEAR
      });
    }
    
    // Travel (summer months and Diwali)
    if ([5, 6, 10].includes(month)) {
      monthExpenses.push({
        name: randomSelect(expenseCategories.travel),
        amount: randomBetween(3000, 12000),
        type: 'monthly',
        month,
        date: randomDateInMonth(YEAR, month),
        year: YEAR
      });
    }
    
    allExpenses.push(...monthExpenses);
  }
  
  const created = await Expense.insertMany(allExpenses);
  console.log(`✅ Created ${created.length} monthly expenses\n`);
  
  return created;
}

async function seedYearlyExpenses(Expense: any) {
  console.log('📅 Creating yearly expenses...');
  
  const yearlyExpenses = [
    {
      name: 'Annual Health Insurance Premium',
      amount: 8000,
      type: 'yearly',
      year: YEAR
    },
    {
      name: 'Property Tax',
      amount: 3500,
      type: 'yearly',
      year: YEAR
    },
    {
      name: 'Professional License Renewal',
      amount: 2000,
      type: 'yearly',
      year: YEAR
    }
  ];

  const created = await Expense.insertMany(yearlyExpenses);
  console.log(`✅ Created ${created.length} yearly expenses\n`);
}

async function seedIncomeData(Setting: any) {
  console.log('💵 Setting income data...');
  
  await Setting.findOneAndUpdate(
    { key: 'monthlyIncome', year: YEAR },
    { value: '40000' },
    { upsert: true, new: true }
  );
  
  await Setting.findOneAndUpdate(
    { key: 'yearlyIncome', year: YEAR },
    { value: '480000' },
    { upsert: true, new: true }
  );
  
  console.log('✅ Income data set (Monthly: ₹40,000, Yearly: ₹4,80,000)\n');
}

async function printSummary(Expense: any, FixedExpense: any, FixedExpenseOverride: any) {
  console.log('\n📊 Summary Statistics:\n');
  
  const fixedExpensesCount = await FixedExpense.countDocuments({ year: YEAR });
  const monthlyExpensesCount = await Expense.countDocuments({ type: 'monthly', year: YEAR });
  const yearlyExpensesCount = await Expense.countDocuments({ type: 'yearly', year: YEAR });
  const overridesCount = await FixedExpenseOverride.countDocuments({ year: YEAR });
  
  console.log(`📌 Fixed Expenses: ${fixedExpensesCount}`);
  console.log(`💰 Monthly Expenses: ${monthlyExpensesCount}`);
  console.log(`📅 Yearly Expenses: ${yearlyExpensesCount}`);
  console.log(`🔄 Fixed Expense Overrides: ${overridesCount}\n`);
  
  // Calculate monthly breakdown
  console.log('📈 Monthly Breakdown:');
  for (let month = 1; month <= 10; month++) {
    const expenses = await Expense.find({ type: 'monthly', month, year: YEAR });
    const total = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    const count = expenses.length;
    console.log(`  Month ${String(month).padStart(2, '0')}: ${count} expenses, Total: ₹${total.toLocaleString('en-IN')}`);
  }
  
  console.log('\n✨ Database seeding completed successfully!');
}

async function main() {
  try {
    console.log('🚀 Starting database seeding for year 2025...\n');
    
    // Use dynamic imports to ensure env variables are loaded first
    const { connectToDatabase } = await import('../src/lib/mongodb');
    const { Expense } = await import('../src/lib/models/Expense');
    const { FixedExpense } = await import('../src/lib/models/FixedExpense');
    const { FixedExpenseOverride } = await import('../src/lib/models/FixedExpenseOverride');
    const { Setting } = await import('../src/lib/models/Setting');
    const mongoose = await import('mongoose');
    
    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to MongoDB\n');
    
    // Clear existing data
    await clearExistingData(Expense, FixedExpense, FixedExpenseOverride, Setting);
    
    // Seed all data
    const fixedExpenses = await seedFixedExpenses(FixedExpense);
    await seedFixedExpenseOverrides(FixedExpenseOverride, fixedExpenses);
    await seedMonthlyExpenses(Expense);
    await seedYearlyExpenses(Expense);
    await seedIncomeData(Setting);
    
    // Print summary
    await printSummary(Expense, FixedExpense, FixedExpenseOverride);
    
    // Close connection
    await mongoose.default.connection.close();
    console.log('\n👋 Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

main();
