export interface UserProfile {
  allergies: string[];
  conditions: string[];
  diet: string[];
}

export interface Ingredient {
  name: string;
  status: 'safe' | 'caution' | 'harmful';
  reason: string;
  banned_in: string[];
  alternative: string;
  user_conflict?: boolean;
}

export interface AnalysisResponse {
  ingredients: Ingredient[];
  overall_safety_score: number;
  summary: string;
  personalized_verdict?: string;
  productName?: string;
}
