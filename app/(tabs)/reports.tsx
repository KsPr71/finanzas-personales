import { useMemo } from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { PremiumScrollView } from '@/components/premium-scroll-view';
import { type AppColorPalette } from '@/constants/theme';
import { type CategoryType, type Transaction, useFinance } from '@/contexts/finance-context';
import { usePremiumUI } from '@/hooks/use-premium-ui';

const CHART_COLORS = ['#17a6d3', '#15b28b', '#d18f22', '#4379e2', '#e15f5f', '#23b5a7', '#3ea3e6'];

type CategoryCompositionItem = {
  categoryId: string;
  name: string;
  total: number;
  percent: number;
  color: string;
};

const toPercentWidth = (value: number): DimensionValue => `${value}%`;

const formatAmount = (amount: number, currency: string) => {
  const sign = amount < 0 ? '-' : '';
  return `${sign}${currency} ${Math.abs(amount).toFixed(2)}`;
};

const getCategoryComposition = (
  type: CategoryType,
  transactions: Transaction[],
  categoryNameById: Record<string, string>
): CategoryCompositionItem[] => {
  const totalsByCategory: Record<string, number> = {};

  transactions.forEach((transaction) => {
    if (transaction.type !== type) {
      return;
    }
    totalsByCategory[transaction.categoryId] =
      (totalsByCategory[transaction.categoryId] ?? 0) + transaction.amount;
  });

  const items = Object.entries(totalsByCategory).map(([categoryId, total]) => ({
    categoryId,
    name: categoryNameById[categoryId] ?? 'Sin categoria',
    total,
  }));

  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  return items
    .sort((a, b) => b.total - a.total)
    .map((item, index) => ({
      ...item,
      percent: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
};

export default function ReportsScreen() {
  const { accounts, categories, transactions } = useFinance();
  const { colors, ui } = usePremiumUI();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const currency = accounts[0]?.currency ?? 'USD';
  const totalIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalExpense = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const netResult = totalIncome - totalExpense;
  const maxIncomeExpense = Math.max(totalIncome, totalExpense, 1);
  const incomeWidth = toPercentWidth(
    Math.max((totalIncome / maxIncomeExpense) * 100, totalIncome > 0 ? 4 : 0)
  );
  const expenseWidth = toPercentWidth(
    Math.max((totalExpense / maxIncomeExpense) * 100, totalExpense > 0 ? 4 : 0)
  );

  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories]
  );
  const incomeComposition = getCategoryComposition('income', transactions, categoryNameById);
  const expenseComposition = getCategoryComposition('expense', transactions, categoryNameById);

  return (
    <PremiumScrollView contentContainerStyle={styles.container}>
      <Text style={ui.title}>Reportes</Text>

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Relacion ingresos vs egresos</Text>

        <View style={styles.chartRow}>
          <View style={styles.chartLabelRow}>
            <Text style={styles.chartLabel}>Ingresos</Text>
            <Text style={styles.chartAmount}>{formatAmount(totalIncome, currency)}</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, styles.barFillIncome, { width: incomeWidth }]} />
          </View>
        </View>

        <View style={styles.chartRow}>
          <View style={styles.chartLabelRow}>
            <Text style={styles.chartLabel}>Gastos</Text>
            <Text style={styles.chartAmount}>{formatAmount(totalExpense, currency)}</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, styles.barFillExpense, { width: expenseWidth }]} />
          </View>
        </View>

        <Text style={[styles.netValue, netResult >= 0 ? styles.netPositive : styles.netNegative]}>
          Resultado neto: {formatAmount(netResult, currency)}
        </Text>
      </View>

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Composicion de ingresos por categoria</Text>
        {incomeComposition.length === 0 ? (
          <Text style={ui.empty}>No hay ingresos para mostrar.</Text>
        ) : (
          incomeComposition.map((item) => (
            <View key={item.categoryId} style={styles.categoryRow}>
              <View style={styles.chartLabelRow}>
                <Text style={styles.chartLabel}>{item.name}</Text>
                <Text style={styles.chartAmount}>
                  {formatAmount(item.total, currency)} ({item.percent.toFixed(1)}%)
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: toPercentWidth(Math.max(item.percent, 4)),
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </View>
          ))
        )}
      </View>

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Composicion de gastos por categoria</Text>
        {expenseComposition.length === 0 ? (
          <Text style={ui.empty}>No hay gastos para mostrar.</Text>
        ) : (
          expenseComposition.map((item) => (
            <View key={item.categoryId} style={styles.categoryRow}>
              <View style={styles.chartLabelRow}>
                <Text style={styles.chartLabel}>{item.name}</Text>
                <Text style={styles.chartAmount}>
                  {formatAmount(item.total, currency)} ({item.percent.toFixed(1)}%)
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: toPercentWidth(Math.max(item.percent, 4)),
                      backgroundColor: item.color,
                    },
                  ]}
                />
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
    chartRow: {
      gap: 7,
    },
    categoryRow: {
      gap: 7,
    },
    chartLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    chartLabel: {
      color: colors.textMuted,
      fontWeight: '700',
      flex: 1,
      fontSize: 13,
    },
    chartAmount: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 12,
    },
    barTrack: {
      width: '100%',
      height: 10,
      borderRadius: 999,
      overflow: 'hidden',
      backgroundColor: colors.border,
    },
    barFill: {
      height: '100%',
      borderRadius: 999,
    },
    barFillIncome: {
      backgroundColor: colors.positive,
    },
    barFillExpense: {
      backgroundColor: colors.negative,
    },
    netValue: {
      fontSize: 13,
      fontWeight: '800',
      marginTop: 2,
    },
    netPositive: {
      color: colors.positive,
    },
    netNegative: {
      color: colors.negative,
    },
  });
