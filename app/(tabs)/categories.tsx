import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PremiumScrollView } from '@/components/premium-scroll-view';
import { Collapsible } from '@/components/ui/collapsible';
import { type AppColorPalette } from '@/constants/theme';
import { type CategoryType, useFinance } from '@/contexts/finance-context';
import { usePremiumUI } from '@/hooks/use-premium-ui';

const CATEGORY_TYPES: CategoryType[] = ['income', 'expense'];

export default function CategoriesScreen() {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
  const { colors, ui } = usePremiumUI();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');

  const groupedCategories = useMemo(
    () => ({
      income: categories.filter((category) => category.type === 'income'),
      expense: categories.filter((category) => category.type === 'expense'),
    }),
    [categories]
  );

  const clearForm = () => {
    setEditingId(null);
    setName('');
    setType('expense');
  };

  const onSubmit = () => {
    const result = editingId ? updateCategory(editingId, { name, type }) : addCategory({ name, type });
    if (!result.ok) {
      Alert.alert('Error', result.error ?? 'No se pudo guardar la categoria.');
      return;
    }

    clearForm();
  };

  const onEdit = (categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId);
    if (!category) {
      return;
    }

    setEditingId(category.id);
    setName(category.name);
    setType(category.type);
  };

  const onDelete = (categoryId: string) => {
    const result = deleteCategory(categoryId);
    if (!result.ok) {
      Alert.alert('Error', result.error ?? 'No se pudo eliminar la categoria.');
      return;
    }

    if (editingId === categoryId) {
      clearForm();
    }
  };

  const renderCategoryForm = (showCancelAction: boolean) => (
    <>
      <TextInput
        placeholder='Nombre'
        value={name}
        onChangeText={setName}
        style={ui.input}
        placeholderTextColor={colors.textSubtle}
      />
      <View style={ui.chips}>
        {CATEGORY_TYPES.map((item) => (
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
          <Text style={ui.primaryButtonText}>{showCancelAction ? 'Guardar cambios' : 'Agregar categoria'}</Text>
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
      <Text style={ui.title}>Categorias</Text>

      <View style={ui.section}>
        {editingId ? (
          <>
            <Text style={ui.sectionTitle}>Editar categoria</Text>
            {renderCategoryForm(true)}
          </>
        ) : (
          <Collapsible title='Nueva categoria'>{renderCategoryForm(false)}</Collapsible>
        )}
      </View>

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Categorias de ingresos</Text>
        {groupedCategories.income.length === 0 ? (
          <Text style={ui.empty}>No hay categorias de ingreso.</Text>
        ) : (
          groupedCategories.income.map((category) => (
            <View key={category.id} style={styles.categoryRow}>
              <Text style={ui.itemTitle}>{category.name}</Text>
              <View style={styles.itemActions}>
                <Pressable style={styles.linkButton} onPress={() => onEdit(category.id)}>
                  <Text style={ui.linkButtonText}>Editar</Text>
                </Pressable>
                <Pressable style={styles.linkButton} onPress={() => onDelete(category.id)}>
                  <Text style={ui.linkButtonDangerText}>Eliminar</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Categorias de gastos</Text>
        {groupedCategories.expense.length === 0 ? (
          <Text style={ui.empty}>No hay categorias de gasto.</Text>
        ) : (
          groupedCategories.expense.map((category) => (
            <View key={category.id} style={styles.categoryRow}>
              <Text style={ui.itemTitle}>{category.name}</Text>
              <View style={styles.itemActions}>
                <Pressable style={styles.linkButton} onPress={() => onEdit(category.id)}>
                  <Text style={ui.linkButtonText}>Editar</Text>
                </Pressable>
                <Pressable style={styles.linkButton} onPress={() => onDelete(category.id)}>
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
    categoryRow: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 12,
      backgroundColor: colors.surfaceMuted,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
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
