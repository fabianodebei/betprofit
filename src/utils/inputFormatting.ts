/**
 * Formatta automaticamente l'input di una quota inserendo la virgola dopo la prima cifra
 * Es: "125" -> "1,25", "1234" -> "1,234"
 */
export const formatOddsInput = (value: string): string => {
  // Rimuovi tutti i caratteri non numerici
  const digitsOnly = value.replace(/[^\d]/g, '');
  
  if (digitsOnly.length === 0) return '';
  if (digitsOnly.length === 1) return digitsOnly;
  
  // Inserisci la virgola dopo la prima cifra
  return digitsOnly[0] + ',' + digitsOnly.slice(1);
};

/**
 * Converte una stringa formattata (con virgola) in numero
 * Es: "1,25" -> 1.25
 */
export const parseOddsInput = (value: string): number => {
  const cleaned = value.replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Handler per selezionare automaticamente il contenuto dell'input al click
 */
export const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
  e.currentTarget.select();
};
