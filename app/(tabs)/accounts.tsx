import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PremiumScrollView } from '@/components/premium-scroll-view';
import { Collapsible } from '@/components/ui/collapsible';
import { type AppColorPalette } from '@/constants/theme';
import { type AccountType, useFinance } from '@/contexts/finance-context';
import { usePremiumUI } from '@/hooks/use-premium-ui';

const ACCOUNT_TYPES: AccountType[] = ['bank', 'cash', 'credit'];

const formatAmount = (amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`;

export default function AccountsScreen() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useFinance();
  const { colors, ui } = usePremiumUI();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
      Alert.alert('Error', 'El balance debe ser un numero valido.');
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

  const renderAccountForm = (showCancelAction: boolean) => (
    <>
      <TextInput
        placeholder='Nombre'
        value={name}
        onChangeText={setName}
        style={ui.input}
        placeholderTextColor={colors.textSubtle}
      />
      <TextInput
        placeholder='Balance inicial'
        value={balance}
        onChangeText={setBalance}
        keyboardType='decimal-pad'
        style={ui.input}
        placeholderTextColor={colors.textSubtle}
      />
      <TextInput
        placeholder='Moneda (USD, EUR...)'
        value={currency}
        onChangeText={setCurrency}
        autoCapitalize='characters'
        style={ui.input}
        placeholderTextColor={colors.textSubtle}
      />

      <View style={ui.chips}>
        {ACCOUNT_TYPES.map((item) => (
          <Pressable
            key={item}
            onPress={() => setType(item)}
            style={[ui.chip, type === item && ui.chipActive]}>
            <Text style={[ui.chipText, type === item && ui.chipTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <View style={ui.actions}>
        <Pressable style={ui.primaryButton} onPress={onSubmit}>
          <Text style={ui.primaryButtonText}>{showCancelAction ? 'Guardar cambios' : 'Agregar cuenta'}</Text>
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
      <Text style={ui.title}>Cuentas</Text>

      <View style={ui.section}>
        {editingId ? (
          <>
            <Text style={ui.sectionTitle}>Editar cuenta</Text>
            {renderAccountForm(true)}
          </>
        ) : (
          <Collapsible title='Nueva cuenta'>{renderAccountForm(false)}</Collapsible>
        )}
      </View>

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Cuentas disponibles</Text>
        {accounts.length === 0 ? (
          <Text style={ui.empty}>No hay cuentas registradas.</Text>
        ) : (
          accounts.map((account) => (
            <View key={account.id} style={ui.listItem}>
              <View style={ui.listInfo}>
                <Text style={ui.itemTitle}>{account.name}</Text>
                <Text style={ui.itemMeta}>
                  Tipo: {account.type} | {formatAmount(account.balance, account.currency)}
                </Text>
              </View>
              <View style={styles.itemActions}>
                <Pressable style={styles.linkButton} onPress={() => onEdit(account.id)}>
                  <Text style={ui.linkButtonText}>Editar</Text>
                </Pressable>
                <Pressable style={styles.linkButton} onPress={() => onDelete(account.id)}>
                  <Text style={ui.linkButtonDangerText}>Eliminar</Text>
                </Pressable>
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
      flexDirection: 'row',
      gap: 14,
    },
    linkButton: {
      paddingVertical: 3,
      paddingHorizontal: 2,
    },
  });
