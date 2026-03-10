import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { type CategoryType, useFinance } from '@/contexts/finance-context';

const CATEGORY_TYPES: CategoryType[] = ['income', 'expense'];

export default function CategoriesScreen() {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();

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
      Alert.alert('Error', result.error ?? 'No se pudo guardar la categoría.');
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
      Alert.alert('Error', result.error ?? 'No se pudo eliminar la categoría.');
      return;
    }

    if (editingId === categoryId) {
      clearForm();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Categorías</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{editingId ? 'Editar categoría' : 'Nueva categoría'}</Text>
        <TextInput
          placeholder="Nombre"
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholderTextColor="#94a3b8"
        />
        <View style={styles.chips}>
          {CATEGORY_TYPES.map((item) => (
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
            <Text style={styles.primaryButtonText}>
              {editingId ? 'Guardar cambios' : 'Agregar categoría'}
            </Text>
          </Pressable>
          {editingId ? (
            <Pressable style={styles.secondaryButton} onPress={clearForm}>
              <Text style={styles.secondaryButtonText}>Cancelar edición</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categorías de ingresos</Text>
        {groupedCategories.income.length === 0 ? (
          <Text style={styles.empty}>No hay categorías de ingreso.</Text>
        ) : (
          groupedCategories.income.map((category) => (
            <View key={category.id} style={styles.listItem}>
              <Text style={styles.itemTitle}>{category.name}</Text>
              <View style={styles.itemActions}>
                <Pressable style={styles.linkButton} onPress={() => onEdit(category.id)}>
                  <Text style={styles.linkButtonText}>Editar</Text>
                </Pressable>
                <Pressable style={styles.linkButtonDanger} onPress={() => onDelete(category.id)}>
                  <Text style={styles.linkButtonDangerText}>Eliminar</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categorías de gastos</Text>
        {groupedCategories.expense.length === 0 ? (
          <Text style={styles.empty}>No hay categorías de gasto.</Text>
        ) : (
          groupedCategories.expense.map((category) => (
            <View key={category.id} style={styles.listItem}>
              <Text style={styles.itemTitle}>{category.name}</Text>
              <View style={styles.itemActions}>
                <Pressable style={styles.linkButton} onPress={() => onEdit(category.id)}>
                  <Text style={styles.linkButtonText}>Editar</Text>
                </Pressable>
                <Pressable style={styles.linkButtonDanger} onPress={() => onDelete(category.id)}>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    color: '#0f172a',
    fontWeight: '700',
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
