import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMemo, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PremiumScrollView } from '@/components/premium-scroll-view';
import { type AppColorPalette } from '@/constants/theme';
import { useThemePreference } from '@/contexts/theme-context';
import { type FinanceSnapshot, useFinance } from '@/contexts/finance-context';
import { type AppThemePreference } from '@/lib/finance-db';
import { usePremiumUI } from '@/hooks/use-premium-ui';

const THEME_OPTIONS: { value: AppThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

const THEME_LABEL: Record<AppThemePreference, string> = {
  system: 'Sistema',
  light: 'Claro',
  dark: 'Oscuro',
};

export default function SettingsScreen() {
  const { accounts, categories, transactions, transfers, replaceAllData } = useFinance();
  const { preference, setPreference } = useThemePreference();
  const { colors, ui } = usePremiumUI();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);

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
    <PremiumScrollView contentContainerStyle={styles.container}>
      <View style={styles.titleRow}>
        <MaterialIcons name="settings" size={30} color={colors.tint} />
        <Text style={ui.title}>Ajustes</Text>
      </View>

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Tema de color</Text>
        <Text style={styles.helpText}>
          Selecciona el esquema de color de la app. Sistema usa la configuracion del dispositivo.
        </Text>

        <View style={ui.chips}>
          {THEME_OPTIONS.map((option) => {
            const isActive = preference === option.value;
            return (
              <Pressable
                key={option.value}
                style={[ui.chip, isActive && ui.chipActive]}
                onPress={() => setPreference(option.value)}>
                <Text style={[ui.chipText, isActive && ui.chipTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.currentValue}>Seleccion actual: {THEME_LABEL[preference]}</Text>
      </View>

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Respaldo de datos</Text>
        <Text style={styles.helpText}>
          Exportar genera un archivo .json. Importar restaura todos los datos desde un respaldo.
        </Text>

        <Pressable
          style={[ui.primaryButton, isProcessingBackup && ui.buttonDisabled]}
          onPress={onExport}
          disabled={isProcessingBackup}>
          <Text style={ui.primaryButtonText}>Exportar respaldo</Text>
        </Pressable>

        <Pressable
          style={[ui.secondaryButton, isProcessingBackup && ui.buttonDisabled]}
          onPress={onImport}
          disabled={isProcessingBackup}>
          <Text style={ui.secondaryButtonText}>Importar respaldo</Text>
        </Pressable>
      </View>
    </PremiumScrollView>
  );
}

const createStyles = (colors: AppColorPalette) =>
  StyleSheet.create({
    container: {
      gap: 16,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    helpText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    currentValue: {
      color: colors.textSubtle,
      fontSize: 12,
      fontWeight: '600',
    },
  });
