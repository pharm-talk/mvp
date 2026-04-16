export type HealthGoal =
  | "fatigue"
  | "skin"
  | "immunity"
  | "bone"
  | "sleep"
  | "digestion"
  | "eye"
  | "other";

export type SupplementTurn = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface IntakeState {
  turn: SupplementTurn;
  healthGoals: string[];
  medicationDrawerConfirmed: boolean;
  medicationDrawerChanges?: string;
  goalAnswers: Record<string, string[]>;
  dosagePreference: string;
}

export interface ProductCard {
  ingredient: string;
  reason: string;
  domesticBrands: string[];
  importedBrands: string[];
  dosageTip?: string;
  caution?: string;
}
