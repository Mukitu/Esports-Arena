export function toBanglaNumeral(num: number | string): string {
  const banglaDigits: Record<string, string> = {
    '0': '০',
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯',
  };

  const str = num.toString();
  return str.replace(/[0-9]/g, (digit) => banglaDigits[digit] || digit);
}

export function formatCurrencyBn(amount: number): string {
  const formatted = amount.toLocaleString('bn-BD');
  return `৳${formatted}`;
}
