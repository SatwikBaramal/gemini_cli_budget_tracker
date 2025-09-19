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
      type TEXT NOT NULL DEFAULT 'yearly'
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Add the type column to the expenses table if it doesn't exist
  const columns = await db.all("PRAGMA table_info(expenses)");
  if (!columns.some((column) => column.name === "type")) {
    await db.exec("ALTER TABLE expenses ADD COLUMN type TEXT NOT NULL DEFAULT 'yearly'");
  }
}