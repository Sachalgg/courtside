export type AuthMode = 'signin' | 'signup';
export type AuthErrors = Partial<Record<'name' | 'email' | 'password' | 'form', string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Form checks for the local demo account. `exists` says whether the email already has an account on this device. */
export function validateAuth(
  mode: AuthMode,
  v: { name: string; email: string; password: string },
  exists: boolean,
): AuthErrors {
  const e: AuthErrors = {};
  if (mode === 'signup' && v.name.trim().length < 2) e.name = 'Indiquez votre prénom et votre nom.';
  if (!EMAIL.test(v.email.trim())) e.email = 'Adresse e-mail invalide.';
  if (v.password.length < 6) e.password = 'Six caractères minimum.';
  if (!e.email && mode === 'signin' && !exists) e.form = 'Aucun compte avec cet e-mail sur ce téléphone. Créez-en un.';
  if (!e.email && mode === 'signup' && exists) e.form = 'Un compte existe déjà avec cet e-mail. Connectez-vous.';
  return e;
}
