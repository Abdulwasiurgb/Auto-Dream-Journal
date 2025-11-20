import React, { useState, useRef, useEffect } from 'react';
import { ImageSize } from '../types';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  selectedSize: ImageSize;
  onSizeChange: (size: ImageSize) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, selectedSize, onSizeChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required to record your dream.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-serif text-violet-200">Record Your Dream</h2>
        <p className="text-slate-400 max-w-md">Speak freely while the memory is fresh. We will visualize and interpret it for you.</p>
      </div>

      <div className="relative group">
        <div className={`absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 ${isRecording ? 'animate-pulse-slow' : ''}`}></div>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`relative rounded-full w-32 h-32 flex items-center justify-center transition-all duration-300 shadow-xl border-4 ${
            isRecording 
              ? 'bg-rose-900 border-rose-500 scale-105' 
              : 'bg-slate-800 border-violet-500 hover:bg-slate-700'
          }`}
        >
          {isRecording ? (
             <div className="w-10 h-10 bg-rose-500 rounded-sm animate-pulse" />
          ) : (
            <svg className="w-12 h-12 text-violet-300 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
      </div>

      <div className="h-8 text-xl font-mono text-violet-300">
        {isRecording ? formatTime(recordingTime) : "Ready to record"}
      </div>

      <div className="flex flex-col items-center space-y-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
        <label className="text-sm text-slate-400 font-medium uppercase tracking-wider">Image Generation Quality</label>
        <div className="flex space-x-2">
          {(['1K', '2K', '4K'] as ImageSize[]).map((size) => (
            <button
              key={size}
              onClick={() => !isRecording && onSizeChange(size)}
              disabled={isRecording}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                selectedSize === size
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {size}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-1 text-center max-w-xs">
          Higher quality images (2K/4K) require the <strong>Gemini 3 Pro Image</strong> model.
        </p>
      </div>
    </div>
  );
};

export default AudioRecorder;
