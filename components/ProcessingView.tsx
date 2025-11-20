import React, { useEffect, useState } from 'react';

interface ProcessingViewProps {
  status: string;
}

const ProcessingView: React.FC<ProcessingViewProps> = ({ status }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-96 space-y-8">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-t-4 border-violet-500 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-r-4 border-fuchsia-500 animate-spin animation-delay-200"></div>
        <div className="absolute inset-4 rounded-full border-b-4 border-indigo-500 animate-spin animation-delay-500"></div>
      </div>
      <h3 className="text-2xl font-serif text-violet-200 animate-pulse">
        {status}{dots}
      </h3>
      <p className="text-slate-400 text-sm max-w-xs text-center">
        Consulting the digital ether. This may take a moment as we weave your dreams into reality.
      </p>
    </div>
  );
};

export default ProcessingView;
