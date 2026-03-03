export type AdditiveRisk = "high" | "moderate" | "low";

const HIGH_RISK = new Set([
  "e102", "e104", "e110", "e122", "e124", "e129",
  "e211",
  "e220", "e221", "e222", "e223", "e224", "e226", "e227", "e228",
  "e249", "e250", "e251", "e252",
  "e320", "e321",
  "e621", "e622", "e623", "e624", "e625",
  "e951", "e952", "e954",
]);

const MODERATE_RISK = new Set([
  "e120",
  "e131", "e132", "e133",
  "e150c", "e150d",
  "e171",
  "e210", "e212", "e213",
  "e407",
  "e450", "e451", "e452",
  "e950", "e955", "e962",
]);

export function getAdditiveRisk(code: string): AdditiveRisk {
  const c = code.toLowerCase();
  if (HIGH_RISK.has(c)) return "high";
  if (MODERATE_RISK.has(c)) return "moderate";
  return "low";
}

export function parseAdditiveTag(tag: string): { code: string; name: string } | null {
  const match = tag.match(/^[a-z]{2}:(e\d+[a-z]?)-?(.*)$/i);
  if (!match) return null;
  const code = match[1].toLowerCase();
  const name = match[2]
    ? match[2].split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : match[1].toUpperCase();
  return { code, name: name || match[1].toUpperCase() };
}
