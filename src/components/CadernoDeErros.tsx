import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Filter,
  Brain,
  ArrowRight,
  Sparkles,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Question, UserAnswer, Module } from '../types';
import { QuizPlayer } from './QuizPlayer';

interface CadernoDeErrosProps {
  questions: Question[];
  userAnswers: UserAnswer[];
  modules: Module[];
  onFinishQuiz: (answers: UserAnswer[]) => void;
  onToggleFlag: (qId: string) => void;
  flaggedIds: string[];
  onRemoveFromErrors?: (qId: string) => void;
  onDeleteQuestion?: (qId: string, modId: string) => void;
}

export const CadernoDeErros: React.FC<CadernoDeErrosProps> = ({
  questions,
  userAnswers,
  modules,
  onFinishQuiz,
  onToggleFlag,
  flaggedIds,
  onRemoveFromErrors,
  onDeleteQuestion,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [isPracticing, setIsPracticing] = useState(false);
  const [confirmDeleteQId, setConfirmDeleteQId] = useState<string | null>(null);
  const [confirmRemoveErrorQId, setConfirmRemoveErrorQId] = useState<string | null>(null);

  // Identify missed question IDs
  // A question is considered "missed" if the user's latest answer for it was incorrect
  const latestAnswersByQuestion = new Map<string, UserAnswer>();
  userAnswers.forEach((ans) => {
    const existing = latestAnswersByQuestion.get(ans.questionId);
    if (!existing || new Date(ans.answeredAt) > new Date(existing.answeredAt)) {
      latestAnswersByQuestion.set(ans.questionId, ans);
    }
  });

  const missedQuestionIds = new Set<string>();
  latestAnswersByQuestion.forEach((ans, qId) => {
    if (!ans.isCorrect) {
      missedQuestionIds.add(qId);
    }
  });

  const missedQuestions = questions.filter((q) => missedQuestionIds.has(q.id));

  const categories = ['Todas', ...Array.from(new Set(missedQuestions.map((q) => {
    const mod = modules.find((m) => m.id === q.moduleId);
    return mod?.category || 'Geral';
  })))];

  const filteredQuestions = selectedCategory === 'Todas'
    ? missedQuestions
    : missedQuestions.filter((q) => {
        const mod = modules.find((m) => m.id === q.moduleId);
        return mod?.category === selectedCategory;
      });

  if (isPracticing && filteredQuestions.length > 0) {
    const mockModule: Module = {
      id: 'mod-caderno-erros',
      title: 'Caderno de Erros — Revisão Ativa',
      description: 'Revisão focada nas questões que você errou anteriormente.',
      category: selectedCategory === 'Todas' ? 'Revisão Geral' : selectedCategory,
      questionCount: filteredQuestions.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return (
      <QuizPlayer
        module={mockModule}
        questions={filteredQuestions}
        onFinishQuiz={(answers) => {
          setIsPracticing(false);
          onFinishQuiz(answers);
        }}
        onBack={() => setIsPracticing(false)}
        onToggleFlag={onToggleFlag}
        flaggedIds={flaggedIds}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 text-white shadow-lg mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-3">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Repetição Espaçada & Erros</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Caderno de Erros Inteligente
            </h1>
            <p className="mt-2 text-rose-100 text-xs sm:text-sm max-w-xl">
              Foque exatamente nas questões onde você derrapou. Resolver seus erros é o método científico mais eficiente para alcançar a aprovação.
            </p>
          </div>

          {filteredQuestions.length > 0 && (
            <button
              onClick={() => setIsPracticing(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white text-rose-600 hover:bg-rose-50 font-extrabold text-xs shadow-lg transition-all transform hover:scale-105"
            >
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>Iniciar Treino dos Erros ({filteredQuestions.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      {missedQuestions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar por Matéria:</span>
          </span>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Questions List or Empty State */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Nenhum erro pendente neste filtro!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Parabéns! Você resolveu todas as questões sem cometer erros pendentes. Continue respondendo aos cadernos para alimentar seus estudos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuestions.map((q) => {
            const mod = modules.find((m) => m.id === q.moduleId);

            return (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:border-rose-300 dark:hover:border-rose-800 transition-all shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      {mod?.category || 'Geral'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 mr-1">
                        Gabarito: {q.correctAnswer}
                      </span>

                      {/* Remove Error Action */}
                      {onRemoveFromErrors && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmRemoveErrorQId(q.id);
                            setConfirmDeleteQId(null);
                          }}
                          className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                          title="Remover desta lista de erros"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete Question Permanently */}
                      {onDeleteQuestion && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteQId(q.id);
                            setConfirmRemoveErrorQId(null);
                          }}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Excluir questão permanentemente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-3 leading-relaxed mb-4">
                    {q.stem}
                  </p>

                  {/* Inline Confirmation: Remove From Error Log */}
                  {confirmRemoveErrorQId === q.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs animate-fade-in"
                    >
                      <p className="font-bold text-emerald-900 dark:text-emerald-200 text-[11px]">
                        Remover do Caderno de Erros?
                      </p>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                        O histórico do erro será limpo desta lista, mantendo a questão no caderno.
                      </p>
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmRemoveErrorQId(null);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[10px] cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onRemoveFromErrors) onRemoveFromErrors(q.id);
                            setConfirmRemoveErrorQId(null);
                          }}
                          className="px-2.5 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer"
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Confirmation: Delete Question Permanently */}
                  {confirmDeleteQId === q.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mb-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-xs animate-fade-in"
                    >
                      <p className="font-bold text-rose-900 dark:text-rose-200 text-[11px]">
                        Excluir questão permanentemente?
                      </p>
                      <p className="text-[10px] text-rose-700 dark:text-rose-300 mt-0.5">
                        Esta ação removerá a questão do caderno e de todas as estatísticas.
                      </p>
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteQId(null);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[10px] cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteQuestion) onDeleteQuestion(q.id, q.moduleId);
                            setConfirmDeleteQId(null);
                          }}
                          className="px-2.5 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] cursor-pointer"
                        >
                          Sim, Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[200px]">
                    Caderno: {mod?.title || 'Estudo'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPracticing(true);
                    }}
                    className="text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <span>Refazer</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
