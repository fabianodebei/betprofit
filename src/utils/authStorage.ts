const STORAGE_KEYS = {
  REMEMBER_EMAIL: 'centurion_remember_email',
  LAST_EMAIL: 'centurion_last_email',
} as const;

export const authStorage = {
  // Salva email se "Ricordami" è selezionato
  saveEmail: (email: string, remember: boolean) => {
    if (remember) {
      localStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, email);
    } else {
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_EMAIL);
    }
    localStorage.setItem(STORAGE_KEYS.LAST_EMAIL, email);
  },

  // Recupera email salvata
  getSavedEmail: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL);
  },

  // Recupera ultima email usata (anche se "Ricordami" non è selezionato)
  getLastEmail: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.LAST_EMAIL);
  },

  // Pulisce dati salvati
  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.LAST_EMAIL);
  },
};
