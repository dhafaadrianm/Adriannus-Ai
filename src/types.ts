export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imageUrl?: string;
  imagePrompt?: string;
  isGeneratedImage?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface AttachedFile {
  data: string; // base64 data without data:image/xxx;base64,
  mimeType: string;
  previewUrl: string;
  name: string;
}
