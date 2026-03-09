const RULES: { category: string; keywords: string[] }[] = [
  {
    category: "Fruits & Légumes",
    keywords: [
      "pomme", "poire", "banane", "orange", "citron", "citron vert", "fraise", "framboise",
      "raisin", "peche", "abricot", "cerise", "mangue", "ananas", "melon", "pasteque", "kiwi",
      "tomate", "carotte", "oignon", "ail", "echalote", "poireau", "courgette", "aubergine",
      "poivron", "brocoli", "brocolis", "chou", "epinard", "salade", "laitue", "concombre",
      "avocat", "champignon", "betterave", "navet", "radis", "fenouil", "asperge", "artichaut",
      "haricot vert", "petit pois", "mais", "pomme de terre", "patate douce", "patate",
      "chou-fleur", "choufleur", "celeri", "persil", "coriandre", "menthe", "basilic frais",
      "gingembre", "curcuma frais", "fruit", "legume",
    ],
  },
  {
    category: "Viandes & Poissons",
    keywords: [
      "poulet", "boeuf", "veau", "porc", "agneau", "dinde", "canard", "lapin",
      "saumon", "thon", "cabillaud", "truite", "sardine", "maquereau", "merlan", "dorade",
      "crevette", "moule", "huitre", "calamar", "poulpe", "langouste", "homard",
      "jambon", "bacon", "lardons", "steak", "escalope", "filet", "cote", "cotes",
      "merguez", "saucisse", "saucisson", "chorizo", "salami", "rillettes", "pate de campagne",
      "andouillette", "boudin", "foie", "viande hachee", "viande", "poisson", "fruits de mer",
    ],
  },
  {
    category: "Produits laitiers",
    keywords: [
      "lait", "beurre", "creme", "creme fraiche", "yaourt", "yogourt",
      "fromage", "gruyere", "emmental", "camembert", "brie", "chevre",
      "mozzarella", "parmesan", "ricotta", "mascarpone", "feta", "roquefort",
      "comte", "reblochon", "munster", "coulommiers", "fromage blanc", "petit-suisse",
      "oeuf", "oeufs", "oeuf",
    ],
  },
  {
    category: "Boulangerie",
    keywords: [
      "pain", "baguette", "croissant", "brioche", "pain de mie", "pain complet",
      "pain aux cereales", "viennoiserie", "chausson", "pain au chocolat",
      "muffin", "bagel", "toast", "pain grille", "rusk", "crackers",
    ],
  },
  {
    category: "Épicerie sèche",
    keywords: [
      "pates", "riz", "semoule", "farine", "sucre", "sel", "poivre",
      "huile", "huile d olive", "huile de tournesol", "vinaigre", "moutarde",
      "ketchup", "mayonnaise", "sauce soja", "sauce tomate", "coulis", "concentre de tomate",
      "conserve", "boite de", "biscuit", "gateau", "cereale", "muesli", "avoine",
      "quinoa", "lentille", "pois chiche", "haricot sec", "flageolet",
      "noix", "amande", "noisette", "cacahuete", "pistache", "noix de cajou",
      "raisin sec", "abricot sec", "figue seche", "datte",
      "epice", "herbe", "thym", "romarin", "cannelle", "curry", "cumin", "paprika",
      "curcuma", "coriandre", "origan", "laurier", "muscade", "cardamome",
      "confiture", "miel", "sirop", "nutella", "pate a tartiner",
      "chocolat", "cacao", "vanille", "levure", "bicarbonate",
      "bouillon", "cube", "soupe", "veloute",
    ],
  },
  {
    category: "Surgelés",
    keywords: [
      "surgele", "congele", "glace", "sorbet", "frites surgeles", "pizza surgelee",
    ],
  },
  {
    category: "Boissons",
    keywords: [
      "eau", "eau minerale", "eau petillante", "jus", "nectar",
      "soda", "limonade", "coca", "pepsi", "fanta", "schweppes",
      "biere", "vin", "cidre", "champagne", "prosecco", "rosé", "rose",
      "whisky", "rhum", "vodka", "gin", "tequila", "liqueur",
      "cafe", "the", "infusion", "tisane", "chocolat chaud",
      "smoothie", "boisson",
    ],
  },
  {
    category: "Hygiène & Beauté",
    keywords: [
      "shampoing", "apres-shampoing", "savon", "gel douche", "dentifrice",
      "brosse a dents", "deodorant", "rasoir", "mousse a raser", "creme hydratante",
      "lotion", "parfum", "coton", "maquillage", "fond de teint", "mascara",
      "rouge a levres", "coupe-ongles", "lime", "coton-tige", "serviette hygienique",
      "tampon", "protege-slip",
    ],
  },
  {
    category: "Entretien",
    keywords: [
      "lessive", "adoucissant", "liquide vaisselle", "nettoyant",
      "desinfectant", "eau de javel", "deboucheur", "anti-calcaire",
      "eponge", "torchon", "essuie-tout", "sopalin",
      "papier toilette", "sac poubelle", "sac congelation", "film plastique",
      "papier aluminium", "papier cuisson", "allumettes", "briquet",
    ],
  },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, " ")
    .trim();
}

export function categorizeItem(name: string): string {
  const n = normalize(name);
  for (const { category, keywords } of RULES) {
    for (const kw of keywords) {
      if (n.includes(normalize(kw))) return category;
    }
  }
  return "Autre";
}
