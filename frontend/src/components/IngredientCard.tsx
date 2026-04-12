import { useState } from 'react';
import type { Ingredient } from '../types';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle, ShieldX, UserX } from 'lucide-react';

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
  const isConflict = ingredient.user_conflict === true;

  return (
    <div className={`rounded-xl border-2 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md
      ${ isConflict 
        ? 'border-red-500 bg-red-50 ring-2 ring-red-300 ring-offset-1 animate-pulse-border' 
        : `${config.border} ${config.bg}`
      }`
    }>
      {isConflict && (
        <div className="bg-red-500 px-5 py-2 flex items-center gap-2">
          <UserX className="w-4 h-4 text-white flex-shrink-0" />
          <span className="text-white text-xs font-bold uppercase tracking-widest">⚠ Not recommended for you</span>
        </div>
      )}
      <div 
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-black/[0.02]"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl ${isConflict ? 'bg-red-100' : config.badgeBg} shadow-sm`}>
            {isConflict ? <UserX className="w-5 h-5 text-red-500" /> : config.icon}
          </div>
          <div>
            <h3 className={`text-lg font-bold capitalize tracking-tight mb-0.5 ${isConflict ? 'text-red-900' : 'text-slate-900'}`}>{ingredient.name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${config.badgeBg} ${config.text} uppercase tracking-widest inline-block`}>
                {config.label}
              </span>
              {isConflict && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600 uppercase tracking-widest inline-block">
                  Profile Conflict
                </span>
              )}
            </div>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-full hover:bg-slate-200/60">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      <div className={`px-5 pb-5 grid gap-4 transition-all duration-300 ${expanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 pb-0 m-0'}`}>
        <div className="overflow-hidden space-y-4">
          {ingredient.reason && (
             <div className="bg-white/60 p-4 rounded-xl border border-slate-200/50 shadow-sm">
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Detailed Analysis</p>
               <p className="text-sm text-slate-700 leading-relaxed">{ingredient.reason}</p>
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
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 shadow-sm mt-2">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1.5">Healthier Alternative</p>
              <p className="text-sm text-emerald-800 font-medium">{ingredient.alternative}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
