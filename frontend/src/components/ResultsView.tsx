import type { AnalysisResponse } from '../types';
import { IngredientCard } from './IngredientCard';
import { Sparkles, ArrowLeft } from 'lucide-react';

interface Props {
  data: AnalysisResponse;
  onReset: () => void;
}

export const ResultsView = ({ data, onReset }: Props) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getStrokeColor = (score: number) => {
    if (score >= 80) return 'stroke-emerald-500';
    if (score >= 50) return 'stroke-amber-500';
    return 'stroke-rose-500';
  };

  const strokeDasharray = `${(data.overall_safety_score / 100) * 283} 283`;

  // Sort ingredients: Harmful > Caution > Safe
  const sortedIngredients = [...data.ingredients].sort((a, b) => {
    const order = { harmful: 0, caution: 1, safe: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      <div className="glass-panel p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-emerald-400"></div>
        
        <button 
          onClick={onReset}
          className="absolute top-6 left-6 text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Background Circle */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-100"
              />
              {/* Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                className={`transition-all duration-1000 ease-out ${getStrokeColor(data.overall_safety_score)}`}
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className={`text-5xl font-bold tracking-tight ${getScoreColor(data.overall_safety_score)}`}>
                {data.overall_safety_score}
              </span>
              <span className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-1">/ 100</span>
            </div>
          </div>

          <div className="max-w-xl mx-auto space-y-2 mt-4">
            {data.productName && (
              <div className="mb-6">
                <span className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1 block">Scanned Product</span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">{data.productName}</h1>
              </div>
            )}
            <h2 className="text-2xl font-bold text-slate-900 pt-2 border-t border-slate-100">Safety Analysis</h2>
            <p className="text-slate-600 leading-relaxed">{data.summary}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 px-1 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          Ingredient Breakdown
        </h3>
        <div className="space-y-3">
          {sortedIngredients.map((ing, idx) => (
            <IngredientCard key={`${ing.name}-${idx}`} ingredient={ing} />
          ))}
        </div>
      </div>

      <div className="pt-6 pb-12 flex justify-center">
        <button onClick={onReset} className="btn-secondary w-full sm:w-auto">
          Analyze Another Product
        </button>
      </div>
    </div>
  );
};
