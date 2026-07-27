import { DraftIngestionBatch, DraftQuestion, OptionLabel, MindMapData } from '../types';

export async function parseQuestionsWithAI(text: string): Promise<{ questions: DraftQuestion[]; reviewNotes?: string }> {
  const response = await fetch('/api/ai/parse-questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Não foi possível estruturar as questões com a IA.');
  }

  const rawQuestions = json.questoes || [];

  const questions = rawQuestions.map((q: any, idx: number) => {
    const rawLabel = (q.numero_original ? `Questão ${q.numero_original}` : '');
    let cleanStem = (q.enunciado || 'Enunciado não identificado').trim();
    // Clean leading question numbers e.g. "42 Um hospital..." or "Questão 42 -"
    cleanStem = cleanStem.replace(/^(?:quest[ãa]o\s+|q\.\s*)?0*\d{1,3}\s*[\.\)\-–:]?\s+/i, '').trim();
    
    const formattedOptions = (q.alternativas || []).map((alt: any, optIdx: number) => {
      const labelChar = (alt.letra || ['A','B','C','D','E'][optIdx] || 'A')
        .toUpperCase()
        .replace(/[^A-E]/g, '') || ['A','B','C','D','E'][optIdx] || 'A';
      
      let cleanText = (alt.texto || '').trim();
      // Remove repetitive leading prefixes like "(A)", "A)", "A." or "A - "
      cleanText = cleanText.replace(/^\(?[A-Ea-e]\)?[\.\)\-–:]\s*/, '').trim();

      return {
        label: labelChar as OptionLabel,
        text: cleanText,
      };
    });

    return {
      id: `draft-ai-${Date.now()}-${idx}`,
      stem: cleanStem,
      options: formattedOptions,
      correctAnswer: '' as OptionLabel, // Gabarito Pendente initially
      explanation: '', // Free writing space for user
      difficulty: (['Fácil', 'Médio', 'Difícil'].includes(q.dificuldade) ? q.dificuldade : 'Médio') as any,
      tags: q.tag && q.tag.trim() ? [q.tag.trim()] : (rawLabel ? [rawLabel] : []),
      isCustomAiSolved: false,
    };
  });

  return {
    questions,
    reviewNotes: json.reviewNotes,
  };
}

export async function formatExplanationWithAI(explanation: string): Promise<string> {
  const response = await fetch('/api/ai/format-explanation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ explanation }),
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Não foi possível reorganizar a explicação com a IA.');
  }

  return json.formattedExplanation || explanation;
}

export async function generateMindMapWithAI(explanation: string, stem?: string): Promise<MindMapData | null> {
  const response = await fetch('/api/ai/generate-mindmap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ explanation, stem }),
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Não foi possível gerar o mapa mental.');
  }

  if (!json.hasMindMap || !json.mindMap) {
    return null;
  }

  return json.mindMap as MindMapData;
}

export async function getDeepExplanationWithAI(params: {
  stem: string;
  options: any[];
  selectedOption: string;
  correctAnswer: string;
  currentExplanation: string;
}) {
  const response = await fetch('/api/ai/explain-question', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Não foi possível carregar a explicação aprofundada.');
  }

  return {
    explanation: json.explanation,
    webSources: json.webSources || [],
  };
}

export async function generatePracticeQuestionsWithAI(params: {
  topic: string;
  amount?: number;
  difficulty?: string;
  targetExam?: string;
}): Promise<DraftIngestionBatch> {
  const response = await fetch('/api/ai/generate-questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Falha ao gerar questões por tema.');
  }

  const data = json.data;
  const formattedQuestions = (data.questions || []).map((q: any, idx: number) => ({
    id: `draft-gen-${Date.now()}-${idx}`,
    stem: q.stem || 'Sem enunciado',
    options: (q.options || []).map((opt: any) => ({
      label: (opt.label || 'A').toUpperCase(),
      text: opt.text || '',
    })),
    correctAnswer: (q.correctAnswer || '').toUpperCase(),
    explanation: q.explanation || '',
    breakdown: q.breakdown || {
      whyCorrect: '',
      whyOthersIncorrect: [],
      keyConcept: '',
    },
    sources: q.sources || [],
    difficulty: q.difficulty || params.difficulty || 'Médio',
    tags: q.tags || [params.topic],
    isCustomAiSolved: false,
  }));

  return {
    suggestedTitle: data.suggestedTitle || `Prática: ${params.topic}`,
    suggestedCategory: data.suggestedCategory || 'Exercícios Gerados',
    questions: formattedQuestions,
  };
}
