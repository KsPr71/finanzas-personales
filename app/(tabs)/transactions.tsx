import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PremiumScrollView } from '@/components/premium-scroll-view';
import { Collapsible } from '@/components/ui/collapsible';
import { type AppColorPalette } from '@/constants/theme';
import { type Transaction, type TransactionType, useFinance } from '@/contexts/finance-context';
import { usePremiumUI } from '@/hooks/use-premium-ui';

const TRANSACTION_TYPES: TransactionType[] = ['income', 'expense'];
const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  income: 'Entrada',
  expense: 'Gastos',
};
const today = new Date().toISOString().slice(0, 10);
const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
const ALL_CATEGORIES_FILTER = 'all';

const formatAmount = (amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`;

const getDateTimestamp = (value: string) => {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
};

const getMonthInfo = (value: string) => {
  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) {
    return { key: 'sin-fecha', label: 'Sin fecha valida' };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return { key: 'sin-fecha', label: 'Sin fecha valida' };
  }

  const key = `${match[1]}-${match[2]}`;
  const labelRaw = monthFormatter.format(new Date(Date.UTC(year, month - 1, 1)));
  const label = labelRaw.charAt(0).toUpperCase() + labelRaw.slice(1);
  return { key, label };
};

type MonthlyTransactionGroup = {
  key: string;
  label: string;
  items: Transaction[];
};

const buildMonthlyGroups = (items: Transaction[]) => {
  const groups: MonthlyTransactionGroup[] = [];

  items.forEach((transaction) => {
    const monthInfo = getMonthInfo(transaction.date);
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.key === monthInfo.key) {
      lastGroup.items.push(transaction);
      return;
    }

    groups.push({
      key: monthInfo.key,
      label: monthInfo.label,
      items: [transaction],
    });
  });

  return groups;
};

export default function TransactionsScreen() {
  const {
    accounts,
    categories,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinance();
  const { colors, ui } = usePremiumUI();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today);
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryFilterId, setCategoryFilterId] = useState<string>(ALL_CATEGORIES_FILTER);

  const availableCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type]
  );

  useEffect(() => {
    if (accounts.length === 0) {
      setAccountId('');
      return;
    }
    if (!accounts.some((account) => account.id === accountId)) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  useEffect(() => {
    if (availableCategories.length === 0) {
      setCategoryId('');
      return;
    }
    if (!availableCategories.some((category) => category.id === categoryId)) {
      setCategoryId(availableCategories[0].id);
    }
  }, [availableCategories, categoryId]);

  useEffect(() => {
    if (categoryFilterId === ALL_CATEGORIES_FILTER) {
      return;
    }

    if (!categories.some((category) => category.id === categoryFilterId)) {
      setCategoryFilterId(ALL_CATEGORIES_FILTER);
    }
  }, [categories, categoryFilterId]);

  const accountNameById = useMemo(
    () => Object.fromEntries(accounts.map((account) => [account.id, account.name])),
    [accounts]
  );

  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories]
  );

  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort((a, b) => {
        const dateDiff = getDateTimestamp(b.date) - getDateTimestamp(a.date);
        if (dateDiff !== 0) {
          return dateDiff;
        }

        return b.id.localeCompare(a.id);
      }),
    [transactions]
  );

  const filteredTransactions = useMemo(
    () =>
      sortedTransactions.filter((transaction) => {
        if (categoryFilterId === ALL_CATEGORIES_FILTER) {
          return true;
        }
        return transaction.categoryId === categoryFilterId;
      }),
    [sortedTransactions, categoryFilterId]
  );

  const incomeMonthlyTransactions = useMemo(
    () => buildMonthlyGroups(filteredTransactions.filter((transaction) => transaction.type === 'income')),
    [filteredTransactions]
  );

  const expenseMonthlyTransactions = useMemo(
    () => buildMonthlyGroups(filteredTransactions.filter((transaction) => transaction.type === 'expense')),
    [filteredTransactions]
  );

  const renderMonthlyGroups = (groups: MonthlyTransactionGroup[]) =>
    groups.map((group) => (
      <View key={group.key} style={styles.monthGroup}>
        <Text style={styles.monthTitle}>{group.label}</Text>
        <View style={styles.monthItems}>
          {group.items.map((transaction) => (
            <View key={transaction.id} style={ui.listItem}>
              <View style={ui.listInfo}>
                <Text style={ui.itemTitle}>{transaction.description || 'Sin descripcion'}</Text>
                <Text style={ui.itemMeta}>
                  {transaction.date} | {accountNameById[transaction.accountId] ?? 'Cuenta'} |{' '}
                  {categoryNameById[transaction.categoryId] ?? 'Categoria'}
                </Text>
                <Text style={ui.itemMeta}>Tipo: {TRANSACTION_TYPE_LABEL[transaction.type]}</Text>
              </View>
              <View style={styles.itemActions}>
                <Text style={ui.itemAmount}>
                  {formatAmount(
                    transaction.type === 'expense' ? -transaction.amount : transaction.amount,
                    accounts.find((account) => account.id === transaction.accountId)?.currency ?? 'USD'
                  )}
                </Text>
                <View style={styles.actionRow}>
                  <Pressable style={styles.linkButton} onPress={() => onEdit(transaction.id)}>
                    <Text style={ui.linkButtonText}>Editar</Text>
                  </Pressable>
                  <Pressable style={styles.linkButton} onPress={() => onDelete(transaction.id)}>
                    <Text style={ui.linkButtonDangerText}>Eliminar</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    ));

  const hasTransactionsForFilter = filteredTransactions.length > 0;

  const hasIncomeForFilter = incomeMonthlyTransactions.length > 0;

  const hasExpenseForFilter = expenseMonthlyTransactions.length > 0;

  const clearForm = () => {
    setEditingId(null);
    setType('expense');
    setAmount('');
    setDescription('');
    setDate(today);
    setAccountId(accounts[0]?.id ?? '');
  };

  const onSubmit = () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'El monto debe ser mayor que cero.');
      return;
    }
    if (!accountId || !categoryId) {
      Alert.alert('Error', 'Selecciona cuenta y categoria.');
      return;
    }

    const payload = {
      accountId,
      categoryId,
      type,
      amount: parsedAmount,
      description,
      date,
    };

    const result = editingId ? updateTransaction(editingId, payload) : addTransaction(payload);

    if (!result.ok) {
      Alert.alert('Error', result.error ?? 'No se pudo guardar la transaccion.');
      return;
    }

    clearForm();
  };

  const onEdit = (transactionId: string) => {
    const transaction = transactions.find((item) => item.id === transactionId);
    if (!transaction) {
      return;
    }

    setEditingId(transaction.id);
    setType(transaction.type);
    setAmount(transaction.amount.toString());
    setDescription(transaction.description);
    setDate(transaction.date);
    setAccountId(transaction.accountId);
    setCategoryId(transaction.categoryId);
  };

  const onDelete = (transactionId: string) => {
    const result = deleteTransaction(transactionId);
    if (!result.ok) {
      Alert.alert('Error', result.error ?? 'No se pudo eliminar la transaccion.');
      return;
    }

    if (editingId === transactionId) {
      clearForm();
    }
  };

  const renderTransactionForm = (showCancelAction: boolean) => (
    <>
      <View style={ui.chips}>
        {TRANSACTION_TYPES.map((item) => (
          <Pressable
            key={item}
            onPress={() => setType(item)}
            style={[ui.chip, type === item && ui.chipActive]}>
            <Text style={[ui.chipText, type === item && ui.chipTextActive]}>
              {TRANSACTION_TYPE_LABEL[item]}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        placeholder='Monto'
        value={amount}
        onChangeText={setAmount}
        keyboardType='decimal-pad'
        style={ui.input}
        placeholderTextColor={colors.textSubtle}
      />

      <TextInput
        placeholder='Descripcion'
        value={description}
        onChangeText={setDescription}
        style={ui.input}
        placeholderTextColor={colors.textSubtle}
      />

      <TextInput
        placeholder='Fecha (YYYY-MM-DD)'
        value={date}
        onChangeText={setDate}
        style={ui.input}
        placeholderTextColor={colors.textSubtle}
      />

      <Text style={ui.label}>Cuenta</Text>
      <View style={ui.chips}>
        {accounts.map((account) => (
          <Pressable
            key={account.id}
            onPress={() => setAccountId(account.id)}
            style={[ui.chip, accountId === account.id && ui.chipActive]}>
            <Text style={[ui.chipText, accountId === account.id && ui.chipTextActive]}>{account.name}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={ui.label}>Categoria</Text>
      <View style={ui.chips}>
        {availableCategories.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => setCategoryId(category.id)}
            style={[ui.chip, categoryId === category.id && ui.chipActive]}>
            <Text style={[ui.chipText, categoryId === category.id && ui.chipTextActive]}>{category.name}</Text>
          </Pressable>
        ))}
      </View>

      <View style={ui.actions}>
        <Pressable style={ui.primaryButton} onPress={onSubmit}>
          <Text style={ui.primaryButtonText}>{showCancelAction ? 'Guardar cambios' : 'Agregar transaccion'}</Text>
        </Pressable>
        {showCancelAction ? (
          <Pressable style={ui.secondaryButton} onPress={clearForm}>
            <Text style={ui.secondaryButtonText}>Cancelar edicion</Text>
          </Pressable>
        ) : null}
      </View>
    </>
  );

  return (
    <PremiumScrollView contentContainerStyle={styles.container}>
      <Text style={ui.title}>Transacciones</Text>

      <View style={ui.section}>
        {editingId ? (
          <>
            <Text style={ui.sectionTitle}>Editar transaccion</Text>
            {renderTransactionForm(true)}
          </>
        ) : (
          <Collapsible title='Nueva transaccion'>{renderTransactionForm(false)}</Collapsible>
        )}
      </View>

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Listado</Text>
        <Text style={ui.label}>Filtrar por categoria</Text>
        <View style={ui.chips}>
          <Pressable
            onPress={() => setCategoryFilterId(ALL_CATEGORIES_FILTER)}
            style={[ui.chip, categoryFilterId === ALL_CATEGORIES_FILTER && ui.chipActive]}>
            <Text style={[ui.chipText, categoryFilterId === ALL_CATEGORIES_FILTER && ui.chipTextActive]}>
              Todas
            </Text>
          </Pressable>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setCategoryFilterId(category.id)}
              style={[ui.chip, categoryFilterId === category.id && ui.chipActive]}>
              <Text style={[ui.chipText, categoryFilterId === category.id && ui.chipTextActive]}>
                {category.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {sortedTransactions.length === 0 ? (
          <Text style={ui.empty}>No hay transacciones registradas.</Text>
        ) : !hasTransactionsForFilter ? (
          <Text style={ui.empty}>No hay transacciones para la categoria seleccionada.</Text>
        ) : (
          <>
            <View style={styles.typeGroup}>
              <Text style={styles.typeTitle}>Entradas</Text>
              {hasIncomeForFilter ? (
                renderMonthlyGroups(incomeMonthlyTransactions)
              ) : (
                <Text style={ui.empty}>No hay entradas para la categoria seleccionada.</Text>
              )}
            </View>

            <View style={styles.typeGroup}>
              <Text style={styles.typeTitle}>Gastos</Text>
              {hasExpenseForFilter ? (
                renderMonthlyGroups(expenseMonthlyTransactions)
              ) : (
                <Text style={ui.empty}>No hay gastos para la categoria seleccionada.</Text>
              )}
            </View>
          </>
        )}
      </View>
    </PremiumScrollView>
  );
}

const createStyles = (colors: AppColorPalette) =>
  StyleSheet.create({
    container: {
      gap: 16,
    },
    monthGroup: {
      gap: 8,
    },
    monthTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
    },
    monthItems: {
      gap: 8,
    },
    typeGroup: {
      gap: 10,
    },
    typeTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '800',
    },
    itemActions: {
      gap: 8,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 14,
    },
    linkButton: {
      paddingVertical: 3,
      paddingHorizontal: 2,
    },
  });
