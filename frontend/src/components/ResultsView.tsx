import type { AnalysisResponse } from '../types';
import { IngredientCard } from './IngredientCard';
import { Sparkles, ArrowLeft, ShieldCheck, ShieldAlert, Clock, Leaf, MapPin, ArrowRight } from 'lucide-react';

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




  // Sort ingredients: Harmful > Caution > Safe, conflicts first
  const sortedIngredients = [...data.ingredients].sort((a, b) => {
    if (a.user_conflict && !b.user_conflict) return -1;
    if (!a.user_conflict && b.user_conflict) return 1;
    const order = { harmful: 0, caution: 1, safe: 2 };
    return order[a.status] - order[b.status];
  });

  // Count profile conflicts
  const conflictCount = data.ingredients.filter(i => i.user_conflict).length;

  const getFrequencyColor = (freq?: string) => {
    if (!freq) return 'bg-slate-100 text-slate-600 border-slate-200';
    const lower = freq.toLowerCase();
    if (lower.includes('avoid') || lower.includes('never')) return 'bg-red-50 text-red-700 border-red-200';
    if (lower.includes('daily')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      {/* Personalized Verdict Banner */}
      {data.personalized_verdict && (
        <div className={`rounded-2xl p-6 flex items-start gap-4 shadow-lg border-2 ${
          conflictCount > 0
            ? 'bg-red-600 border-red-700 text-white'
            : 'bg-emerald-600 border-emerald-700 text-white'
        }`}>
          <div className="flex-shrink-0 mt-0.5">
            {conflictCount > 0
              ? <ShieldAlert className="w-8 h-8 text-white" />
              : <ShieldCheck className="w-8 h-8 text-white" />
            }
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">
              Personal Health Verdict
            </p>
            <p className="text-xl md:text-2xl font-extrabold leading-snug">
              {data.personalized_verdict}
            </p>
            {conflictCount > 0 && (
              <p className="mt-2 text-sm font-semibold text-red-100">
                {conflictCount} ingredient{conflictCount > 1 ? 's' : ''} conflict{conflictCount === 1 ? 's' : ''} with your health profile — see highlights below.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Consumption Frequency + Safety Score row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Safety Score Card */}
        <div className="glass-panel p-6 flex items-center gap-5">
          <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="10"
                strokeDasharray={`${(data.overall_safety_score / 100) * 264} 264`}
                strokeLinecap="round"
                className={`transition-all duration-1000 ease-out ${getStrokeColor(data.overall_safety_score)}`}
              />
            </svg>
            <span className={`text-xl font-black ${getScoreColor(data.overall_safety_score)}`}>
              {data.overall_safety_score}
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Safety Score</p>
            <p className="text-2xl font-black text-slate-800">{data.overall_safety_score}<span className="text-sm text-slate-400 font-medium">/100</span></p>
            {data.productName && <p className="text-sm text-slate-500 mt-1 truncate max-w-[180px]">{data.productName}</p>}
          </div>
        </div>

        {/* Consumption Frequency Card */}
        {data.consumption_frequency && (
          <div className={`rounded-2xl border-2 p-6 flex items-start gap-4 ${getFrequencyColor(data.consumption_frequency)}`}>
            <div className="flex-shrink-0 mt-0.5">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-70">Safe Consumption Guide</p>
              <p className="text-lg font-extrabold leading-tight">{data.consumption_frequency}</p>
              <p className="text-xs mt-1 opacity-60 font-medium">Based on your health profile</p>
            </div>
          </div>
        )}
      </div>

      {/* Safer Alternative Product Card */}
      {data.product_alternative && (
        <div className="glass-panel p-6 border-2 border-teal-200 bg-gradient-to-br from-teal-50/60 to-emerald-50/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400 rounded-full blur-3xl opacity-10 pointer-events-none" />
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center shadow-sm">
              <Leaf className="w-6 h-6 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">
                🌿 Safer Alternative For You
              </p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <h3 className="text-xl font-extrabold text-slate-900">{data.product_alternative.name}</h3>
                {data.product_alternative.brand && data.product_alternative.brand !== data.product_alternative.name && (
                  <span className="text-sm font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                    by {data.product_alternative.brand}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{data.product_alternative.why_better}</p>
              {data.product_alternative.where_to_find && (
                <p className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-3">
                  <MapPin className="w-3.5 h-3.5 text-teal-500" />
                  {data.product_alternative.where_to_find}
                </p>
              )}
            </div>
            <ArrowRight className="w-5 h-5 text-teal-400 flex-shrink-0 mt-1 hidden sm:block" />
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-emerald-400" />
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-700 transition-colors text-sm font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Scan Another Product
        </button>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Regulatory Summary</h2>
        <p className="text-slate-600 leading-relaxed">{data.summary}</p>
      </div>

      {/* Ingredient Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 px-1 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          Ingredient Breakdown
          {conflictCount > 0 && (
            <span className="ml-auto text-xs font-bold bg-red-100 text-red-600 px-2.5 py-1 rounded-full">
              {conflictCount} Profile Conflict{conflictCount > 1 ? 's' : ''}
            </span>
          )}
        </h3>
        <div className="space-y-3">
          {sortedIngredients.map((ing, idx) => (
            <IngredientCard key={`${ing.name}-${idx}`} ingredient={ing} />
          ))}
        </div>
      </div>

      <div className="pt-4 pb-12 flex justify-center">
        <button onClick={onReset} className="btn-secondary w-full sm:w-auto">
          Analyze Another Product
        </button>
      </div>
    </div>
  );
};




