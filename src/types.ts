export type OptionLabel = 'A' | 'B' | 'C' | 'D' | 'E' | '';

export interface QuestionOption {
  id: string;
  label: OptionLabel;
  text: string;
}

export interface ExplanationBreakdown {
  whyCorrect: string;
  whyOthersIncorrect: { option: string; reason: string }[];
  keyConcept: string;
}

export interface SourceCitation {
  title: string;
  url?: string;
  authorOrLaw?: string;
  snippet?: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  color?: string;
  children?: MindMapNode[];
}

export interface MindMapData {
  centralTopic: string;
  root: MindMapNode;
}

export interface Question {
  id: string;
  moduleId: string;
  stem: string; // Enunciado
  options: QuestionOption[];
  correctAnswer: OptionLabel;
  explanation: string;
  breakdown?: ExplanationBreakdown;
  sources?: SourceCitation[];
  mindMap?: MindMapData;
  difficulty?: 'Fácil' | 'Médio' | 'Difícil';
  tags?: string[];
  isCustomAiSolved?: boolean; // Se o gabarito foi determinado pela IA
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  category: string;
  folderId?: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
  icon?: string;
  color?: string;
}

export interface UserAnswer {
  id: string;
  questionId: string;
  moduleId: string;
  selectedOption: OptionLabel;
  isCorrect: boolean;
  timeSpentSeconds: number;
  answeredAt: string;
}

export interface QuestionFlag {
  questionId: string;
  flaggedAt: string;
  notes?: string;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  dailyTarget: number;
  streakDays: number;
  lastActiveDate: string;
  xp: number;
  level: number;
}

export interface DraftQuestion {
  id: string;
  stem: string;
  options: { label: OptionLabel; text: string }[];
  correctAnswer: OptionLabel;
  explanation: string;
  breakdown?: ExplanationBreakdown;
  sources?: SourceCitation[];
  mindMap?: MindMapData;
  difficulty?: 'Fácil' | 'Médio' | 'Difícil';
  tags?: string[];
  isCustomAiSolved?: boolean;
}

export interface DraftIngestionBatch {
  suggestedTitle: string;
  suggestedCategory: string;
  rawFileName?: string;
  questions: DraftQuestion[];
  targetModuleId?: string;
}

export type ActiveTab = 'modules' | 'caderno_erros' | 'stats' | 'ingest' | 'settings';
