export function validateEmail(email: string): string | null {
  if (!email.trim()) return "L'email est requis";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email invalide";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Le mot de passe est requis";
  if (password.length < 8) return "Minimum 8 caractères";
  return null;
}

export function mapAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) return "Email ou mot de passe incorrect";
  if (message.includes("Email not confirmed")) return "Confirme ton email avant de te connecter";
  if (message.includes("User already registered")) return "Un compte existe déjà avec cet email";
  if (message.includes("Password should be at least")) return "Mot de passe trop court";
  if (message.includes("Unable to validate email address")) return "Adresse email invalide";
  if (
    message.includes("Email rate limit exceeded") ||
    message.includes("For security purposes") ||
    message.includes("over_email_send_rate_limit")
  )
    return "Trop de tentatives, réessaie dans quelques minutes";
  return message;
}
