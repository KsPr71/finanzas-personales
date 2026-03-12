import { type AccountType } from '@/contexts/finance-context';

type AccountTypeMeta = {
  label: string;
  icon: 'bank-outline' | 'cash' | 'credit-card-outline';
};

export const ACCOUNT_TYPE_META: Record<AccountType, AccountTypeMeta> = {
  bank: {
    label: 'Banco',
    icon: 'bank-outline',
  },
  cash: {
    label: 'Efectivo',
    icon: 'cash',
  },
  credit: {
    label: 'Credito',
    icon: 'credit-card-outline',
  },
};
