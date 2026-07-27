import React, { useState } from 'react';
import { Question, UserAnswer } from '../types';
import {
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  ListOrdered,
  ChevronRight,
} from 'lucide-react';

interface QuestionQueueViewProps {
  questions: Question[];
  userAnswers: UserAnswer[];
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
  onClose: () => void;
}

export const QuestionQueueView: React.FC<QuestionQueueViewProps> = ({
  questions,
  userAnswers,
  currentIndex,
  onSelectQuestion,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Map latest answer for each question
  const answerMap = new Map<string, boolean>();
  userAnswers.forEach((ans) => {
    answerMap.set(ans.questionId, ans.isCorrect);
  });

  const filteredQuestions = questions.map((q, idx) => ({ q, originalIndex: idx })).filter(
    ({ q }) =>
      q.stem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.tags && q.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 my-8 shadow-2xl relative space-y-4 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Fila de Questões ({questions.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acesse e responda qualquer questão do caderno em tempo real.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar questão pelo enunciado ou assunto..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* List of Questions */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredQuestions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Nenhuma questão encontrada com o filtro "{searchTerm}".
            </div>
          ) : (
            filteredQuestions.map(({ q, originalIndex }) => {
              const isCurrent = originalIndex === currentIndex;
              const hasAnswered = answerMap.has(q.id);
              const isCorrect = answerMap.get(q.id);

              return (
                <div
                  key={q.id}
                  onClick={() => {
                    onSelectQuestion(originalIndex);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                    isCurrent
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Question Number Badge */}
                  <div
                    className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center flex-shrink-0 ${
                      isCurrent
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {originalIndex + 1}
                  </div>

                  {/* Stem snippet */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {q.stem.replace(/[#*`]/g, '')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {q.difficulty && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {q.difficulty}
                        </span>
                      )}
                      {q.tags && q.tags.length > 0 && (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                          • {q.tags[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasAnswered ? (
                      isCorrect ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Acertou</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Errou</span>
                        </span>
                      )
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Pendente</span>
                      </span>
                    )}

                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
