import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { persistFinanceSnapshot, prepareFinanceSnapshot } from '@/lib/finance-db';

export type AccountType = 'bank' | 'cash' | 'credit';
export type CategoryType = 'income' | 'expense';
export type TransactionType = CategoryType;

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
};

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
};

export type Transaction = {
  id: string;
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
};

export type Transfer = {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note: string;
  date: string;
};

export type FinanceSnapshot = {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  transfers: Transfer[];
};

type OperationResult = {
  ok: boolean;
  error?: string;
};

type AddAccountInput = {
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
};

type UpdateAccountInput = Partial<AddAccountInput>;

type AddCategoryInput = {
  name: string;
  type: CategoryType;
};

type UpdateCategoryInput = Partial<AddCategoryInput>;

type AddTransactionInput = {
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
};

type UpdateTransactionInput = AddTransactionInput;

type AddTransferInput = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note: string;
  date: string;
};

type UpdateTransferInput = AddTransferInput;

type FinanceContextValue = {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  transfers: Transfer[];
  addAccount: (input: AddAccountInput) => OperationResult;
  updateAccount: (id: string, input: UpdateAccountInput) => OperationResult;
  deleteAccount: (id: string) => OperationResult;
  addCategory: (input: AddCategoryInput) => OperationResult;
  updateCategory: (id: string, input: UpdateCategoryInput) => OperationResult;
  deleteCategory: (id: string) => OperationResult;
  addTransaction: (input: AddTransactionInput) => OperationResult;
  updateTransaction: (id: string, input: UpdateTransactionInput) => OperationResult;
  deleteTransaction: (id: string) => OperationResult;
  addTransfer: (input: AddTransferInput) => OperationResult;
  updateTransfer: (id: string, input: UpdateTransferInput) => OperationResult;
  deleteTransfer: (id: string) => OperationResult;
  replaceAllData: (snapshot: unknown) => OperationResult;
};

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

const today = new Date().toISOString().slice(0, 10);

const INITIAL_ACCOUNTS: Account[] = [];
const INITIAL_CATEGORIES: Category[] = [];
const INITIAL_TRANSACTIONS: Transaction[] = [];
const INITIAL_TRANSFERS: Transfer[] = [];
const INITIAL_SNAPSHOT = {
  accounts: INITIAL_ACCOUNTS,
  categories: INITIAL_CATEGORIES,
  transactions: INITIAL_TRANSACTIONS,
  transfers: INITIAL_TRANSFERS,
};

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const cleanText = (value: string) => value.trim();
const roundTo2 = (value: number) => Math.round(value * 100) / 100;
const getTransactionDelta = (type: TransactionType, amount: number) =>
  type === 'income' ? amount : -amount;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isAccountType = (value: unknown): value is AccountType =>
  value === 'bank' || value === 'cash' || value === 'credit';

const isCategoryType = (value: unknown): value is CategoryType =>
  value === 'income' || value === 'expense';

const isString = (value: unknown): value is string => typeof value === 'string';

const parseNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    return Number(value);
  }
  return Number.NaN;
};

const hasDuplicates = (items: string[]) => new Set(items).size !== items.length;

