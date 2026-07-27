import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Check,
  CheckCircle2,
  BookOpen,
  Share2,
  AlertCircle,
  Sparkles,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { Module, Question, OptionLabel } from '../types';

interface ModuleDetailModalProps {
  module: Module;
  questions: Question[];
  onSaveQuestion: (q: Question) => void;
  onDeleteQuestion: (qId: string) => void;
  onUpdateModuleInfo: (title: string, category: string) => void;
  onClose: () => void;
  onExport: () => void;
}

export const ModuleDetailModal: React.FC<ModuleDetailModalProps> = ({
  module,
  questions,
  onSaveQuestion,
  onDeleteQuestion,
  onUpdateModuleInfo,
  onClose,
  onExport,
}) => {
  const [title, setTitle] = useState(module.title);
  const [category, setCategory] = useState(module.category);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedStatusId, setSavedStatusId] = useState<string | null>(null);
  const [confirmDeleteQId, setConfirmDeleteQId] = useState<string | null>(null);

  const triggerAutosave = (updatedQ: Question) => {
    onSaveQuestion(updatedQ);
    setSavedStatusId(updatedQ.id);
    setTimeout(() => {
      setSavedStatusId(null);
    }, 2000);
  };

  const handleCreateNewQuestion = () => {
    const newQ: Question = {
      id: `q-manual-${Date.now()}`,
      moduleId: module.id,
      stem: 'Escreva aqui o enunciado da questão...',
      options: [
        { id: `opt-1-${Date.now()}`, label: 'A', text: 'Primeira alternativa' },
        { id: `opt-2-${Date.now()}`, label: 'B', text: 'Segunda alternativa' },
        { id: `opt-3-${Date.now()}`, label: 'C', text: 'Terceira alternativa' },
        { id: `opt-4-${Date.now()}`, label: 'D', text: 'Quarta alternativa' },
      ],
      correctAnswer: '' as OptionLabel,
      explanation: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSaveQuestion(newQ);
    setEditingId(newQ.id);
  };

  const handleAddOption = (q: Question) => {
    const labels: OptionLabel[] = ['A', 'B', 'C', 'D', 'E'];
    if (q.options.length >= 5) return;
    const nextLabel = labels[q.options.length];
    const newOptions = [
      ...q.options,
      { id: `opt-${nextLabel}-${Date.now()}`, label: nextLabel, text: `Nova opção ${nextLabel}` },
    ];
    triggerAutosave({ ...q, options: newOptions, updatedAt: new Date().toISOString() });
  };

  const handleRemoveOption = (q: Question, optionLabel: OptionLabel) => {
    if (q.options.length <= 2) return; // Keep at least 2 options
    const filteredOpts = q.options.filter((o) => o.label !== optionLabel);
    // Re-label A, B, C...
    const labels: OptionLabel[] = ['A', 'B', 'C', 'D', 'E'];
    const relabeled = filteredOpts.map((opt, idx) => ({
      ...opt,
      label: labels[idx],
    }));
    const newCorrect = relabeled.some((o) => o.label === q.correctAnswer) ? q.correctAnswer : ('' as OptionLabel);
    triggerAutosave({ ...q, options: relabeled, correctAnswer: newCorrect, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-900/80">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                Edição do Caderno de Questões
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                Salva Automaticamente
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Edite enunciados, alternativas, selecione a correta e escreva a explicação de cada questão.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExport}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Exportar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Module Meta Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Nome do Caderno
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => onUpdateModuleInfo(title, category)}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Categoria / Disciplina
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onBlur={() => onUpdateModuleInfo(title, category)}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
              <span>Lista de Questões ({questions.length})</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Clique na letra (A, B, C...) para definir a alternativa correta
              </span>
            </div>

            {questions.map((q, idx) => {
              const isEditing = editingId === q.id || editingId === null; // expand all or specific
              const isSaved = savedStatusId === q.id;
              const hasExplanation = q.explanation && q.explanation.trim().length > 0;

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4 transition-all"
                >
                  {/* Question Top Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        Questão #{idx + 1}
                      </span>

                      {/* Status Badges */}
                      {hasExplanation ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                          Pronta ✓
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800">
                          Pendente Explicação
                        </span>
                      )}

                      {isSaved && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
                          Salvo no banco!
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {confirmDeleteQId === q.id ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/90 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-xl"
                        >
                          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                            Excluir Questão #{idx + 1}?
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteQuestion(q.id);
                              setConfirmDeleteQId(null);
                            }}
                            className="px-2.5 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer shadow-xs transition-colors"
                          >
                            Sim, Excluir
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteQId(null);
                            }}
                            className="px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-[11px] cursor-pointer transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteQId(q.id);
                          }}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Excluir questão permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Stem Textarea */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Enunciado da Questão
                    </label>
                    <textarea
                      rows={3}
                      value={q.stem}
                      onChange={(e) => {
                        const updated = { ...q, stem: e.target.value, updatedAt: new Date().toISOString() };
                        triggerAutosave(updated);
                      }}
                      placeholder="Digite ou edite o enunciado..."
                      className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-medium"
                    />
                  </div>

                  {/* Options List */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Alternativas (Clique na letra para marcar qual é a correta):
                    </label>

                    {q.options.map((opt) => {
                      const isCorrect = Boolean(q.correctAnswer) && q.correctAnswer === opt.label;

                      return (
                        <div key={opt.label} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...q, correctAnswer: opt.label as OptionLabel, updatedAt: new Date().toISOString() };
                              triggerAutosave(updated);
                            }}
                            className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/50 shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                            title={isCorrect ? 'Alternativa Selecionada como Correta' : 'Clique para marcar como Correta'}
                          >
                            {opt.label}
                          </button>

                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => {
                              const newOpts = q.options.map((o) =>
                                o.label === opt.label ? { ...o, text: e.target.value } : o
                              );
                              const updated = { ...q, options: newOpts, updatedAt: new Date().toISOString() };
                              triggerAutosave(updated);
                            }}
                            className={`flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                              isCorrect
                                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/20'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          />

                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(q, opt.label)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                              title="Remover esta alternativa"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {q.options.length < 5 && (
                      <button
                        type="button"
                        onClick={() => handleAddOption(q)}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Adicionar alternativa ({['A','B','C','D','E'][q.options.length]})</span>
                      </button>
                    )}
                  </div>

                  {/* Manual Explanation Field */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Texto da Explicação (Escreva a justificativa para fixar o aprendizado):
                    </label>
                    <textarea
                      rows={3}
                      value={q.explanation || ''}
                      onChange={(e) => {
                        const updated = { ...q, explanation: e.target.value, updatedAt: new Date().toISOString() };
                        triggerAutosave(updated);
                      }}
                      placeholder="Escreva a explicação com suas palavras ou fundamentação legal/doutrinária..."
                      className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Question Button */}
          <button
            onClick={handleCreateNewQuestion}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700/80 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Nova Questão Manualmente</span>
          </button>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
            Todas as alterações são salvas automaticamente no seu banco de dados local/nuvem.
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-md ml-auto"
          >
            Concluir Edição
          </button>
        </div>
      </div>
    </div>
  );
};
