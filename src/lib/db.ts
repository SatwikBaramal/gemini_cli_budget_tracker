import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let db: Database | null = null;

export async function getDb() {
  if (!db) {
    db = await open({
      filename: './budget.db',
      driver: sqlite3.Database,
    });
  }
  return db;
}

export async function initDb() {
  const db = await getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL DEFAULT 'yearly',
      month INTEGER,
      date TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS fixed_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      applicable_months TEXT NOT NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS fixed_expense_overrides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fixed_expense_id INTEGER NOT NULL,
      month INTEGER NOT NULL,
      override_amount REAL NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (fixed_expense_id) REFERENCES fixed_expenses(id) ON DELETE CASCADE
    )
  `);

  // Add the type column to the expenses table if it doesn't exist
  const columns = await db.all("PRAGMA table_info(expenses)");
  if (!columns.some((column) => column.name === "type")) {
    await db.exec("ALTER TABLE expenses ADD COLUMN type TEXT NOT NULL DEFAULT 'yearly'");
  }
  
  // Add the month column to the expenses table if it doesn't exist
  if (!columns.some((column) => column.name === "month")) {
    await db.exec("ALTER TABLE expenses ADD COLUMN month INTEGER");
  }
  
  // Add the date column to the expenses table if it doesn't exist
  if (!columns.some((column) => column.name === "date")) {
    await db.exec("ALTER TABLE expenses ADD COLUMN date TEXT");
  }
}