import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFinance } from '@/contexts/finance-context';

const formatAmount = (amount: number, currency: string) => {
  const sign = amount < 0 ? '-' : '';
  return `${sign}${currency} ${Math.abs(amount).toFixed(2)}`;
};

export default function HomeScreen() {
  const { accounts, categories, transactions, transfers } = useFinance();

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalExpense = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const currency = accounts[0]?.currency ?? 'USD';
  const recentTransactions = transactions.slice(0, 5);
  const recentTransfers = transfers.slice(0, 5);

  const accountNameById = Object.fromEntries(accounts.map((account) => [account.id, account.name]));
  const categoryNameById = Object.fromEntries(categories.map((category) => [category.id, category.name]));
  const netResult = totalIncome - totalExpense;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Resumen financiero</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Balance total</Text>
          <Text style={styles.cardValue}>{formatAmount(totalBalance, currency)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Ingresos</Text>
          <Text style={styles.cardValue}>{formatAmount(totalIncome, currency)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Gastos</Text>
          <Text style={styles.cardValue}>{formatAmount(totalExpense, currency)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Resultado neto</Text>
          <Text style={styles.cardValue}>{formatAmount(netResult, currency)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuentas</Text>
        {accounts.map((account) => (
          <View key={account.id} style={styles.listItem}>
            <View>
              <Text style={styles.itemTitle}>{account.name}</Text>
              <Text style={styles.itemMeta}>Tipo: {account.type}</Text>
            </View>
            <Text style={styles.itemAmount}>{formatAmount(account.balance, account.currency)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimas transacciones</Text>
        {recentTransactions.length === 0 ? (
          <Text style={styles.empty}>Aún no hay transacciones.</Text>
        ) : (
          recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.listItem}>
              <View>
                <Text style={styles.itemTitle}>{transaction.description || 'Sin descripción'}</Text>
                <Text style={styles.itemMeta}>
                  {accountNameById[transaction.accountId] ?? 'Cuenta'} |{' '}
                  {categoryNameById[transaction.categoryId] ?? 'Categoría'} | {transaction.date}
                </Text>
              </View>
              <Text style={styles.itemAmount}>
                {formatAmount(
                  transaction.type === 'expense' ? -transaction.amount : transaction.amount,
                  currency
                )}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimas transferencias</Text>
        {recentTransfers.length === 0 ? (
          <Text style={styles.empty}>Aún no hay transferencias.</Text>
        ) : (
          recentTransfers.map((transfer) => (
            <View key={transfer.id} style={styles.listItem}>
              <View>
                <Text style={styles.itemTitle}>
                  {accountNameById[transfer.fromAccountId] ?? 'Cuenta'} →{' '}
                  {accountNameById[transfer.toAccountId] ?? 'Cuenta'}
                </Text>
                <Text style={styles.itemMeta}>{transfer.date}</Text>
              </View>
              <Text style={styles.itemAmount}>{formatAmount(transfer.amount, currency)}</Text>
            </View>
          ))
        )}
      </View>

      <Link href="/modal" style={styles.link}>
        Ir a información de la aplicación
      </Link>
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
  grid: {
    gap: 10,
  },
  card: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbeafe',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  cardLabel: {
    color: '#475569',
    fontSize: 13,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  itemTitle: {
    fontWeight: '600',
    color: '#0f172a',
  },
  itemMeta: {
    color: '#64748b',
    fontSize: 12,
  },
  itemAmount: {
    fontWeight: '700',
    color: '#0f172a',
  },
  empty: {
    color: '#64748b',
  },
  link: {
    marginTop: 6,
    color: '#0a7ea4',
    fontWeight: '600',
  },
});
