import { useMemo, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from 'react-native';

import { type CategoryType, type FinanceSnapshot, type Transaction, useFinance } from '@/contexts/finance-context';

const CHART_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#14b8a6', '#8b5cf6'];

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
  const { accounts, categories, transactions, transfers, replaceAllData } = useFinance();
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);

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

  const snapshotJson = useMemo(
    () =>
      JSON.stringify(
        {
          accounts,
          categories,
          transactions,
          transfers,
        } satisfies FinanceSnapshot,
        null,
        2
      ),
    [accounts, categories, transactions, transfers]
  );

  const onExport = async () => {
    if (isProcessingBackup) {
      return;
    }

    const baseDirectory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
    if (!baseDirectory) {
      Alert.alert('Error', 'No se encontro una carpeta disponible para crear el respaldo.');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileUri = `${baseDirectory}finanzas-respaldo-${timestamp}.json`;

    try {
      setIsProcessingBackup(true);
      await FileSystem.writeAsStringAsync(fileUri, snapshotJson);

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Respaldo creado', `Archivo guardado en:\n${fileUri}`);
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar respaldo JSON',
        UTI: 'public.json',
      });
    } catch {
      Alert.alert('Error', 'No se pudo exportar el respaldo JSON.');
    } finally {
      setIsProcessingBackup(false);
    }
  };

  const onImport = async () => {
    if (isProcessingBackup) {
      return;
    }

    try {
      setIsProcessingBackup(true);

      const selection = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (selection.canceled) {
        return;
      }

      const selectedFile = selection.assets?.[0];
      if (!selectedFile?.uri) {
        Alert.alert('Error', 'No se selecciono un archivo valido.');
        return;
      }

      const content = await FileSystem.readAsStringAsync(selectedFile.uri);
      const parsed = JSON.parse(content);

      const result = replaceAllData(parsed);
      if (!result.ok) {
        Alert.alert('Error', result.error ?? 'No se pudo importar el respaldo.');
        return;
      }

      Alert.alert('Listo', 'Respaldo JSON importado correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudo importar el archivo JSON.');
    } finally {
      setIsProcessingBackup(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reportes</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Relacion ingresos vs egresos</Text>

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Composicion de ingresos por categoria</Text>
        {incomeComposition.length === 0 ? (
          <Text style={styles.empty}>No hay ingresos para mostrar.</Text>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Composicion de gastos por categoria</Text>
        {expenseComposition.length === 0 ? (
          <Text style={styles.empty}>No hay gastos para mostrar.</Text>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Respaldo de datos</Text>
        <Text style={styles.helpText}>
          Exportar genera un archivo .json y abre compartir. Importar permite seleccionar un archivo
          .json para restaurar todos los datos.
        </Text>

        <Pressable
          style={[styles.primaryButton, isProcessingBackup && styles.buttonDisabled]}
          onPress={onExport}
          disabled={isProcessingBackup}>
          <Text style={styles.primaryButtonText}>Exportar respaldo</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, isProcessingBackup && styles.buttonDisabled]}
          onPress={onImport}
          disabled={isProcessingBackup}>
          <Text style={styles.secondaryButtonText}>Importar respaldo</Text>
        </Pressable>
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
  chartRow: {
    gap: 6,
  },
  categoryRow: {
    gap: 6,
  },
  chartLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  chartLabel: {
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  chartAmount: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 12,
  },
  barTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  barFillIncome: {
    backgroundColor: '#10b981',
  },
  barFillExpense: {
    backgroundColor: '#ef4444',
  },
  netValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  netPositive: {
    color: '#0f766e',
  },
  netNegative: {
    color: '#b91c1c',
  },
  helpText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
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
    borderColor: '#0a7ea4',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0a7ea4',
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  empty: {
    color: '#64748b',
  },
});
