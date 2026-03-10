import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { type AccountType, useFinance } from '@/contexts/finance-context';

const ACCOUNT_TYPES: AccountType[] = ['bank', 'cash', 'credit'];

const formatAmount = (amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`;

export default function AccountsScreen() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useFinance();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [balance, setBalance] = useState('0');
  const [currency, setCurrency] = useState('USD');

  const clearForm = () => {
    setEditingId(null);
    setName('');
    setType('bank');
    setBalance('0');
    setCurrency('USD');
  };

  const onSubmit = () => {
    const parsedBalance = Number(balance);
    if (!Number.isFinite(parsedBalance)) {
      Alert.alert('Error', 'El balance debe ser un número válido.');
      return;
    }

    const result = editingId
      ? updateAccount(editingId, { name, type, balance: parsedBalance, currency })
      : addAccount({ name, type, balance: parsedBalance, currency });

    if (!result.ok) {
      Alert.alert('Error', result.error ?? 'No se pudo guardar la cuenta.');
      return;
    }

    clearForm();
  };

  const onEdit = (accountId: string) => {
    const account = accounts.find((item) => item.id === accountId);
    if (!account) {
      return;
    }

    setEditingId(account.id);
    setName(account.name);
    setType(account.type);
    setBalance(account.balance.toString());
    setCurrency(account.currency);
  };

  const onDelete = (accountId: string) => {
    const result = deleteAccount(accountId);
    if (!result.ok) {
      Alert.alert('Error', result.error ?? 'No se pudo eliminar la cuenta.');
      return;
    }

    if (editingId === accountId) {
      clearForm();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cuentas</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{editingId ? 'Editar cuenta' : 'Nueva cuenta'}</Text>

        <TextInput
          placeholder="Nombre"
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholderTextColor="#94a3b8"
        />
        <TextInput
          placeholder="Balance inicial"
          value={balance}
          onChangeText={setBalance}
          keyboardType="decimal-pad"
          style={styles.input}
          placeholderTextColor="#94a3b8"
        />
        <TextInput
          placeholder="Moneda (USD, EUR...)"
          value={currency}
          onChangeText={setCurrency}
          autoCapitalize="characters"
          style={styles.input}
          placeholderTextColor="#94a3b8"
        />

        <View style={styles.chips}>
          {ACCOUNT_TYPES.map((item) => (
            <Pressable
              key={item}
              onPress={() => setType(item)}
              style={[styles.chip, type === item && styles.chipActive]}>
              <Text style={[styles.chipText, type === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={onSubmit}>
            <Text style={styles.primaryButtonText}>{editingId ? 'Guardar cambios' : 'Agregar cuenta'}</Text>
          </Pressable>
          {editingId ? (
            <Pressable style={styles.secondaryButton} onPress={clearForm}>
              <Text style={styles.secondaryButtonText}>Cancelar edición</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuentas disponibles</Text>
        {accounts.length === 0 ? (
          <Text style={styles.empty}>No hay cuentas registradas.</Text>
        ) : (
          accounts.map((account) => (
            <View key={account.id} style={styles.listItem}>
              <View style={styles.listInfo}>
                <Text style={styles.itemTitle}>{account.name}</Text>
                <Text style={styles.itemMeta}>
                  Tipo: {account.type} | {formatAmount(account.balance, account.currency)}
                </Text>
              </View>
              <View style={styles.itemActions}>
                <Pressable style={styles.linkButton} onPress={() => onEdit(account.id)}>
                  <Text style={styles.linkButtonText}>Editar</Text>
                </Pressable>
                <Pressable style={styles.linkButtonDanger} onPress={() => onDelete(account.id)}>
                  <Text style={styles.linkButtonDangerText}>Eliminar</Text>
                </Pressable>
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
    color: '#111827',
  },
  itemMeta: {
    color: '#64748b',
    fontSize: 12,
  },
  itemActions: {
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
