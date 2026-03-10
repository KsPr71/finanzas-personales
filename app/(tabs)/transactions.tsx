import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { type TransactionType, useFinance } from '@/contexts/finance-context';

const TRANSACTION_TYPES: TransactionType[] = ['income', 'expense'];
const today = new Date().toISOString().slice(0, 10);

const formatAmount = (amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`;

export default function TransactionsScreen() {
  const {
    accounts,
    categories,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinance();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today);
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');

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

  const accountNameById = useMemo(
    () => Object.fromEntries(accounts.map((account) => [account.id, account.name])),
    [accounts]
  );

  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories]
  );

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
      Alert.alert('Error', 'Selecciona cuenta y categoría.');
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
      Alert.alert('Error', result.error ?? 'No se pudo guardar la transacción.');
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
      Alert.alert('Error', result.error ?? 'No se pudo eliminar la transacción.');
      return;
    }

    if (editingId === transactionId) {
      clearForm();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Transacciones</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{editingId ? 'Editar transacción' : 'Nueva transacción'}</Text>

        <View style={styles.chips}>
          {TRANSACTION_TYPES.map((item) => (
            <Pressable
              key={item}
              onPress={() => setType(item)}
              style={[styles.chip, type === item && styles.chipActive]}>
              <Text style={[styles.chipText, type === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          placeholder="Monto"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          style={styles.input}
          placeholderTextColor="#94a3b8"
        />

        <TextInput
          placeholder="Descripción"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          placeholderTextColor="#94a3b8"
        />

        <TextInput
          placeholder="Fecha (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
          style={styles.input}
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Cuenta</Text>
        <View style={styles.chips}>
          {accounts.map((account) => (
            <Pressable
              key={account.id}
              onPress={() => setAccountId(account.id)}
              style={[styles.chip, accountId === account.id && styles.chipActive]}>
              <Text style={[styles.chipText, accountId === account.id && styles.chipTextActive]}>
                {account.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.chips}>
          {availableCategories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setCategoryId(category.id)}
              style={[styles.chip, categoryId === category.id && styles.chipActive]}>
              <Text style={[styles.chipText, categoryId === category.id && styles.chipTextActive]}>
                {category.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={onSubmit}>
            <Text style={styles.primaryButtonText}>
              {editingId ? 'Guardar cambios' : 'Agregar transacción'}
            </Text>
          </Pressable>
          {editingId ? (
            <Pressable style={styles.secondaryButton} onPress={clearForm}>
              <Text style={styles.secondaryButtonText}>Cancelar edición</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Listado</Text>
        {transactions.length === 0 ? (
          <Text style={styles.empty}>No hay transacciones registradas.</Text>
        ) : (
          transactions.map((transaction) => (
            <View key={transaction.id} style={styles.listItem}>
              <View style={styles.listInfo}>
                <Text style={styles.itemTitle}>{transaction.description || 'Sin descripción'}</Text>
                <Text style={styles.itemMeta}>
                  {transaction.date} | {accountNameById[transaction.accountId] ?? 'Cuenta'} |{' '}
                  {categoryNameById[transaction.categoryId] ?? 'Categoría'}
                </Text>
                <Text style={styles.itemMeta}>Tipo: {transaction.type}</Text>
              </View>
              <View style={styles.itemActions}>
                <Text style={styles.itemAmount}>
                  {formatAmount(
                    transaction.type === 'expense' ? -transaction.amount : transaction.amount,
                    accounts.find((account) => account.id === transaction.accountId)?.currency ?? 'USD'
                  )}
                </Text>
                <View style={styles.actionRow}>
                  <Pressable style={styles.linkButton} onPress={() => onEdit(transaction.id)}>
                    <Text style={styles.linkButtonText}>Editar</Text>
                  </Pressable>
                  <Pressable style={styles.linkButtonDanger} onPress={() => onDelete(transaction.id)}>
                    <Text style={styles.linkButtonDangerText}>Eliminar</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  section: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  label: {
    color: '#475569',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#0f172a',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: '#0a7ea4',
    backgroundColor: '#ecfeff',
  },
  chipText: {
    color: '#334155',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#0a7ea4',
  },
  actions: {
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#334155',
    fontWeight: '600',
  },
  listItem: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  listInfo: {
    gap: 2,
  },
  itemTitle: {
    fontWeight: '700',
    color: '#0f172a',
  },
  itemMeta: {
    color: '#64748b',
    fontSize: 12,
  },
  itemActions: {
    gap: 6,
  },
  itemAmount: {
    color: '#0f172a',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  linkButton: {
    paddingVertical: 4,
  },
  linkButtonText: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  linkButtonDanger: {
    paddingVertical: 4,
  },
  linkButtonDangerText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  empty: {
    color: '#64748b',
  },
});
