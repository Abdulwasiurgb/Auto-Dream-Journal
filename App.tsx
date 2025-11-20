import React, { useState, useEffect } from 'react';
import { Chat } from '@google/genai';
import { AppState, ImageSize, DreamAnalysis } from './types';
import { blobToBase64 } from './utils';
import { transcribeAudio, generateDreamImage, analyzeDream, createDreamChat } from './services/geminiService';
import AudioRecorder from './components/AudioRecorder';
import ProcessingView from './components/ProcessingView';
import ChatInterface from './components/ChatInterface';

// Extend Window interface for aistudio with named interface to avoid conflicts
declare global {
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): void;
  }
  
  interface Window {
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('intro');
  const [isKeySelected, setIsKeySelected] = useState(false);
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [processingStatus, setProcessingStatus] = useState('Processing');
  
  // Result Data
  const [transcript, setTranscript] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DreamAnalysis | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsKeySelected(hasKey);
      if (hasKey && appState === 'intro') {
        setAppState('recording');
      }
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio) {
      window.aistudio.openSelectKey();
      // Assuming success for immediate UX, real check happens on re-render or next action
      setIsKeySelected(true);
      setAppState('recording');
    }
  };

  const processDream = async (audioBlob: Blob) => {
    setAppState('processing');
    try {
      // 1. Transcribe
      setProcessingStatus('Listening to your dream');
      const base64Audio = await blobToBase64(audioBlob);
      const text = await transcribeAudio(base64Audio, audioBlob.type || 'audio/webm');
      setTranscript(text);

      // 2. Parallel Analysis & Image Gen
      setProcessingStatus('Interpreting symbols and generating visuals');
      
      const imagePromise = generateDreamImage(text, imageSize);
      const analysisPromise = analyzeDream(text);

      const [imgResult, analysisResult] = await Promise.all([imagePromise, analysisPromise]);
      
      setGeneratedImage(imgResult);
      setAnalysis(analysisResult);

      // 3. Setup Chat
      const chat = createDreamChat(text, analysisResult);
      setChatSession(chat);

      setAppState('viewing');
    } catch (error) {
      console.error(error);
      setProcessingStatus('Failed to process dream. Please try again.');
      setTimeout(() => setAppState('recording'), 3000);
    }
  };

  // Intro / Key Check Screen
  if (!isKeySelected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <h1 className="text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-6">
          Oneiric
        </h1>
        <p className="text-slate-400 mb-8 text-center max-w-md">
          Connect your Google AI Studio account to unlock the high-fidelity dream visualization engine.
        </p>
        <button 
          onClick={handleSelectKey}
          className="px-8 py-4 bg-violet-600 hover:bg-violet-500 rounded-xl font-bold text-lg transition-all shadow-lg shadow-violet-500/30"
        >
          Select API Key
        </button>
        <div className="mt-4 text-sm text-slate-600">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-slate-400">
            Billing Information
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-violet-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 p-4 sticky top-0 bg-slate-900/90 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setAppState('recording')}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500"></div>
            <h1 className="text-2xl font-serif font-bold tracking-wide text-slate-100">Oneiric</h1>
          </div>
          {appState === 'viewing' && (
            <button 
              onClick={() => setAppState('recording')}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              New Dream +
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 mt-4">
        
        {appState === 'recording' && (
          <AudioRecorder 
            onRecordingComplete={processDream} 
            selectedSize={imageSize}
            onSizeChange={setImageSize}
          />
        )}

        {appState === 'processing' && (
          <ProcessingView status={processingStatus} />
        )}

        {appState === 'viewing' && analysis && (
          <div className="space-y-12 animate-fade-in-up">
            
            {/* Visual Section */}
            <section className="flex flex-col items-center space-y-6">
              <div className="relative group w-full max-w-2xl aspect-square rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-black">
                 {generatedImage ? (
                   <img src={generatedImage} alt="Dream Visualization" className="w-full h-full object-cover" />
                 ) : (
                   <div className="flex items-center justify-center h-full text-slate-600">No image generated</div>
                 )}
                 <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white font-serif text-lg italic">"{transcript}"</p>
                 </div>
              </div>
            </section>

            {/* Analysis Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Text Analysis */}
              <div className="space-y-6">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                  <h2 className="text-sm font-bold text-violet-400 uppercase tracking-wider mb-2">Core Theme</h2>
                  <p className="text-2xl font-serif text-white">{analysis.emotionalTheme}</p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-serif text-slate-200 border-b border-slate-700 pb-2">Archetypal Analysis</h2>
                  {analysis.archetypes.map((arch, idx) => (
                    <div key={idx} className="group">
                      <h3 className="font-bold text-fuchsia-400 group-hover:text-fuchsia-300 transition-colors">{arch.name}</h3>
                      <p className="text-slate-300 text-sm leading-relaxed">{arch.description}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-serif text-slate-200 border-b border-slate-700 pb-2">Interpretation</h2>
                  <p className="text-slate-300 leading-relaxed font-light">
                    {analysis.interpretation}
                  </p>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="sticky top-24 self-start">
                {chatSession && (
                  <ChatInterface initialTranscript={transcript} chatSession={chatSession} />
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;