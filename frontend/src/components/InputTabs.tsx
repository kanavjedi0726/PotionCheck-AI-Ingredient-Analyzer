import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Camera, ScanBarcode, Type, Loader2, Upload, Video, Leaf } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import type { AnalysisResponse, UserProfile } from '../types';

interface Props {
  onAnalyzing: (isAnalyzing: boolean) => void;
  onAnalysisComplete: (data: AnalysisResponse) => void;
  onError: (msg: string) => void;
  userProfile: UserProfile | null;
}

export const InputTabs = ({ onAnalyzing, onAnalysisComplete, onError, userProfile }: Props) => {
  const [activeTab, setActiveTab] = useState<'barcode' | 'upload' | 'text' | 'produce'>('barcode');
  const [barcode, setBarcode] = useState('');
  const [textInput, setTextInput] = useState('');
  const [produceName, setProduceName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const stopCamera = () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };

    if (activeTab === 'barcode' && isCameraActive && videoRef.current) {
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }
      
      codeReaderRef.current.decodeFromVideoDevice(null, videoRef.current, (result) => {
        if (result) {
          const text = result.getText();
          if (text) {
            setBarcode(text);
            setIsCameraActive(false);
            submitBarcodeData(text);
          }
        }
      });
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab, isCameraActive]);

  const performAnalysis = async (ingredientsText: string, productName?: string) => {
    try {
      const payload: any = { ingredients_text: ingredientsText };
      if (userProfile) {
        payload.user_profile = userProfile;
      }
      const resp = await axios.post('https://hackawarts-project.onrender.com/api/analyze', payload);
      const data = resp.data;
      if (productName) {
        data.productName = productName;
      }
      onAnalysisComplete(data);
    } catch (err: any) {
      onError(err.response?.data?.detail || err.message || "Failed to analyze ingredients.");
    }
  };

  const submitBarcodeData = async (code: string) => {
    if (!code) return;

    setIsLoading(true);
    onAnalyzing(true);
    try {
      const resp = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
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

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitBarcodeData(barcode);
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

  const handleProduceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produceName.trim()) return;

    setIsLoading(true);
    onAnalyzing(true);
    try {
      const payload: any = { produce_name: produceName };
      if (userProfile) {
        payload.user_profile = userProfile;
      }
      const resp = await axios.post('https://hackawarts-project.onrender.com/api/analyze-produce', payload);
      const data = resp.data;
      data.productName = `Fresh Produce: ${produceName}`;
      onAnalysisComplete(data);
    } catch (err: any) {
      onError(err.response?.data?.detail || err.message || 'Error analyzing produce.');
    } finally {
      setIsLoading(false);
      onAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
      <div className="glass-panel p-2 mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('barcode')}
          className={`flex-1 min-w-[120px] py-3 px-2 flex justify-center items-center gap-2 ${activeTab === 'barcode' ? 'tab-active' : 'tab-inactive'}`}
        >
          <ScanBarcode className="w-5 h-5" /> <span className="hidden sm:inline">Scan Barcode</span>
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 min-w-[120px] py-3 px-2 flex justify-center items-center gap-2 ${activeTab === 'upload' ? 'tab-active' : 'tab-inactive'}`}
        >
          <Camera className="w-5 h-5" /> <span className="hidden sm:inline">Upload Label</span>
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 min-w-[120px] py-3 px-2 flex justify-center items-center gap-2 ${activeTab === 'text' ? 'tab-active' : 'tab-inactive'}`}
        >
          <Type className="w-5 h-5" /> <span className="hidden sm:inline">Paste Text</span>
        </button>
        <button
          onClick={() => setActiveTab('produce')}
          className={`flex-1 min-w-[120px] py-3 px-2 flex justify-center items-center gap-2 ${activeTab === 'produce' ? 'tab-active' : 'tab-inactive'}`}
        >
          <Leaf className="w-5 h-5" /> <span className="hidden sm:inline">Fresh Produce</span>
        </button>
      </div>

      <div className="glass-panel p-8 md:p-10 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-40 h-40 bg-teal-400 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-10 pointer-events-none"></div>

        {activeTab === 'barcode' && (
          <div className="space-y-6 relative z-10">
            {!isCameraActive ? (
              <button 
                type="button" 
                onClick={() => setIsCameraActive(true)}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 border-2 border-dashed border-teal-300 rounded-xl text-teal-600 font-medium hover:bg-teal-50 transition-colors"
              >
                <Video className="w-5 h-5" /> Start Live Scanner
              </button>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex-col flex items-center justify-center mb-4 shadow-lg border border-slate-200">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setIsCameraActive(false)}
                  className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-lg text-xs font-semibold backdrop-blur-sm hover:bg-black/70 transition-colors"
                >
                  Stop Camera
                </button>
                <div className="absolute inset-0 pointer-events-none border-[3px] border-teal-500 opacity-50 m-8 rounded-lg" />
              </div>
            )}

            <form onSubmit={handleBarcodeSubmit} className="space-y-4">
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">OR</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Manual Barcode Entry (UPC/EAN)</label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g. 3017620422003"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  required={!isCameraActive}
                />
                <p className="text-xs text-slate-500 mt-2">Powered by Open Food Facts database.</p>
              </div>
              <button type="submit" disabled={isLoading || (!barcode && !isCameraActive)} className="btn-primary w-full shadow-teal-500/20">
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : 'Analyze Barcode'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'upload' && (
          <form onSubmit={handleUploadSubmit} className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Upload Ingredient Label</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50/50 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-slate-400" />
                  <div className="flex text-sm text-slate-600 justify-center gap-4 mt-2">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500">
                      <span>Upload File</span>
                      <input type="file" className="sr-only" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                    </label>
                    <span className="text-slate-400">or</span>
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>Take Photo</span>
                      <input type="file" className="sr-only" accept="image/*" capture="environment" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
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

        {activeTab === 'produce' && (
          <form onSubmit={handleProduceSubmit} className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fresh Fruit or Vegetable Name</label>
              <input
                type="text"
                value={produceName}
                onChange={(e) => setProduceName(e.target.value)}
                placeholder="e.g. Apples, Strawberries, Spinach"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                required
              />
              <p className="text-xs text-slate-500 mt-2">Analyzes typical pesticides, chemical fertilizers, and wax coatings.</p>
            </div>
            <button type="submit" disabled={isLoading || !produceName.trim()} className="btn-primary w-full shadow-teal-500/20">
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : 'Analyze Produce'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
