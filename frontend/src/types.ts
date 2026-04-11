export interface Ingredient {
  name: string;
  status: 'safe' | 'caution' | 'harmful';
  reason: string;
  banned_in: string[];
  alternative: string;
}

export interface AnalysisResponse {
  ingredients: Ingredient[];
  overall_safety_score: number;
  summary: string;
  productName?: string;
}
