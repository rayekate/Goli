export interface TradeTier {
  
  profitPercent: number;
  label: string;
  minAmount: number;
}

export function getTradeTier(amount: number): TradeTier {
  if (amount > 200000) {
    return { minAmount: 200001,  profitPercent: 80, label: 'Apex' };
  }
  if (amount > 100000) {
    return { minAmount: 100001, profitPercent: 70, label: 'Grandmaster' };
  }
  if (amount > 50000) {
    return { minAmount: 50001, profitPercent: 60, label: 'Professional' };
  }
  if (amount > 20000) {
    return { minAmount: 20001,  profitPercent: 50, label: 'Advanced' };
  }
  if (amount > 5000) {
    return { minAmount: 5001, profitPercent: 40, label: 'Intermediate' };
  }
  return { minAmount: 1, profitPercent: 30, label: 'Starter' };
}
