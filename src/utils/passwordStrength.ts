export type PasswordStrength = {
  score: number; // 0-4
  label: string;
  color: string;
  percentage: number;
};

export const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  
  if (!password) {
    return { score: 0, label: "Nessuna", color: "hsl(var(--destructive))", percentage: 0 };
  }

  // Lunghezza
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Complessità
  if (/[a-z]/.test(password)) score++; // Minuscole
  if (/[A-Z]/.test(password)) score++; // Maiuscole
  if (/[0-9]/.test(password)) score++; // Numeri
  if (/[^a-zA-Z0-9]/.test(password)) score++; // Caratteri speciali

  // Normalizza score a 0-4
  const normalizedScore = Math.min(Math.floor(score / 1.5), 4);

  const strengthMap: Record<number, { label: string; color: string }> = {
    0: { label: "Molto debole", color: "hsl(var(--destructive))" },
    1: { label: "Debole", color: "hsl(0 84% 60%)" },
    2: { label: "Media", color: "hsl(38 92% 50%)" },
    3: { label: "Forte", color: "hsl(142 76% 36%)" },
    4: { label: "Molto forte", color: "hsl(142 76% 36%)" },
  };

  return {
    score: normalizedScore,
    label: strengthMap[normalizedScore].label,
    color: strengthMap[normalizedScore].color,
    percentage: (normalizedScore / 4) * 100,
  };
};
