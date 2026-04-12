export interface UserProfile {
  allergies: string[];
  conditions: string[];
  diet: string[];
}

export interface ProductAlternative {
  name: string;
  brand: string;
  why_better: string;
  where_to_find: string;
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
  product_alternative?: ProductAlternative;
  consumption_frequency?: string;
  productName?: string;
}

