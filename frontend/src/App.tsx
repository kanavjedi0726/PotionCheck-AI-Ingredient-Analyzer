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
    <div className="min-h-screen relative overflow-hidden bg-slate-50 flex flex-col">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50 -z-10 bg-[length:200%_200%] animate-gradient-slow overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-50">
           <div className="absolute -top-40 right-20 w-[600px] h-[600px] bg-emerald-200 rounded-full blur-[100px] opacity-40 animate-blob"></div>
           <div className="absolute top-20 -left-20 w-[500px] h-[500px] bg-teal-200 rounded-full blur-[100px] opacity-40 animate-blob animation-delay-2000" style={{ animationDelay: '2s' }}></div>
           <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-cyan-200 rounded-full blur-[100px] opacity-40 animate-blob animation-delay-4000" style={{ animationDelay: '4s' }}></div>
        </div>
      </div>

      <header className="pt-20 pb-16 px-6 text-center relative z-10">
        <div className="inline-flex items-center justify-center p-4 bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white mb-8 relative">
          <Beaker className="w-10 h-10 text-teal-600" />
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping"></div>
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></div>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-5 drop-shadow-sm">
          Potion<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500">Check</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto font-medium tracking-wide">
          Advanced AI-Powered Ingredient Intelligence System
        </p>
      </header>

      <main className="px-4 pb-20 pt-4 flex-grow relative z-10">
        {errorMsg && (
          <div className="max-w-2xl mx-auto mb-8 p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3 animate-fade-in-up">
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

      <footer className="mt-auto py-8 text-center text-sm font-medium text-slate-500 border-t border-slate-200/60 bg-white/50 backdrop-blur-md relative z-10">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-600">
            Powered by <span className="font-bold text-slate-800">Groq AI</span>, 
            <span className="font-bold text-slate-800"> Open Food Facts</span>, and 
            <span className="font-bold text-slate-800"> FSSAI Data</span>
          </p>
          <p className="text-xs text-slate-400 font-normal">© {new Date().getFullYear()} PotionCheck. For informational purposes only.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
