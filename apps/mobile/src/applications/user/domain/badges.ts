export type BadgeKey =
  | "batch_cooker_1"
  | "batch_cooker_2"
  | "batch_cooker_3"
  | "monthly_goal_1"
  | "full_week_1"
  | "full_week_2"
  | "full_week_3"
  | "streak_1"
  | "streak_2"
  | "streak_3"
  | "shopper_1"
  | "shopper_2"
  | "shopper_3";

export interface BadgeDefinition {
  key: BadgeKey;
  group: string;
  level: number;
  name: string;
  levelLabel: string;
  description: string;
  criteriaLabel: string;
  color: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: "batch_cooker_1",
    group: "batch_cooker",
    level: 1,
    name: "Batch Cooker",
    levelLabel: "1er batch cooking",
    description: "Bravo ! Tu viens de réaliser ton premier batch cooking. Bienvenue dans la team Deazl !",
    criteriaLabel: "Réaliser 1 session de batch cooking",
    color: "#C084FC",
  },
  {
    key: "batch_cooker_2",
    group: "batch_cooker",
    level: 2,
    name: "Batch Cooker",
    levelLabel: "5 sessions",
    description: "5 sessions de batch cooking — tu prends vraiment le pli !",
    criteriaLabel: "Réaliser 5 sessions de batch cooking",
    color: "#A855F7",
  },
  {
    key: "batch_cooker_3",
    group: "batch_cooker",
    level: 3,
    name: "Batch Cooker",
    levelLabel: "10 sessions",
    description: "10 sessions ! Tu cuisines maintenant comme un(e) pro.",
    criteriaLabel: "Réaliser 10 sessions de batch cooking",
    color: "#7C3AED",
  },
  {
    key: "monthly_goal_1",
    group: "monthly_goal",
    level: 1,
    name: "Objectif mensuel",
    levelLabel: "Objectif du mois atteint",
    description: "Tu as atteint ton objectif mensuel de batch cooking. Bravo, continue comme ça !",
    criteriaLabel: "Atteindre l'objectif mensuel (4 sessions/mois)",
    color: "#E8571C",
  },
  {
    key: "full_week_1",
    group: "planner",
    level: 1,
    name: "Planificateur",
    levelLabel: "1ère semaine complète",
    description: "Ta semaine est planifiée à 100% — de quoi manger sereinement toute la semaine.",
    criteriaLabel: "Planifier les 21 repas d'une semaine complète",
    color: "#16A34A",
  },
  {
    key: "full_week_2",
    group: "planner",
    level: 2,
    name: "Planificateur",
    levelLabel: "4 semaines complètes",
    description: "4 semaines planifiées à 100% — tu maîtrises l'art de l'organisation !",
    criteriaLabel: "Planifier 4 semaines complètes (21 repas chacune)",
    color: "#15803D",
  },
  {
    key: "full_week_3",
    group: "planner",
    level: 3,
    name: "Planificateur",
    levelLabel: "10 semaines complètes",
    description: "10 semaines planifiées ! Rien ne peut t'arrêter.",
    criteriaLabel: "Planifier 10 semaines complètes (21 repas chacune)",
    color: "#14532D",
  },
  {
    key: "streak_1",
    group: "streak",
    level: 1,
    name: "Régularité",
    levelLabel: "7 jours de suite",
    description: "7 jours consécutifs à marquer tes repas — tu es sur une lancée !",
    criteriaLabel: "Marquer des repas comme faits 7 jours de suite",
    color: "#0EA5E9",
  },
  {
    key: "streak_2",
    group: "streak",
    level: 2,
    name: "Régularité",
    levelLabel: "30 jours de suite",
    description: "30 jours sans interruption — une vraie machine !",
    criteriaLabel: "Marquer des repas comme faits 30 jours de suite",
    color: "#0284C7",
  },
  {
    key: "streak_3",
    group: "streak",
    level: 3,
    name: "Régularité",
    levelLabel: "100 jours de suite",
    description: "100 jours ! Tu as transformé la planification en habitude de vie.",
    criteriaLabel: "Marquer des repas comme faits 100 jours de suite",
    color: "#0C4A6E",
  },
  {
    key: "shopper_1",
    group: "shopper",
    level: 1,
    name: "Acheteur malin",
    levelLabel: "1ère liste complétée",
    description: "Tu as complété ta première liste de courses — les frigos sont pleins !",
    criteriaLabel: "Compléter 1 liste de courses",
    color: "#F59E0B",
  },
  {
    key: "shopper_2",
    group: "shopper",
    level: 2,
    name: "Acheteur malin",
    levelLabel: "5 listes complétées",
    description: "5 listes bouclées — tu as le rythme du marché !",
    criteriaLabel: "Compléter 5 listes de courses",
    color: "#D97706",
  },
  {
    key: "shopper_3",
    group: "shopper",
    level: 3,
    name: "Acheteur malin",
    levelLabel: "20 listes complétées",
    description: "20 listes de courses ! Tu es le roi / la reine des supermarchés.",
    criteriaLabel: "Compléter 20 listes de courses",
    color: "#92400E",
  },
];

export function getBadgeByKey(key: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((b) => b.key === key);
}

export function getBadgesByGroup(group: string): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((b) => b.group === group);
}

export const BADGE_GROUPS = [
  { group: "batch_cooker", name: "Batch Cooker", description: "Récompense les cuisiniers réguliers en batch cooking." },
  { group: "monthly_goal", name: "Objectif mensuel", description: "Récompense l'atteinte de l'objectif mensuel." },
  { group: "planner", name: "Planificateur", description: "Récompense les semaines planifiées à 100%." },
  { group: "streak", name: "Régularité", description: "Récompense les séries de jours consécutifs." },
  { group: "shopper", name: "Acheteur malin", description: "Récompense les listes de courses complétées." },
];
