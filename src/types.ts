export interface GeneratedImage {
  id: string;
  angle: string;
  description: string;
  url: string | null;
  loading: boolean;
  error: string | null;
  statusMessage?: string;
}

export interface GenerationSettings {
  userText: string;
  style: string;
  tone: string;
  appetisingMode: boolean;
}
