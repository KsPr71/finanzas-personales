import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PremiumScrollView } from '@/components/premium-scroll-view';
import { Collapsible } from '@/components/ui/collapsible';
import { type AppColorPalette } from '@/constants/theme';
import { useFinance } from '@/contexts/finance-context';
import { usePremiumUI } from '@/hooks/use-premium-ui';

const today = new Date().toISOString().slice(0, 10);

const formatAmount = (amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`;

export default function TransfersScreen() {
  const { accounts, transfers, addTransfer, updateTransfer, deleteTransfer } = useFinance();
  const { colors, ui } = usePremiumUI();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

  const renderTransferForm = (showCancelAction: boolean) => {
    if (accounts.length < 2) {
      return <Text style={ui.empty}>Necesitas al menos dos cuentas para realizar transferencias internas.</Text>;
    }

    return (
      <>
        <Text style={ui.label}>Cuenta origen</Text>
        <View style={ui.chips}>
          {accounts.map((account) => (
            <Pressable
              key={account.id}
              onPress={() => setFromAccountId(account.id)}
              style={[ui.chip, fromAccountId === account.id && ui.chipActive]}>
              <Text style={[ui.chipText, fromAccountId === account.id && ui.chipTextActive]}>
                {account.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={ui.label}>Cuenta destino</Text>
        <View style={ui.chips}>
          {accounts
            .filter((account) => account.id !== fromAccountId)
            .map((account) => (
              <Pressable
                key={account.id}
                onPress={() => setToAccountId(account.id)}
                style={[ui.chip, toAccountId === account.id && ui.chipActive]}>
                <Text style={[ui.chipText, toAccountId === account.id && ui.chipTextActive]}>
                  {account.name}
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
          placeholder='Fecha (YYYY-MM-DD)'
          value={date}
          onChangeText={setDate}
          style={ui.input}
          placeholderTextColor={colors.textSubtle}
        />
        <TextInput
          placeholder='Nota'
          value={note}
          onChangeText={setNote}
          style={ui.input}
          placeholderTextColor={colors.textSubtle}
        />

        <View style={ui.actions}>
          <Pressable style={ui.primaryButton} onPress={onSubmit}>
            <Text style={ui.primaryButtonText}>
              {showCancelAction ? 'Guardar cambios' : 'Agregar transferencia'}
            </Text>
          </Pressable>
          {showCancelAction ? (
            <Pressable style={ui.secondaryButton} onPress={clearForm}>
              <Text style={ui.secondaryButtonText}>Cancelar edicion</Text>
            </Pressable>
          ) : null}
        </View>
      </>
    );
  };

  return (
    <PremiumScrollView contentContainerStyle={styles.container}>
      <Text style={ui.title}>Transferencias</Text>

      <View style={ui.section}>
        {editingId ? (
          <>
            <Text style={ui.sectionTitle}>Editar transferencia</Text>
            {renderTransferForm(true)}
          </>
        ) : (
          <Collapsible title='Nueva transferencia'>{renderTransferForm(false)}</Collapsible>
        )}
      </View>

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Historial</Text>
        {transfers.length === 0 ? (
          <Text style={ui.empty}>No hay transferencias registradas.</Text>
        ) : (
          transfers.map((transfer) => (
            <View key={transfer.id} style={ui.listItem}>
              <View style={ui.listInfo}>
                <Text style={ui.itemTitle}>
                  {accountNameById[transfer.fromAccountId] ?? 'Cuenta'}
                  {' -> '}
                  {accountNameById[transfer.toAccountId] ?? 'Cuenta'}
                </Text>
                <Text style={ui.itemMeta}>{transfer.date}</Text>
                {transfer.note ? <Text style={ui.itemMeta}>{transfer.note}</Text> : null}
              </View>
              <View style={styles.itemActions}>
                <Text style={ui.itemAmount}>
                  {formatAmount(
                    transfer.amount,
                    accounts.find((account) => account.id === transfer.fromAccountId)?.currency ?? 'USD'
                  )}
                </Text>
                <View style={styles.actionRow}>
                  <Pressable style={styles.linkButton} onPress={() => onEdit(transfer.id)}>
                    <Text style={ui.linkButtonText}>Editar</Text>
                  </Pressable>
                  <Pressable style={styles.linkButton} onPress={() => onDelete(transfer.id)}>
                    <Text style={ui.linkButtonDangerText}>Eliminar</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
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
