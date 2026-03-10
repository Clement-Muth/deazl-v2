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

const NAMES: Record<string, string> = {
  "e100": "Curcumine", "e101": "Riboflavine", "e102": "Tartrazine",
  "e104": "Jaune de quinoléine", "e110": "Jaune orangé S", "e120": "Cochenille",
  "e122": "Azorubine", "e124": "Ponceau 4R", "e129": "Rouge allura AC",
  "e131": "Bleu patenté V", "e132": "Indigotine", "e133": "Bleu brillant FCF",
  "e140": "Chlorophylles", "e150a": "Caramel ordinaire", "e150b": "Caramel au sulfite caustique",
  "e150c": "Caramel IV", "e150d": "Caramel sulfite-ammoniaque",
  "e160a": "Bêta-carotène", "e160b": "Annatto", "e160c": "Extrait de paprika",
  "e162": "Rouge de betterave", "e163": "Anthocyanes", "e170": "Carbonate de calcium",
  "e171": "Dioxyde de titane",
  "e200": "Acide sorbique", "e202": "Sorbate de potassium", "e203": "Sorbate de calcium",
  "e210": "Acide benzoïque", "e211": "Benzoate de sodium", "e212": "Benzoate de potassium",
  "e213": "Benzoate de calcium",
  "e220": "Dioxyde de soufre", "e221": "Sulfite de sodium", "e222": "Bisulfite de sodium",
  "e223": "Métabisulfite de sodium", "e224": "Métabisulfite de potassium",
  "e226": "Sulfite de calcium", "e227": "Bisulfite de calcium", "e228": "Bisulfite de potassium",
  "e249": "Nitrite de potassium", "e250": "Nitrite de sodium",
  "e251": "Nitrate de sodium", "e252": "Nitrate de potassium",
  "e260": "Acide acétique", "e262": "Acétates de sodium", "e270": "Acide lactique",
  "e300": "Acide ascorbique", "e301": "Ascorbate de sodium", "e306": "Tocophérols",
  "e320": "BHA (butylhydroxyanisole)", "e321": "BHT (butylhydroxytoluène)",
  "e322": "Lécithines", "e330": "Acide citrique", "e331": "Citrates de sodium",
  "e332": "Citrates de potassium", "e333": "Citrates de calcium",
  "e400": "Acide alginique", "e401": "Alginate de sodium", "e404": "Alginate de calcium",
  "e406": "Agar-agar", "e407": "Carraghénane",
  "e410": "Farine de caroube", "e412": "Gomme guar", "e414": "Gomme arabique",
  "e415": "Gomme xanthane", "e420": "Sorbitol", "e421": "Mannitol", "e422": "Glycérol",
  "e440": "Pectines", "e450": "Diphosphates", "e451": "Triphosphates", "e452": "Polyphosphates",
  "e460": "Cellulose", "e461": "Méthylcellulose", "e466": "Carboxyméthylcellulose",
  "e471": "Mono- et diglycérides", "e500": "Carbonates de sodium",
  "e503": "Carbonates d'ammonium", "e509": "Chlorure de calcium",
  "e516": "Sulfate de calcium", "e551": "Dioxyde de silicium", "e553b": "Talc",
  "e621": "Glutamate monosodique", "e622": "Glutamate monopotassique",
  "e623": "Diglutamate de calcium", "e624": "Glutamate monoammonique",
  "e625": "Diglutamate de magnésium",
  "e950": "Acésulfame K", "e951": "Aspartame", "e952": "Cyclamate",
  "e954": "Saccharine", "e955": "Sucralose", "e962": "Sel d'aspartame-acésulfame",
};

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
  const dictName = NAMES[code];
  const parsedName = match[2]
    ? match[2].split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : null;
  return { code, name: dictName ?? parsedName ?? code.toUpperCase() };
}