const normalizeSnapshot = (snapshot: unknown): { snapshot?: FinanceSnapshot; error?: string } => {
  if (!isRecord(snapshot)) {
    return { error: 'El respaldo tiene un formato invalido.' };
  }

  if (!Array.isArray(snapshot.accounts)) {
    return { error: 'El respaldo no incluye cuentas validas.' };
  }
  if (!Array.isArray(snapshot.categories)) {
    return { error: 'El respaldo no incluye categorias validas.' };
  }
  if (!Array.isArray(snapshot.transactions)) {
    return { error: 'El respaldo no incluye transacciones validas.' };
  }
  if (!Array.isArray(snapshot.transfers)) {
    return { error: 'El respaldo no incluye transferencias validas.' };
  }

  const accounts: Account[] = [];
  for (const raw of snapshot.accounts) {
    if (!isRecord(raw)) {
      return { error: 'Formato invalido en cuentas.' };
    }

    const amount = parseNumber(raw.balance);
    const id = isString(raw.id) ? cleanText(raw.id) : '';
    const name = isString(raw.name) ? cleanText(raw.name) : '';
    const currency = isString(raw.currency) ? cleanText(raw.currency).toUpperCase() : '';

    if (!id || !name || !currency || !isAccountType(raw.type) || !Number.isFinite(amount)) {
      return { error: 'Hay cuentas con datos invalidos.' };
    }

    accounts.push({
      id,
      name,
      type: raw.type,
      balance: roundTo2(amount),
      currency,
    });
  }

  const categories: Category[] = [];
  for (const raw of snapshot.categories) {
    if (!isRecord(raw)) {
      return { error: 'Formato invalido en categorias.' };
    }

    const id = isString(raw.id) ? cleanText(raw.id) : '';
    const name = isString(raw.name) ? cleanText(raw.name) : '';

    if (!id || !name || !isCategoryType(raw.type)) {
      return { error: 'Hay categorias con datos invalidos.' };
    }

    categories.push({
      id,
      name,
      type: raw.type,
    });
  }

  if (hasDuplicates(accounts.map((item) => item.id))) {
    return { error: 'Hay cuentas duplicadas en el respaldo.' };
  }

  if (hasDuplicates(categories.map((item) => item.id))) {
    return { error: 'Hay categorias duplicadas en el respaldo.' };
  }

  const accountIdSet = new Set(accounts.map((item) => item.id));
  const categoryById = Object.fromEntries(categories.map((item) => [item.id, item]));

  const transactions: Transaction[] = [];
  for (const raw of snapshot.transactions) {
    if (!isRecord(raw)) {
      return { error: 'Formato invalido en transacciones.' };
    }

    const amount = parseNumber(raw.amount);
    const id = isString(raw.id) ? cleanText(raw.id) : '';
    const accountId = isString(raw.accountId) ? cleanText(raw.accountId) : '';
    const categoryId = isString(raw.categoryId) ? cleanText(raw.categoryId) : '';
    const description = isString(raw.description) ? cleanText(raw.description) : '';
    const date = isString(raw.date) ? cleanText(raw.date) : '';

    if (!id || !accountId || !categoryId || !isCategoryType(raw.type) || !Number.isFinite(amount) || amount <= 0) {
      return { error: 'Hay transacciones con datos invalidos.' };
    }

    if (!accountIdSet.has(accountId)) {
      return { error: 'Una transaccion hace referencia a una cuenta inexistente.' };
    }

    const category = categoryById[categoryId];
    if (!category) {
      return { error: 'Una transaccion hace referencia a una categoria inexistente.' };
    }

    if (category.type !== raw.type) {
      return { error: 'Una transaccion tiene un tipo incompatible con su categoria.' };
    }

    transactions.push({
      id,
      accountId,
      categoryId,
      type: raw.type,
      amount: roundTo2(amount),
      description,
      date: date || today,
    });
  }

  if (hasDuplicates(transactions.map((item) => item.id))) {
    return { error: 'Hay transacciones duplicadas en el respaldo.' };
  }

  const transfers: Transfer[] = [];
  for (const raw of snapshot.transfers) {
    if (!isRecord(raw)) {
      return { error: 'Formato invalido en transferencias.' };
    }

    const amount = parseNumber(raw.amount);
    const id = isString(raw.id) ? cleanText(raw.id) : '';
    const fromAccountId = isString(raw.fromAccountId) ? cleanText(raw.fromAccountId) : '';
    const toAccountId = isString(raw.toAccountId) ? cleanText(raw.toAccountId) : '';
    const note = isString(raw.note) ? cleanText(raw.note) : '';
    const date = isString(raw.date) ? cleanText(raw.date) : '';

    if (!id || !fromAccountId || !toAccountId || !Number.isFinite(amount) || amount <= 0) {
      return { error: 'Hay transferencias con datos invalidos.' };
    }

    if (fromAccountId === toAccountId) {
      return { error: 'Hay transferencias con cuentas iguales en origen y destino.' };
    }

    if (!accountIdSet.has(fromAccountId) || !accountIdSet.has(toAccountId)) {
      return { error: 'Una transferencia hace referencia a cuentas inexistentes.' };
    }

    transfers.push({
      id,
      fromAccountId,
      toAccountId,
      amount: roundTo2(amount),
      note,
      date: date || today,
    });
  }

  if (hasDuplicates(transfers.map((item) => item.id))) {
    return { error: 'Hay transferencias duplicadas en el respaldo.' };
  }

  return {
    snapshot: {
      accounts,
      categories,
      transactions,
      transfers,
    },
  };
};

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [transfers, setTransfers] = useState<Transfer[]>(INITIAL_TRANSFERS);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const snapshot = await prepareFinanceSnapshot(INITIAL_SNAPSHOT);
        if (!isMounted) {
          return;
        }

        setAccounts(snapshot.accounts);
        setCategories(snapshot.categories);
        setTransactions(snapshot.transactions);
        setTransfers(snapshot.transfers);
      } catch (error) {
        console.error('Error al preparar SQLite para Finanzas:', error);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const persist = async () => {
      try {
        await persistFinanceSnapshot({ accounts, categories, transactions, transfers });
      } catch (error) {
        console.error('Error al persistir datos en SQLite:', error);
      }
    };

    void persist();
  }, [isHydrated, accounts, categories, transactions, transfers]);

  const addAccount = (input: AddAccountInput): OperationResult => {
    const name = cleanText(input.name);
    const currency = cleanText(input.currency).toUpperCase();

    if (!name) {
      return { ok: false, error: 'El nombre de la cuenta es obligatorio.' };
    }
    if (!Number.isFinite(input.balance)) {
      return { ok: false, error: 'El balance inicial debe ser un número válido.' };
    }
    if (!currency) {
      return { ok: false, error: 'La moneda es obligatoria.' };
    }

    setAccounts((prev) => [
      ...prev,
      {
        id: createId('account'),
        name,
        type: input.type,
        balance: roundTo2(input.balance),
        currency,
      },
    ]);

    return { ok: true };
  };

  const updateAccount = (id: string, input: UpdateAccountInput): OperationResult => {
    const exists = accounts.some((account) => account.id === id);
    if (!exists) {
      return { ok: false, error: 'La cuenta no existe.' };
    }

    if (input.balance !== undefined && !Number.isFinite(input.balance)) {
      return { ok: false, error: 'El balance debe ser un número válido.' };
    }

    setAccounts((prev) =>
      prev.map((account) => {
        if (account.id !== id) {
          return account;
        }

        const nextName = input.name !== undefined ? cleanText(input.name) : account.name;
        const nextCurrency =
          input.currency !== undefined ? cleanText(input.currency).toUpperCase() : account.currency;

        if (!nextName || !nextCurrency) {
          return account;
        }

        return {
          ...account,
          name: nextName,
          type: input.type ?? account.type,
          balance: roundTo2(input.balance ?? account.balance),
          currency: nextCurrency,
        };
      })
    );

    return { ok: true };
  };

  const deleteAccount = (id: string): OperationResult => {
    const exists = accounts.some((account) => account.id === id);
    if (!exists) {
      return { ok: false, error: 'La cuenta no existe.' };
    }

    setAccounts((prev) => prev.filter((account) => account.id !== id));
    setTransactions((prev) => prev.filter((transaction) => transaction.accountId !== id));
    setTransfers((prev) =>
      prev.filter((transfer) => transfer.fromAccountId !== id && transfer.toAccountId !== id)
    );

    return { ok: true };
  };

  const addCategory = (input: AddCategoryInput): OperationResult => {
    const name = cleanText(input.name);
    if (!name) {
      return { ok: false, error: 'El nombre de la categoría es obligatorio.' };
    }

    setCategories((prev) => [...prev, { id: createId('category'), name, type: input.type }]);
    return { ok: true };
  };

  const updateCategory = (id: string, input: UpdateCategoryInput): OperationResult => {
    const exists = categories.some((category) => category.id === id);
    if (!exists) {
      return { ok: false, error: 'La categoría no existe.' };
    }

    const inUseByDifferentType =
      input.type !== undefined &&
      transactions.some((transaction) => transaction.categoryId === id && transaction.type !== input.type);

    if (inUseByDifferentType) {
      return {
        ok: false,
        error: 'No puedes cambiar el tipo porque esta categoría ya tiene transacciones asociadas.',
      };
    }

    setCategories((prev) =>
      prev.map((category) => {
        if (category.id !== id) {
          return category;
        }

        const nextName = input.name !== undefined ? cleanText(input.name) : category.name;
        if (!nextName) {
          return category;
        }

        return {
          ...category,
          name: nextName,
          type: input.type ?? category.type,
        };
      })
    );

    return { ok: true };
  };

  const deleteCategory = (id: string): OperationResult => {
    const exists = categories.some((category) => category.id === id);
    if (!exists) {
      return { ok: false, error: 'La categoría no existe.' };
    }

    const usedByTransactions = transactions.some((transaction) => transaction.categoryId === id);
    if (usedByTransactions) {
      return { ok: false, error: 'No puedes eliminar una categoría usada en transacciones.' };
    }

    setCategories((prev) => prev.filter((category) => category.id !== id));
    return { ok: true };
  };

  const addTransaction = (input: AddTransactionInput): OperationResult => {
    if (!accounts.some((account) => account.id === input.accountId)) {
      return { ok: false, error: 'Debes seleccionar una cuenta válida.' };
    }

    const category = categories.find((item) => item.id === input.categoryId);
    if (!category) {
      return { ok: false, error: 'Debes seleccionar una categoría válida.' };
    }
    if (category.type !== input.type) {
      return { ok: false, error: 'La categoría no coincide con el tipo de transacción.' };
    }
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      return { ok: false, error: 'El monto debe ser mayor que cero.' };
    }

    const delta = getTransactionDelta(input.type, input.amount);

    setAccounts((prev) =>
      prev.map((account) =>
        account.id === input.accountId
          ? { ...account, balance: roundTo2(account.balance + delta) }
          : account
      )
    );

    setTransactions((prev) => [
      {
        id: createId('transaction'),
        accountId: input.accountId,
        categoryId: input.categoryId,
        type: input.type,
        amount: roundTo2(input.amount),
        description: cleanText(input.description),
        date: cleanText(input.date) || today,
      },
      ...prev,
    ]);

    return { ok: true };
  };

  const updateTransaction = (id: string, input: UpdateTransactionInput): OperationResult => {
    const current = transactions.find((transaction) => transaction.id === id);
    if (!current) {
      return { ok: false, error: 'La transacción no existe.' };
    }

    if (!accounts.some((account) => account.id === input.accountId)) {
      return { ok: false, error: 'Debes seleccionar una cuenta válida.' };
    }

    const category = categories.find((item) => item.id === input.categoryId);
    if (!category) {
      return { ok: false, error: 'Debes seleccionar una categoría válida.' };
    }
    if (category.type !== input.type) {
      return { ok: false, error: 'La categoría no coincide con el tipo de transacción.' };
    }
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      return { ok: false, error: 'El monto debe ser mayor que cero.' };
    }

    const currentDelta = getTransactionDelta(current.type, current.amount);
    const nextDelta = getTransactionDelta(input.type, input.amount);

    setAccounts((prev) =>
      prev.map((account) => {
        if (account.id === current.accountId && account.id === input.accountId) {
          return { ...account, balance: roundTo2(account.balance - currentDelta + nextDelta) };
        }
        if (account.id === current.accountId) {
          return { ...account, balance: roundTo2(account.balance - currentDelta) };
        }
        if (account.id === input.accountId) {
          return { ...account, balance: roundTo2(account.balance + nextDelta) };
        }
        return account;
      })
    );

    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === id
          ? {
              ...transaction,
              accountId: input.accountId,
              categoryId: input.categoryId,
              type: input.type,
              amount: roundTo2(input.amount),
              description: cleanText(input.description),
              date: cleanText(input.date) || today,
            }
          : transaction
      )
    );

    return { ok: true };
  };

  const deleteTransaction = (id: string): OperationResult => {
    const current = transactions.find((transaction) => transaction.id === id);
    if (!current) {
      return { ok: false, error: 'La transacción no existe.' };
    }

    const currentDelta = getTransactionDelta(current.type, current.amount);

    setAccounts((prev) =>
      prev.map((account) =>
        account.id === current.accountId
          ? { ...account, balance: roundTo2(account.balance - currentDelta) }
          : account
      )
    );

    setTransactions((prev) => prev.filter((transaction) => transaction.id !== id));
    return { ok: true };
  };

  const addTransfer = (input: AddTransferInput): OperationResult => {
    if (input.fromAccountId === input.toAccountId) {
      return { ok: false, error: 'La cuenta de origen y destino no pueden ser iguales.' };
    }

    if (!accounts.some((account) => account.id === input.fromAccountId)) {
      return { ok: false, error: 'Debes seleccionar una cuenta origen válida.' };
    }

    if (!accounts.some((account) => account.id === input.toAccountId)) {
      return { ok: false, error: 'Debes seleccionar una cuenta destino válida.' };
    }

    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      return { ok: false, error: 'El monto de la transferencia debe ser mayor que cero.' };
    }

    setAccounts((prev) =>
      prev.map((account) => {
        if (account.id === input.fromAccountId) {
          return { ...account, balance: roundTo2(account.balance - input.amount) };
        }
        if (account.id === input.toAccountId) {
          return { ...account, balance: roundTo2(account.balance + input.amount) };
        }
        return account;
      })
    );

    setTransfers((prev) => [
      {
        id: createId('transfer'),
        fromAccountId: input.fromAccountId,
        toAccountId: input.toAccountId,
        amount: roundTo2(input.amount),
        note: cleanText(input.note),
        date: cleanText(input.date) || today,
      },
      ...prev,
    ]);

    return { ok: true };
  };

  const updateTransfer = (id: string, input: UpdateTransferInput): OperationResult => {
    const current = transfers.find((transfer) => transfer.id === id);
    if (!current) {
      return { ok: false, error: 'La transferencia no existe.' };
    }

    if (input.fromAccountId === input.toAccountId) {
      return { ok: false, error: 'La cuenta de origen y destino no pueden ser iguales.' };
    }

    if (!accounts.some((account) => account.id === input.fromAccountId)) {
      return { ok: false, error: 'Debes seleccionar una cuenta origen válida.' };
    }

    if (!accounts.some((account) => account.id === input.toAccountId)) {
      return { ok: false, error: 'Debes seleccionar una cuenta destino válida.' };
    }

    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      return { ok: false, error: 'El monto de la transferencia debe ser mayor que cero.' };
    }

    const balancesDelta: Record<string, number> = {};

    balancesDelta[current.fromAccountId] = (balancesDelta[current.fromAccountId] ?? 0) + current.amount;
    balancesDelta[current.toAccountId] = (balancesDelta[current.toAccountId] ?? 0) - current.amount;
    balancesDelta[input.fromAccountId] = (balancesDelta[input.fromAccountId] ?? 0) - input.amount;
    balancesDelta[input.toAccountId] = (balancesDelta[input.toAccountId] ?? 0) + input.amount;

    setAccounts((prev) =>
      prev.map((account) =>
        balancesDelta[account.id] === undefined
          ? account
          : { ...account, balance: roundTo2(account.balance + balancesDelta[account.id]) }
      )
    );

    setTransfers((prev) =>
      prev.map((transfer) =>
        transfer.id === id
          ? {
              ...transfer,
              fromAccountId: input.fromAccountId,
              toAccountId: input.toAccountId,
              amount: roundTo2(input.amount),
              note: cleanText(input.note),
              date: cleanText(input.date) || today,
            }
          : transfer
      )
    );

    return { ok: true };
  };

  const deleteTransfer = (id: string): OperationResult => {
    const current = transfers.find((transfer) => transfer.id === id);
    if (!current) {
      return { ok: false, error: 'La transferencia no existe.' };
    }

    setAccounts((prev) =>
      prev.map((account) => {
        if (account.id === current.fromAccountId) {
          return { ...account, balance: roundTo2(account.balance + current.amount) };
        }
        if (account.id === current.toAccountId) {
          return { ...account, balance: roundTo2(account.balance - current.amount) };
        }
        return account;
      })
    );

    setTransfers((prev) => prev.filter((transfer) => transfer.id !== id));
    return { ok: true };
  };

  const replaceAllData = (snapshot: unknown): OperationResult => {
    const result = normalizeSnapshot(snapshot);
    if (!result.snapshot) {
      return { ok: false, error: result.error ?? 'El respaldo no es valido.' };
    }

    setAccounts(result.snapshot.accounts);
    setCategories(result.snapshot.categories);
    setTransactions(result.snapshot.transactions);
    setTransfers(result.snapshot.transfers);

    return { ok: true };
  };

  const value = useMemo(
    () => ({
      accounts,
      categories,
      transactions,
      transfers,
      addAccount,
      updateAccount,
      deleteAccount,
      addCategory,
      updateCategory,
      deleteCategory,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addTransfer,
      updateTransfer,
      deleteTransfer,
      replaceAllData,
    }),
    [accounts, categories, transactions, transfers]
  );

  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0a7ea4" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance debe usarse dentro de FinanceProvider.');
  }
  return context;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    color: '#334155',
    fontSize: 14,
  },
});

