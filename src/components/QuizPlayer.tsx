import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Markdown from 'react-markdown';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Bookmark,
  Clock,
  BookOpen,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Brain,
  Search,
  Check,
  Edit3,
  ListOrdered,
  Layers,
} from 'lucide-react';
import { Module, Question, OptionLabel, UserAnswer } from '../types';
import { getDeepExplanationWithAI, generateMindMapWithAI } from '../services/api';
import { saveQuestion } from '../services/storage';
import { QuestionEditModal } from './QuestionEditModal';
import { QuestionQueueView } from './QuestionQueueView';
import { MindMapViewer } from './MindMapViewer';

interface QuizPlayerProps {
  module: Module;
  questions: Question[];
  onFinishQuiz: (answers: UserAnswer[]) => void;
  onBack: () => void;
  onToggleFlag: (qId: string) => void;
  flaggedIds: string[];
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  module,
  questions: initialQuestions,
  onFinishQuiz,
  onBack,
  onToggleFlag,
  flaggedIds,
}) => {
  const [questionsList, setQuestionsList] = useState<Question[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<OptionLabel | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  
  // Timer for current question
  const [secondsSpent, setSecondsSpent] = useState(0);

  // Accordion & Deep Explanation state
  const [activeTab, setActiveTab] = useState<'why' | 'incorrect' | 'concept' | 'mindmap' | 'sources'>('why');
  const [isDeepLoading, setIsDeepLoading] = useState(false);
  const [deepExplanation, setDeepExplanation] = useState<string | null>(null);
  const [deepSources, setDeepSources] = useState<{ title: string; url?: string }[]>([]);

  // Editing & Queue Modal states
  const [isEditing, setIsEditing] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);

  useEffect(() => {
    setQuestionsList(initialQuestions);
  }, [initialQuestions]);

  const currentQuestion = questionsList[currentIndex];
  const isFlagged = flaggedIds.includes(currentQuestion?.id || '');

  // Timer tick
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setSecondsSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentIndex, isSubmitted]);

  // Keyboard shortcut listener for options
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitted || isEditing || showQueue) return;
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D', 'E'].includes(key)) {
        const matching = currentQuestion?.options.find((o) => o.label === key);
        if (matching) setSelectedOption(key as OptionLabel);
      } else if (['1', '2', '3', '4', '5'].includes(key)) {
        const idx = Number(key) - 1;
        if (currentQuestion?.options[idx]) {
          setSelectedOption(currentQuestion.options[idx].label);
        }
      } else if (e.key === 'Enter' && selectedOption && !isSubmitted) {
        handleSubmitAnswer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, selectedOption, isSubmitted, isEditing, showQueue]);

  const handleSubmitAnswer = () => {
    if (!selectedOption || isSubmitted || !currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    setIsSubmitted(true);

    if (isCorrect) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    }

    const answerRecord: UserAnswer = {
      id: `ans-${Date.now()}-${currentQuestion.id}`,
      questionId: currentQuestion.id,
      moduleId: module.id,
      selectedOption,
      isCorrect,
      timeSpentSeconds: secondsSpent,
      answeredAt: new Date().toISOString(),
    };

    setUserAnswers((prev) => [...prev, answerRecord]);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questionsList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
      setSecondsSpent(0);
      setDeepExplanation(null);
      setDeepSources([]);
    } else {
      onFinishQuiz(userAnswers);
    }
  };

  const handleFetchDeepExplanation = async () => {
    if (!currentQuestion) return;
    setIsDeepLoading(true);
    try {
      const res = await getDeepExplanationWithAI({
        stem: currentQuestion.stem,
        options: currentQuestion.options,
        selectedOption: selectedOption || '',
        correctAnswer: currentQuestion.correctAnswer,
        currentExplanation: currentQuestion.explanation,
      });
      setDeepExplanation(res.explanation);
      setDeepSources(res.webSources || []);
    } catch (err) {
      console.error(err);
      alert('Não foi possível buscar a análise aprofundada online.');
    } finally {
      setIsDeepLoading(false);
    }
  };

  const handleGenerateMindMapInPlayer = async () => {
    if (!currentQuestion || !currentQuestion.explanation) return;
    setIsGeneratingMap(true);
    try {
      const newMap = await generateMindMapWithAI(currentQuestion.explanation, currentQuestion.stem);
      if (newMap) {
        const updated = { ...currentQuestion, mindMap: newMap };
        await saveQuestion(updated);
        setQuestionsList((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      }
    } catch (err) {
      console.error('Erro ao gerar mapa mental:', err);
    } finally {
      setIsGeneratingMap(false);
    }
  };

  const handleQuestionSaveSuccess = (updated: Question) => {
    setQuestionsList((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    setIsEditing(false);
  };

  if (!currentQuestion) {
    return (
      <div className="p-8 text-center text-slate-500">
        Nenhuma questão encontrada neste caderno.
      </div>
    );
  }

  const isCorrectAnswer = selectedOption === currentQuestion.correctAnswer;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Quiz Navigation Header */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Sair do Quiz</span>
        </button>

        {/* Queue Button & Progress */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQueue(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-all cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Ver Fila ({questionsList.length})</span>
          </button>

          <div className="text-center hidden sm:block">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Questão {currentIndex + 1} de {questionsList.length}
            </span>
            <div className="w-32 sm:w-40 h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questionsList.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Timer, Edit & Flag */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-xs font-semibold transition-colors"
            title="Editar enunciado, alternativas ou explicação"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Editar</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>{Math.floor(secondsSpent / 60)}m {secondsSpent % 60}s</span>
          </div>

          <button
            onClick={() => onToggleFlag(currentQuestion.id)}
            className={`p-2 rounded-xl transition-colors ${
              isFlagged
                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title={isFlagged ? 'Remover marcação' : 'Marcar para revisar depois'}
          >
            <Bookmark className={`w-4 h-4 ${isFlagged ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm mb-6">
        
        {/* Category & Tags */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            {module.category}
          </span>
          {currentQuestion.difficulty && (
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Dificuldade: {currentQuestion.difficulty}
            </span>
          )}
        </div>

        {/* Stem Enunciado */}
        <div className="prose dark:prose-invert max-w-none text-slate-900 dark:text-white font-medium text-base leading-relaxed mb-8">
          <Markdown>{currentQuestion.stem}</Markdown>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedOption === opt.label;
            const isCorrectOption = opt.label === currentQuestion.correctAnswer;

            let cardStyle =
              'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700';

            if (isSubmitted) {
              if (isCorrectOption) {
                cardStyle =
                  'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20';
              } else if (isSelected && !isCorrectOption) {
                cardStyle =
                  'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/20';
              } else {
                cardStyle = 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60';
              }
            } else if (isSelected) {
              cardStyle =
                'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-600 dark:border-indigo-500 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20 font-semibold';
            }

            return (
              <button
                key={opt.label}
                disabled={isSubmitted}
                onClick={() => setSelectedOption(opt.label)}
                className={`w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-all ${cardStyle}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center flex-shrink-0 transition-all ${
                    isSubmitted
                      ? isCorrectOption
                        ? 'bg-emerald-600 text-white'
                        : isSelected
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      : isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </div>

                <div className="flex-1 pt-1 text-sm leading-relaxed">
                  {opt.text}
                </div>

                {isSubmitted && isCorrectOption && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                )}
                {isSubmitted && isSelected && !isCorrectOption && (
                  <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Button: Confirm Answer */}
        {!isSubmitted && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedOption}
              className="flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition-all shadow-md shadow-indigo-500/20"
            >
              <span>Confirmar Resposta</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Post-Submission Feedback & Detailed Explanation */}
      {isSubmitted && (
        <div className="space-y-6">
          
          {/* Result Banner */}
          <div
            className={`p-6 rounded-2xl border flex items-center gap-4 ${
              isCorrectAnswer
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold ${
                isCorrectAnswer ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              {isCorrectAnswer ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
            </div>

            <div className="flex-1">
              <h3 className="text-base font-bold">
                {isCorrectAnswer ? 'Resposta Correta! Excelente trabalho!' : 'Ops, você errou esta questão.'}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                {isCorrectAnswer
                  ? `Você marcou a opção ${selectedOption} que é o gabarito oficial.`
                  : `Sua resposta foi ${selectedOption}, mas a opção correta é a ${currentQuestion.correctAnswer}.`}
              </p>
            </div>
          </div>

          {/* Explanation Accordion Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            
            {/* Explanation Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
              <button
                onClick={() => setActiveTab('why')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'why'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                💡 Por que está certa
              </button>

              <button
                onClick={() => setActiveTab('incorrect')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'incorrect'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                ❌ Análise das erradas
              </button>

              <button
                onClick={() => setActiveTab('concept')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'concept'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                🧠 Conceito Chave
              </button>

              <button
                onClick={() => setActiveTab('mindmap')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'mindmap'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Mapa Mental</span>
              </button>

              <button
                onClick={() => setActiveTab('sources')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'sources'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                📚 Fontes e Citações
              </button>
            </div>

            {/* Explanation Tab Content */}
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed min-h-[100px]">
              {activeTab === 'why' && (
                <div className="space-y-3">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    Fundamentação da Alternativa {currentQuestion.correctAnswer}:
                  </p>
                  <div className="prose dark:prose-invert text-xs max-w-none text-slate-800 dark:text-slate-200">
                    <Markdown>{currentQuestion.breakdown?.whyCorrect || currentQuestion.explanation}</Markdown>
                  </div>
                </div>
              )}

              {activeTab === 'incorrect' && (
                <div className="space-y-3">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    Por que os distratores estão incorretos:
                  </p>
                  {currentQuestion.breakdown?.whyOthersIncorrect && currentQuestion.breakdown.whyOthersIncorrect.length > 0 ? (
                    <div className="space-y-2">
                      {currentQuestion.breakdown.whyOthersIncorrect.map((item, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                          <span className="font-bold text-rose-600 dark:text-rose-400 mr-2">Opção {item.option}:</span>
                          <span>{item.reason}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="prose dark:prose-invert text-xs max-w-none">
                      <Markdown>{currentQuestion.explanation}</Markdown>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'concept' && (
                <div className="space-y-3">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    Resumo do Conceito para Memorizar:
                  </p>
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-medium prose dark:prose-invert max-w-none text-xs">
                    <Markdown>{currentQuestion.breakdown?.keyConcept || currentQuestion.explanation}</Markdown>
                  </div>
                </div>
              )}

              {activeTab === 'mindmap' && (
                <div>
                  {currentQuestion.mindMap ? (
                    <MindMapViewer
                      data={currentQuestion.mindMap}
                      onRefresh={handleGenerateMindMapInPlayer}
                      isGenerating={isGeneratingMap}
                    />
                  ) : (
                    <div className="p-6 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 text-center space-y-3">
                      <Layers className="w-8 h-8 text-purple-500 mx-auto" />
                      <div>
                        <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200">
                          Mapa Mental Aparentemente não Gerado
                        </h4>
                        <p className="text-xs text-purple-700/80 dark:text-purple-300/80">
                          Gere um mapa estruturado em nós a partir da explicação para facilitar a fixação visual.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateMindMapInPlayer}
                        disabled={isGeneratingMap}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isGeneratingMap ? 'Gerando Mapa Mental...' : 'Gerar Mapa Mental com IA'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sources' && (
                <div className="space-y-3">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    Fontes de Referência e Base Legal/Técnica:
                  </p>
                  {currentQuestion.sources && currentQuestion.sources.length > 0 ? (
                    <ul className="space-y-2">
                      {currentQuestion.sources.map((src, i) => (
                        <li key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{src.title}</span>
                            {src.authorOrLaw && <span className="text-[11px] text-slate-500 dark:text-slate-400">{src.authorOrLaw}</span>}
                          </div>
                          {src.url && (
                            <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 text-[11px]">
                              <span>Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Fonte validada pela IA durante o processamento.</p>
                  )}
                </div>
              )}
            </div>

            {/* Deep Explanation Request */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={handleFetchDeepExplanation}
                disabled={isDeepLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>{isDeepLoading ? 'Pesquisando Doutrina na Web...' : 'Solicitar Explicação Aprofundada com Busca Web (IA)'}</span>
              </button>

              <button
                onClick={handleNextQuestion}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20"
              >
                <span>{currentIndex < questionsList.length - 1 ? 'Próxima Questão' : 'Ver Resultado Final'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Render Deep Explanation Result if requested */}
            {deepExplanation && (
              <div className="mt-4 p-5 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs leading-relaxed space-y-3">
                <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-bold">
                  <Brain className="w-4 h-4" />
                  <span>Análise Doutrinária e Jurisprudencial Ampliada:</span>
                </div>
                <div className="prose dark:prose-invert text-xs max-w-none text-slate-800 dark:text-slate-200">
                  <Markdown>{deepExplanation}</Markdown>
                </div>
                {deepSources.length > 0 && (
                  <div className="pt-2 border-t border-purple-200/60 dark:border-purple-800/60">
                    <span className="font-bold text-[11px] text-purple-900 dark:text-purple-300 block mb-1">
                      Fontes Encontradas na Web:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {deepSources.map((s, i) => (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded bg-white dark:bg-slate-800 text-[10px] text-indigo-600 dark:text-indigo-400 border border-purple-200 dark:border-purple-800 hover:underline flex items-center gap-1"
                        >
                          <span>{s.title}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {isEditing && (
        <QuestionEditModal
          question={currentQuestion}
          onSaveSuccess={handleQuestionSaveSuccess}
          onClose={() => setIsEditing(false)}
        />
      )}

      {/* Question Queue Drawer */}
      {showQueue && (
        <QuestionQueueView
          questions={questionsList}
          userAnswers={userAnswers}
          currentIndex={currentIndex}
          onSelectQuestion={(idx) => {
            setCurrentIndex(idx);
            setSelectedOption(null);
            setIsSubmitted(false);
            setSecondsSpent(0);
          }}
          onClose={() => setShowQueue(false)}
        />
      )}
    </div>
  );
};

