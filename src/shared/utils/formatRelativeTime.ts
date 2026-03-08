export function formatRelativeTime(dateString: string | null): string | null {
  if (!dateString) return null;
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return "hier";
  if (diffDays < 7) return `il y a ${diffDays}j`;
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)}sem`;
  if (diffDays < 365) return `il y a ${Math.floor(diffDays / 30)} mois`;
  const years = Math.floor(diffDays / 365);
  return `il y a ${years} an${years > 1 ? "s" : ""}`;
}
