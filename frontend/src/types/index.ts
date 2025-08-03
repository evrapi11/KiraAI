export interface BigFiveTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  traits: BigFiveTraits;
  created_at: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  traits?: BigFiveTraits;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood_rating?: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface JournalEntryCreate {
  title: string;
  content: string;
  mood_rating?: number;
  tags: string[];
}

export interface JournalEntryUpdate {
  title?: string;
  content?: string;
  mood_rating?: number;
  tags?: string[];
}

export interface StrategicPlan {
  id: string;
  title: string;
  analysis: string;
  recommendations: string[];
  generated_at: string;
  zen_insight: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
  loading: boolean;
}