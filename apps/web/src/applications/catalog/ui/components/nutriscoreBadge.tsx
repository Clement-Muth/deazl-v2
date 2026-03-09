const GRADES: Record<string, { bg: string }> = {
  a: { bg: "bg-green-500" },
  b: { bg: "bg-lime-500" },
  c: { bg: "bg-yellow-400" },
  d: { bg: "bg-orange-500" },
  e: { bg: "bg-red-500" },
};

interface NutriScoreBadgeProps {
  grade: string;
  size?: "sm" | "md";
}

export function NutriScoreBadge({ grade, size = "sm" }: NutriScoreBadgeProps) {
  const config = GRADES[grade.toLowerCase()];
  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center justify-center rounded font-black text-white ${config.bg} ${
        size === "md" ? "h-6 w-6 text-xs" : "h-5 w-5 text-[10px]"
      }`}
    >
      {grade.toUpperCase()}
    </span>
  );
}
