import { useState } from 'react';
import axios from 'axios';
import { Camera, ScanBarcode, Type, Loader2, Upload } from 'lucide-react';
import type { AnalysisResponse } from '../types';

interface Props {
  onAnalyzing: (isAnalyzing: boolean) => void;
  onAnalysisComplete: (data: AnalysisResponse) => void;
  onError: (msg: string) => void;
}

export const InputTabs = ({ onAnalyzing, onAnalysisComplete, onError }: Props) => {
  const [activeTab, setActiveTab] = useState<'barcode' | 'upload' | 'text'>('barcode');
  const [barcode, setBarcode] = useState('');
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const performAnalysis = async (ingredientsText: string, productName?: string) => {
    try {
      const resp = await axios.post('https://hackawarts-project.onrender.com/api/analyze', {
        ingredients_text: ingredientsText
      });
      const data = resp.data;
      if (productName) {
        data.productName = productName;
      }
      onAnalysisComplete(data);
    } catch (err: any) {
      onError(err.response?.data?.detail || err.message || "Failed to analyze ingredients.");
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;

    setIsLoading(true);
    onAnalyzing(true);
    try {
      const resp = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      if (resp.data.status !== 1) {
        throw new Error('Product not found or has no ingredient data.');
      }
      
      const ingredientsText = resp.data.product.ingredients_text;
      const productName = resp.data.product.product_name;
      if (!ingredientsText) {
        throw new Error('Ingredient list not available for this product.');
      }
      
      await performAnalysis(ingredientsText, productName);
    } catch (err: any) {
      onError(err.message || 'Error fetching product from OpenFoodFacts.');
    } finally {
      setIsLoading(false);
      onAnalyzing(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsLoading(true);
    onAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const resp = await axios.post('https://hackawarts-project.onrender.com/api/extract-text', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const extractedText = resp.data.extracted_text;
      if (!extractedText) {
        throw new Error('No text could be extracted from the image.');
      }

      await performAnalysis(extractedText);
    } catch (err: any) {
      onError(err.response?.data?.detail || err.message || 'Error extracting text from image.');
    } finally {
      setIsLoading(false);
      onAnalyzing(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    setIsLoading(true);
    onAnalyzing(true);
    await performAnalysis(textInput);
    setIsLoading(false);
    onAnalyzing(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
      <div className="glass-panel p-2 mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('barcode')}
          className={`flex-1 py-3 px-4 flex justify-center items-center gap-2 ${activeTab === 'barcode' ? 'tab-active' : 'tab-inactive'}`}
        >
          <ScanBarcode className="w-5 h-5" /> <span className="hidden sm:inline">Scan Barcode</span>
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-3 px-4 flex justify-center items-center gap-2 ${activeTab === 'upload' ? 'tab-active' : 'tab-inactive'}`}
        >
          <Camera className="w-5 h-5" /> <span className="hidden sm:inline">Upload Label</span>
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-3 px-4 flex justify-center items-center gap-2 ${activeTab === 'text' ? 'tab-active' : 'tab-inactive'}`}
        >
          <Type className="w-5 h-5" /> <span className="hidden sm:inline">Paste Text</span>
        </button>
      </div>

      <div className="glass-panel p-8 md:p-10 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-40 h-40 bg-teal-400 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-10 pointer-events-none"></div>

        {activeTab === 'barcode' && (
          <form onSubmit={handleBarcodeSubmit} className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Product Barcode (UPC/EAN)</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g. 3017620422003"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                required
              />
              <p className="text-xs text-slate-500 mt-2">Powered by Open Food Facts database.</p>
            </div>
            <button type="submit" disabled={isLoading || !barcode} className="btn-primary w-full shadow-teal-500/20">
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : 'Analyze Barcode'}
            </button>
          </form>
        )}

        {activeTab === 'upload' && (
          <form onSubmit={handleUploadSubmit} className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Upload Ingredient Label</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50/50 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-slate-400" />
                  <div className="flex text-sm text-slate-600 justify-center">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500">
                      <span>Upload a file</span>
                      <input type="file" className="sr-only" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} required />
                    </label>
                  </div>
                  <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                  {selectedFile && <p className="text-sm font-medium text-emerald-600 mt-2">{selectedFile.name}</p>}
                </div>
              </div>
            </div>
            <button type="submit" disabled={isLoading || !selectedFile} className="btn-primary w-full shadow-teal-500/20">
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Extracting & Analyzing...</> : 'Analyze Photo'}
            </button>
          </form>
        )}

        {activeTab === 'text' && (
          <form onSubmit={handleTextSubmit} className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Raw Ingredient List</label>
              <textarea
                rows={5}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste ingredients separated by commas..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                required
              />
            </div>
            <button type="submit" disabled={isLoading || !textInput.trim()} className="btn-primary w-full shadow-teal-500/20">
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : 'Analyze Ingredients'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
