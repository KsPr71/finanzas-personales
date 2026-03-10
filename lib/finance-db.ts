import * as SQLite from 'expo-sqlite';

import type {
  Account,
  AccountType,
  Category,
  CategoryType,
  FinanceSnapshot,
  Transaction,
  TransactionType,
  Transfer,
} from '@/contexts/finance-context';

const DB_NAME = 'finance.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let schemaPromise: Promise<void> | null = null;

const isAccountType = (value: string): value is AccountType =>
  value === 'bank' || value === 'cash' || value === 'credit';

const isCategoryType = (value: string): value is CategoryType =>
  value === 'income' || value === 'expense';

const isTransactionType = (value: string): value is TransactionType =>
  value === 'income' || value === 'expense';

const toNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const db = await getDb();
      await db.execAsync(`
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          balance REAL NOT NULL,
          currency TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY NOT NULL,
          accountId TEXT NOT NULL,
          categoryId TEXT NOT NULL,
          type TEXT NOT NULL,
          amount REAL NOT NULL,
          description TEXT NOT NULL,
          date TEXT NOT NULL,
          FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE,
          FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS transfers (
          id TEXT PRIMARY KEY NOT NULL,
          fromAccountId TEXT NOT NULL,
          toAccountId TEXT NOT NULL,
          amount REAL NOT NULL,
          note TEXT NOT NULL,
          date TEXT NOT NULL,
          FOREIGN KEY (fromAccountId) REFERENCES accounts(id) ON DELETE CASCADE,
          FOREIGN KEY (toAccountId) REFERENCES accounts(id) ON DELETE CASCADE
        );
      `);
    })();
  }
  await schemaPromise;
}

async function loadSnapshotFromDb(): Promise<FinanceSnapshot> {
  await ensureSchema();
  const db = await getDb();

  const accountsRows = await db.getAllAsync<{
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
  }>('SELECT id, name, type, balance, currency FROM accounts ORDER BY rowid ASC');

  const categoriesRows = await db.getAllAsync<{
    id: string;
    name: string;
    type: string;
  }>('SELECT id, name, type FROM categories ORDER BY rowid ASC');

  const transactionsRows = await db.getAllAsync<{
    id: string;
    accountId: string;
    categoryId: string;
    type: string;
    amount: number;
    description: string;
    date: string;
  }>(
    'SELECT id, accountId, categoryId, type, amount, description, date FROM transactions ORDER BY rowid ASC'
  );

  const transfersRows = await db.getAllAsync<{
    id: string;
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    note: string;
    date: string;
  }>('SELECT id, fromAccountId, toAccountId, amount, note, date FROM transfers ORDER BY rowid ASC');

  const accounts: Account[] = accountsRows
    .filter((row) => isAccountType(row.type))
    .map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type as AccountType,
      balance: toNumber(row.balance),
      currency: row.currency,
    }));

  const categories: Category[] = categoriesRows
    .filter((row) => isCategoryType(row.type))
    .map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type as CategoryType,
    }));

  const transactions: Transaction[] = transactionsRows
    .filter((row) => isTransactionType(row.type))
    .map((row) => ({
      id: row.id,
      accountId: row.accountId,
      categoryId: row.categoryId,
      type: row.type as TransactionType,
      amount: toNumber(row.amount),
      description: row.description,
      date: row.date,
    }));

  const transfers: Transfer[] = transfersRows.map((row) => ({
    id: row.id,
    fromAccountId: row.fromAccountId,
    toAccountId: row.toAccountId,
    amount: toNumber(row.amount),
    note: row.note,
    date: row.date,
  }));

  return { accounts, categories, transactions, transfers };
}

export async function persistFinanceSnapshot(snapshot: FinanceSnapshot) {
  await ensureSchema();
  const db = await getDb();

  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM transfers;
      DELETE FROM transactions;
      DELETE FROM categories;
      DELETE FROM accounts;
    `);

    for (const account of snapshot.accounts) {
      await db.runAsync(
        'INSERT INTO accounts (id, name, type, balance, currency) VALUES (?, ?, ?, ?, ?)',
        account.id,
        account.name,
        account.type,
        account.balance,
        account.currency
      );
    }

    for (const category of snapshot.categories) {
      await db.runAsync(
        'INSERT INTO categories (id, name, type) VALUES (?, ?, ?)',
        category.id,
        category.name,
        category.type
      );
    }

    for (const transaction of snapshot.transactions) {
      await db.runAsync(
        'INSERT INTO transactions (id, accountId, categoryId, type, amount, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        transaction.id,
        transaction.accountId,
        transaction.categoryId,
        transaction.type,
        transaction.amount,
        transaction.description,
        transaction.date
      );
    }

    for (const transfer of snapshot.transfers) {
      await db.runAsync(
        'INSERT INTO transfers (id, fromAccountId, toAccountId, amount, note, date) VALUES (?, ?, ?, ?, ?, ?)',
        transfer.id,
        transfer.fromAccountId,
        transfer.toAccountId,
        transfer.amount,
        transfer.note,
        transfer.date
      );
    }
  });
}

export async function prepareFinanceSnapshot(initialSnapshot: FinanceSnapshot) {
  const current = await loadSnapshotFromDb();
  const hasSeedData = current.accounts.length > 0 || current.categories.length > 0;

  if (!hasSeedData) {
    await persistFinanceSnapshot(initialSnapshot);
    return initialSnapshot;
  }

  return current;
}
