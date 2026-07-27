import React, { useState } from 'react';
import {
  BookOpen,
  Play,
  FileText,
  Trash2,
  Share2,
  CheckCircle2,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Module, UserAnswer, Question } from '../types';

interface ModuleCardProps {
  module: Module;
  questions: Question[];
  answers: UserAnswer[];
  onStartQuiz: (mod: Module) => void;
  onOpenDetail: (mod: Module) => void;
  onDelete: (modId: string) => void;
  onExport: (mod: Module) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  questions,
  answers,
  onStartQuiz,
  onOpenDetail,
  onDelete,
  onExport,
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Filter questions belonging to this module
  const moduleQuestions = questions.filter((q) => q.moduleId === module.id);
  const totalQuestions = moduleQuestions.length;

  // Calculate readiness (% with correct answer + non-empty explanation)
  const readyQuestionsCount = moduleQuestions.filter(
    (q) => q.correctAnswer && q.correctAnswer.trim().length > 0 && q.explanation && q.explanation.trim().length > 0
  ).length;

  const readinessPct = totalQuestions > 0 ? Math.round((readyQuestionsCount / totalQuestions) * 100) : 0;

  // Compute accuracy statistics from quiz answers
  const moduleAnswers = answers.filter((a) => a.moduleId === module.id);
  const totalAnswered = moduleAnswers.length;
  const correctCount = moduleAnswers.filter((a) => a.isCorrect).length;
  const accuracyPct = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between group">
      <div>
        {/* Top Category & Question Count */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            {module.category}
          </span>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>{totalQuestions} {totalQuestions === 1 ? 'questão' : 'questões'}</span>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
          {module.title}
        </h3>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {module.description || 'Caderno de questões extraído por IA.'}
        </p>

        {/* Readiness Bar (% Prontas: Correta Marcada + Explicação Escrita) */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>Questões Prontas:</span>
            </span>
            <span className={`font-bold ${readinessPct === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {readinessPct}% ({readyQuestionsCount}/{totalQuestions})
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${readinessPct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${readinessPct}%` }}
            />
          </div>

          {/* Quiz Performance Accuracy if answered */}
          {totalAnswered > 0 && (
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Aproveitamento em simulados:</span>
              <strong className="text-indigo-600 dark:text-indigo-400">{accuracyPct}% acertos ({totalAnswered} resp.)</strong>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
        <button
          onClick={() => onStartQuiz(module)}
          disabled={totalQuestions === 0}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition-all shadow-xs cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Estudar Caderno</span>
        </button>

        <button
          onClick={() => onOpenDetail(module)}
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="Editar questões e explicações"
        >
          <FileText className="w-4 h-4" />
        </button>

        <button
          onClick={() => onExport(module)}
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="Exportar Resumo ou PDF"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {isConfirmingDelete ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col gap-2 bg-rose-50 dark:bg-rose-950/90 border border-rose-200 dark:border-rose-800 p-3 rounded-2xl animate-fade-in w-full"
          >
            <div className="flex items-start gap-2">
              <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-rose-900 dark:text-rose-200">
                  Excluir este caderno?
                </p>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 leading-tight">
                  {totalQuestions > 0
                    ? `Atenção: O caderno e todas as ${totalQuestions} questões associadas serão apagados permanentemente.`
                    : 'Esta ação não pode ser desfeita.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfirmingDelete(false);
                }}
                className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(module.id);
                  setIsConfirmingDelete(false);
                }}
                className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsConfirmingDelete(true);
            }}
            className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Excluir Caderno de Questões"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
