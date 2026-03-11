import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PremiumScrollView } from "@/components/premium-scroll-view";
import { Fonts, type AppColorPalette } from "@/constants/theme";
import { useFinance } from "@/contexts/finance-context";
import { usePremiumUI } from "@/hooks/use-premium-ui";

const formatAmount = (amount: number, currency: string) => {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${currency} ${Math.abs(amount).toFixed(2)}`;
};

const getDateTimestamp = (value: string) => {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
};

export default function HomeScreen() {
  const { accounts, categories, transactions, transfers } = useFinance();
  const { colors, ui } = usePremiumUI();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const totalBalance = accounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );
  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalExpense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const currency = accounts[0]?.currency ?? "USD";
  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => {
          const dateDiff = getDateTimestamp(b.date) - getDateTimestamp(a.date);
          if (dateDiff !== 0) {
            return dateDiff;
          }
          return b.id.localeCompare(a.id);
        })
        .slice(0, 5),
    [transactions],
  );
  const recentTransfers = transfers.slice(0, 5);

  const accountNameById = Object.fromEntries(
    accounts.map((account) => [account.id, account.name]),
  );
  const categoryNameById = Object.fromEntries(
    categories.map((category) => [category.id, category.name]),
  );
  const netResult = totalIncome - totalExpense;

  const metricCards = [
    {
      label: "Balance total",
      value: formatAmount(totalBalance, currency),
      tone: "neutral" as const,
    },
    {
      label: "Ingresos",
      value: formatAmount(totalIncome, currency),
      tone: "positive" as const,
    },
    {
      label: "Gastos",
      value: formatAmount(totalExpense, currency),
      tone: "negative" as const,
    },
    {
      label: "Resultado neto",
      value: formatAmount(netResult, currency),
      tone: netResult >= 0 ? ("positive" as const) : ("negative" as const),
    },
  ];

  return (
    <PremiumScrollView contentContainerStyle={styles.container}>
      <Text style={ui.title}>Resumen financiero</Text>

      <View style={styles.grid}>
        {metricCards.map((card) => (
          <View key={card.label} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{card.label}</Text>
            <Text
              style={[
                styles.metricValue,
                card.tone === "positive" && styles.metricValuePositive,
                card.tone === "negative" && styles.metricValueNegative,
              ]}
            >
              {card.value}
            </Text>
          </View>
        ))}
      </View>

      <View style={[ui.section, styles.section]}>
        <Text style={ui.sectionTitle}>Cuentas</Text>
        {accounts.length === 0 ? (
          <Text style={ui.empty}>No hay cuentas registradas.</Text>
        ) : (
          accounts.map((account, index) => (
            <View
              key={account.id}
              style={[
                styles.listRow,
                index === accounts.length - 1 && styles.listRowLast,
              ]}
            >
              <View>
                <Text style={ui.itemTitle}>{account.name}</Text>
                <Text style={ui.itemMeta}>Tipo: {account.type}</Text>
              </View>
              <Text style={ui.itemAmount}>
                {formatAmount(account.balance, account.currency)}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={[ui.section, styles.section]}>
        <Text style={ui.sectionTitle}>Ultimas transacciones</Text>
        {recentTransactions.length === 0 ? (
          <Text style={ui.empty}>Aun no hay transacciones.</Text>
        ) : (
          recentTransactions.map((transaction, index) => (
            <View
              key={transaction.id}
              style={[
                styles.listRow,
                index === recentTransactions.length - 1 && styles.listRowLast,
              ]}
            >
              <View style={styles.itemBlock}>
                <Text style={ui.itemTitle}>
                  {transaction.description || "Sin descripcion"}
                </Text>
                <Text style={ui.itemMeta}>
                  {accountNameById[transaction.accountId] ?? "Cuenta"} |{" "}
                  {categoryNameById[transaction.categoryId] ?? "Categoria"} |{" "}
                  {transaction.date}
                </Text>
              </View>
              <Text style={ui.itemAmount}>
                {formatAmount(
                  transaction.type === "expense"
                    ? -transaction.amount
                    : transaction.amount,
                  currency,
                )}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={[ui.section, styles.section]}>
        <Text style={ui.sectionTitle}>Ultimas transferencias</Text>
        {recentTransfers.length === 0 ? (
          <Text style={ui.empty}>Aun no hay transferencias.</Text>
        ) : (
          recentTransfers.map((transfer, index) => (
            <View
              key={transfer.id}
              style={[
                styles.listRow,
                index === recentTransfers.length - 1 && styles.listRowLast,
              ]}
            >
              <View>
                <Text style={ui.itemTitle}>
                  {accountNameById[transfer.fromAccountId] ?? "Cuenta"}
                  {" -> "}
                  {accountNameById[transfer.toAccountId] ?? "Cuenta"}
                </Text>
                <Text style={ui.itemMeta}>{transfer.date}</Text>
              </View>
              <Text style={ui.itemAmount}>
                {formatAmount(transfer.amount, currency)}
              </Text>
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
    grid: {
      gap: 10,
    },
    metricCard: {
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
    },
    metricLabel: {
      fontSize: 13,
      marginBottom: 4,
      color: colors.textMuted,
      fontWeight: "600",
      fontFamily: Fonts.sans,
    },
    metricValue: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: 0.2,
      fontFamily: Fonts.sans,
    },
    metricValuePositive: {
      color: colors.positive,
    },
    metricValueNegative: {
      color: colors.negative,
    },
    section: {
      gap: 0,
    },
    listRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      paddingVertical: 11,
    },
    listRowLast: {
      borderBottomWidth: 0,
      paddingBottom: 0,
    },
    itemBlock: {
      flex: 1,
    },
    link: {
      marginTop: 4,
      fontWeight: "700",
      fontSize: 14,
      textDecorationLine: "underline",
      fontFamily: Fonts.sans,
    },
  });
