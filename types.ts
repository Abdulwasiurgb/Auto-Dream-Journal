export type ImageSize = '1K' | '2K' | '4K';

export interface DreamAnalysis {
  summary: string;
  emotionalTheme: string;
  archetypes: {
    name: string;
    description: string;
  }[];
  interpretation: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type AppState = 'intro' | 'recording' | 'processing' | 'viewing';
