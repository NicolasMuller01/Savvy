export interface Investment {
  id: string;
  name: string;
  symbol: string;
  type: 'stock' | 'crypto' | 'etf' | 'bond' | 'vehiculo' | 'propiedad' | 'other';
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  change24h: number;
  changePercent: number;
  logo?: string;
  platform?: string;
  category?: string;
  purchaseDate?: string;
  notes?: string;
  lastUpdated?: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: 'fixed' | 'variable';
  date: string;
  icon: string;
}

export interface Budget {
  id: string;
  month: string;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  expenses: Expense[];
}

export interface UserSettings {
  theme: 'light' | 'dark';
  currency: string;
  language: string;
  notifications: boolean;
}
