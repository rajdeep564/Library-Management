/** Coerce API list fields to a safe array (never undefined). */
export function asArray(value) {
  return Array.isArray(value) ? value : [];
}
