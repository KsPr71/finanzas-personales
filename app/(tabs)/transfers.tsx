import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useFinance } from '@/contexts/finance-context';

const today = new Date().toISOString().slice(0, 10);

const formatAmount = (amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`;

export default function TransfersScreen() {
  const { accounts, transfers, addTransfer, updateTransfer, deleteTransfer } = useFinance();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');

  useEffect(() => {
    if (accounts.length < 2) {
      setFromAccountId(accounts[0]?.id ?? '');
      setToAccountId('');
      return;
    }

    if (!accounts.some((account) => account.id === fromAccountId)) {
      setFromAccountId(accounts[0].id);
    }

    if (!accounts.some((account) => account.id === toAccountId) || toAccountId === fromAccountId) {
      const fallback = accounts.find((account) => account.id !== fromAccountId)?.id ?? accounts[1].id;
      setToAccountId(fallback);
    }
  }, [accounts, fromAccountId, toAccountId]);

  const accountNameById = useMemo(
    () => Object.fromEntries(accounts.map((account) => [account.id, account.name])),
    [accounts]
  );

  const clearForm = () => {
    setEditingId(null);
    setAmount('');
    setDate(today);
    setNote('');
    setFromAccountId(accounts[0]?.id ?? '');
    setToAccountId(accounts[1]?.id ?? '');
  };

  const onSubmit = () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'El monto debe ser mayor que cero.');
      return;
    }
    if (!fromAccountId || !toAccountId) {
      Alert.alert('Error', 'Debes seleccionar una cuenta origen y una destino.');
      return;
    }

    const payload = {
      fromAccountId,
      toAccountId,
      amount: parsedAmount,
      note,
      date,
    };

    const result = editingId ? updateTransfer(editingId, payload) : addTransfer(payload);
    if (!result.ok) {
      Alert.alert('Error', result.error ?? 'No se pudo guardar la transferencia.');
      return;
    }

    clearForm();
  };

  const onEdit = (transferId: string) => {
    const transfer = transfers.find((item) => item.id === transferId);
    if (!transfer) {
      return;
    }

    setEditingId(transfer.id);
    setAmount(transfer.amount.toString());
    setDate(transfer.date);
    setNote(transfer.note);
    setFromAccountId(transfer.fromAccountId);
    setToAccountId(transfer.toAccountId);
  };

  const onDelete = (transferId: string) => {
    const result = deleteTransfer(transferId);
    if (!result.ok) {
      Alert.alert('Error', result.error ?? 'No se pudo eliminar la transferencia.');
      return;
    }

    if (editingId === transferId) {
      clearForm();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Transferencias</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{editingId ? 'Editar transferencia' : 'Nueva transferencia'}</Text>

        {accounts.length < 2 ? (
          <Text style={styles.empty}>
            Necesitas al menos dos cuentas para realizar transferencias internas.
          </Text>
        ) : (
          <>
            <Text style={styles.label}>Cuenta origen</Text>
            <View style={styles.chips}>
              {accounts.map((account) => (
                <Pressable
                  key={account.id}
                  onPress={() => setFromAccountId(account.id)}
                  style={[styles.chip, fromAccountId === account.id && styles.chipActive]}>
                  <Text style={[styles.chipText, fromAccountId === account.id && styles.chipTextActive]}>
                    {account.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Cuenta destino</Text>
            <View style={styles.chips}>
              {accounts
                .filter((account) => account.id !== fromAccountId)
                .map((account) => (
                  <Pressable
                    key={account.id}
                    onPress={() => setToAccountId(account.id)}
                    style={[styles.chip, toAccountId === account.id && styles.chipActive]}>
                    <Text style={[styles.chipText, toAccountId === account.id && styles.chipTextActive]}>
                      {account.name}
                    </Text>
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
              placeholder="Fecha (YYYY-MM-DD)"
              value={date}
              onChangeText={setDate}
              style={styles.input}
              placeholderTextColor="#94a3b8"
            />
            <TextInput
              placeholder="Nota"
              value={note}
              onChangeText={setNote}
              style={styles.input}
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.actions}>
              <Pressable style={styles.primaryButton} onPress={onSubmit}>
                <Text style={styles.primaryButtonText}>
                  {editingId ? 'Guardar cambios' : 'Agregar transferencia'}
                </Text>
              </Pressable>
              {editingId ? (
                <Pressable style={styles.secondaryButton} onPress={clearForm}>
                  <Text style={styles.secondaryButtonText}>Cancelar edición</Text>
                </Pressable>
              ) : null}
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historial</Text>
        {transfers.length === 0 ? (
          <Text style={styles.empty}>No hay transferencias registradas.</Text>
        ) : (
          transfers.map((transfer) => (
            <View key={transfer.id} style={styles.listItem}>
              <View style={styles.listInfo}>
                <Text style={styles.itemTitle}>
                  {accountNameById[transfer.fromAccountId] ?? 'Cuenta'} →{' '}
                  {accountNameById[transfer.toAccountId] ?? 'Cuenta'}
                </Text>
                <Text style={styles.itemMeta}>{transfer.date}</Text>
                {transfer.note ? <Text style={styles.itemMeta}>{transfer.note}</Text> : null}
              </View>
              <View style={styles.itemActions}>
                <Text style={styles.itemAmount}>
                  {formatAmount(
                    transfer.amount,
                    accounts.find((account) => account.id === transfer.fromAccountId)?.currency ?? 'USD'
                  )}
                </Text>
                <View style={styles.actionRow}>
                  <Pressable style={styles.linkButton} onPress={() => onEdit(transfer.id)}>
                    <Text style={styles.linkButtonText}>Editar</Text>
                  </Pressable>
                  <Pressable style={styles.linkButtonDanger} onPress={() => onDelete(transfer.id)}>
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
