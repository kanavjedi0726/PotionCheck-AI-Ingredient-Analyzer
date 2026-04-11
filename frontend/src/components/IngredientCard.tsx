import { useState } from 'react';
import type { Ingredient } from '../types';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle, ShieldX } from 'lucide-react';

interface Props {
  ingredient: Ingredient;
}

export const IngredientCard = ({ ingredient }: Props) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'safe':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          label: 'Safe',
          badgeBg: 'bg-emerald-100'
        };
      case 'caution':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          label: 'Caution',
          badgeBg: 'bg-amber-100'
        };
      case 'harmful':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          text: 'text-rose-700',
          icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
          label: 'Harmful',
          badgeBg: 'bg-rose-100'
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          text: 'text-slate-700',
          icon: <CheckCircle2 className="w-5 h-5 text-slate-500" />,
          label: 'Unknown',
          badgeBg: 'bg-slate-100'
        };
    }
  };

  const config = getStatusConfig(ingredient.status);

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} transition-all duration-300 overflow-hidden`}>
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-black/5"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {config.icon}
          <div>
            <h3 className="font-semibold text-slate-900 capitalize">{ingredient.name}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.badgeBg} ${config.text} uppercase tracking-wider`}>
              {config.label}
            </span>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200/50">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      <div className={`px-4 pb-4 grid gap-3 transition-all duration-300 ${expanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 pb-0 m-0'}`}>
        <div className="overflow-hidden space-y-3">
          {ingredient.reason && (
             <div>
               <p className="text-sm font-medium text-slate-700 mb-1">Analysis</p>
               <p className="text-sm text-slate-600 leading-relaxed">{ingredient.reason}</p>
             </div>
          )}
          
          {ingredient.banned_in && ingredient.banned_in.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <ShieldX className="w-4 h-4 text-rose-500" /> Banned or Restricted In
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {ingredient.banned_in.map(country => (
                  <span key={country} className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-md shadow-sm">
                    {country}
                  </span>
                ))}
              </div>
            </div>
          )}

          {ingredient.alternative && (
            <div className="bg-white/60 p-3 rounded-lg border border-slate-200/60 mt-2">
              <p className="text-sm font-medium text-emerald-700 mb-1">Healthier Alternative</p>
              <p className="text-sm text-slate-700">{ingredient.alternative}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
