import { useState } from 'react';
import type { UserProfile } from '../types';
import { User, Check, Utensils, HeartPulse, ShieldAlert } from 'lucide-react';

interface Props {
  onSave: (profile: UserProfile) => void;
}

const ALLERGIES = ['Nuts', 'Gluten', 'Dairy', 'Soy', 'Eggs'];
const CONDITIONS = ['Diabetes', 'Hypertension', 'Heart Disease', 'Pregnant', 'None'];
const DIETS = ['Vegan', 'Vegetarian', 'Halal', 'Kosher', 'None'];

export const ProfileOnboarding = ({ onSave }: Props) => {
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [diet, setDiet] = useState<string[]>([]);

  const toggleSelection = (item: string, list: string[], setList: (arr: string[]) => void) => {
    if (item === 'None') {
      setList(['None']);
      return;
    }
    
    let newList = [...list];
    if (newList.includes('None')) {
      newList = newList.filter(i => i !== 'None');
    }

    if (newList.includes(item)) {
      newList = newList.filter(i => i !== item);
    } else {
      newList.push(item);
    }
    setList(newList);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ allergies, conditions, diet });
  };

  return (
    <div className="max-w-2xl mx-auto w-full glass-panel p-8 relative overflow-hidden animate-fade-in-up">
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-40 h-40 bg-teal-400 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
      
      <div className="text-center mb-8 relative z-10">
        <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-teal-600" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Personalize Your AI</h2>
        <p className="text-slate-500">Tell us a bit about your health so we can flag ingredients strictly tailored to you.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
        
        {/* Allergies */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
            <ShieldAlert className="w-4 h-4 text-rose-500" /> 
            Allergies
          </label>
          <div className="flex flex-wrap gap-2">
            {ALLERGIES.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => toggleSelection(item, allergies, setAllergies)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                  allergies.includes(item) 
                    ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {allergies.includes(item) && <Check className="w-3 h-3 inline-block mr-1" />}
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Health Conditions */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
            <HeartPulse className="w-4 h-4 text-teal-500" /> 
            Health Conditions
          </label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => toggleSelection(item, conditions, setConditions)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                  conditions.includes(item) 
                    ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {conditions.includes(item) && <Check className="w-3 h-3 inline-block mr-1" />}
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Diet */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
            <Utensils className="w-4 h-4 text-indigo-500" /> 
            Diet Type
          </label>
          <div className="flex flex-wrap gap-2">
            {DIETS.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => toggleSelection(item, diet, setDiet)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                  diet.includes(item) 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {diet.includes(item) && <Check className="w-3 h-3 inline-block mr-1" />}
                {item}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary w-full shadow-teal-500/20 text-lg py-4">
          Save Profile & Continue
        </button>
      </form>
    </div>
  );
};
