import { useState, useEffect } from 'react';
import { InputTabs } from './components/InputTabs';
import { ResultsView } from './components/ResultsView';
import type { AnalysisResponse } from './types';
import { Activity, Beaker } from 'lucide-react';

function App() {
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Load from local storage on mount
    const saved = localStorage.getItem('potioncheck_analysis');
    if (saved) {
      try {
        setAnalysisData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved analysis data", e);
      }
    }
  }, []);

  const handleAnalysisComplete = (data: AnalysisResponse) => {
    setAnalysisData(data);
    localStorage.setItem('potioncheck_analysis', JSON.stringify(data));
    setErrorMsg(null);
  };

  const handleReset = () => {
    setAnalysisData(null);
    localStorage.removeItem('potioncheck_analysis');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-50 to-transparent -z-10"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-200 rounded-full blur-[100px] opacity-30 -z-10"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-200 rounded-full blur-[100px] opacity-30 -z-10"></div>

      <header className="pt-12 pb-8 px-6 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 relative">
          <Beaker className="w-8 h-8 text-teal-600" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full"></div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
          Potion<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500">Check</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto font-medium">
          AI-Powered Ingredient Intelligence System
        </p>
      </header>

      <main className="px-4 pb-20 pt-4">
        {errorMsg && (
          <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 animate-fade-in-up">
            <Activity className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Analysis Failed</p>
              <p>{errorMsg}</p>
            </div>
            <button 
              onClick={() => setErrorMsg(null)}
              className="ml-auto text-rose-400 hover:text-rose-600"
            >
              &times;
            </button>
          </div>
        )}

        {isAnalyzing ? (
          <div className="max-w-md mx-auto mt-12 text-center animate-fade-in-up">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Beaker className="w-8 h-8 text-teal-500 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Analyzing Formula...</h3>
            <p className="text-slate-500">Cross-referencing ingredients with global safety databases using AI.</p>
          </div>
        ) : analysisData ? (
          <ResultsView data={analysisData} onReset={handleReset} />
        ) : (
          <InputTabs 
            onAnalyzing={setIsAnalyzing} 
            onAnalysisComplete={handleAnalysisComplete} 
            onError={setErrorMsg}
          />
        )}
      </main>
    </div>
  );
}

export default App;
