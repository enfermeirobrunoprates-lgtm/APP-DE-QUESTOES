import React, { useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Trash2,
  Plus,
  AlertCircle,
  HelpCircle,
  Brain,
  Sparkles,
  Save,
  ArrowLeft,
  BookOpen,
  Tag,
  BarChart2,
} from 'lucide-react';
import { DraftIngestionBatch, DraftQuestion, Module, OptionLabel } from '../types';

interface ReviewDraftModalProps {
  draftBatch: DraftIngestionBatch;
  modules?: Module[];
  onConfirmSave: (
    title: string,
    category: string,
    questions: DraftQuestion[],
    targetModuleId?: string
  ) => void;
  onCancel: () => void;
}

export const ReviewDraftModal: React.FC<ReviewDraftModalProps> = ({
  draftBatch,
  modules = [],
  onConfirmSave,
  onCancel,
}) => {
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>(
    draftBatch.targetModuleId || 'new'
  );
  const [title, setTitle] = useState(draftBatch.suggestedTitle);
  const [category, setCategory] = useState(draftBatch.suggestedCategory);
  const [questions, setQuestions] = useState<DraftQuestion[]>(draftBatch.questions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteQId, setConfirmDeleteQId] = useState<string | null>(null);

  const handleUpdateQuestion = (qId: string, updated: Partial<DraftQuestion>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, ...updated } : q))
    );
  };

  const handleUpdateOptionText = (qId: string, optIndex: number, newText: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const newOpts = [...q.options];
        newOpts[optIndex] = { ...newOpts[optIndex], text: newText };
        return { ...q, options: newOpts };
      })
    );
  };

  const handleDeleteQuestion = (qId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const handleConfirmSaveClick = () => {
    if (!questions || questions.length === 0) {
      alert('O caderno precisa ter pelo menos 1 questão para ser salvo.');
      return;
    }
    const targetModuleId = selectedNotebookId !== 'new' ? selectedNotebookId : undefined;
    onConfirmSave(title, category, questions, targetModuleId);
  };

  const handleAddQuestion = () => {
    const newQ: DraftQuestion = {
      id: `draft-manual-${Date.now()}`,
      stem: 'Nova questão manual. Digite o enunciado aqui...',
      options: [
        { label: 'A', text: 'Opção A' },
        { label: 'B', text: 'Opção B' },
        { label: 'C', text: 'Opção C' },
        { label: 'D', text: 'Opção D' },
        { label: 'E', text: 'Opção E' },
      ],
      correctAnswer: '' as OptionLabel,
      explanation: '',
      difficulty: 'Médio',
      tags: [],
    };
    setQuestions((prev) => [...prev, newQ]);
    setEditingId(newQ.id);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Envio</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Revisar Questões Estruturadas
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {questions.length} {questions.length === 1 ? 'questão' : 'questões'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Examine os cards de questões estruturados pela IA, defina os gabaritos e selecione o caderno de destino.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Descartar
          </button>
          <button
            onClick={handleConfirmSaveClick}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Confirmar e Salvar</span>
          </button>
        </div>
      </div>

      {/* Notebook Destination & Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/80">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Escolha o Caderno de Destino:</span>
          </label>
          <select
            value={selectedNotebookId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedNotebookId(val);
              if (val !== 'new' && modules) {
                const mod = modules.find((m) => m.id === val);
                if (mod) {
                  setTitle(mod.title);
                  setCategory(mod.category);
                }
              }
            }}
            className="w-full sm:w-80 px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="new">+ Criar Novo Caderno de Questões</option>
            {modules.map((mod) => (
              <option key={mod.id} value={mod.id}>
                {mod.title} ({mod.questionCount} questões)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nome do Caderno
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={selectedNotebookId !== 'new'}
              placeholder="Ex: Prova de Direito Constitucional"
              className="w-full px-3.5 py-2 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-75"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Categoria / Matéria
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={selectedNotebookId !== 'new'}
              placeholder="Ex: Concursos / OAB"
              className="w-full px-3.5 py-2 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-75"
            />
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {questions.map((q, index) => {
          const isEditing = editingId === q.id;

          return (
            <div
              key={q.id}
              className={`bg-white dark:bg-slate-800 rounded-2xl border transition-all ${
                isEditing
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              {/* Question Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 rounded-t-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                    Questão {index + 1}
                  </span>

                  {/* Tag Badge */}
                  {q.tags && q.tags.length > 0 && q.tags[0] ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      {q.tags[0]}
                    </span>
                  ) : null}

                  {/* Difficulty Badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${
                      q.difficulty === 'Fácil'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : q.difficulty === 'Difícil'
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <BarChart2 className="w-3 h-3" />
                    {q.difficulty || 'Médio'}
                  </span>

                  {/* Gabarito Status Badge */}
                  {!q.correctAnswer ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      Gabarito Pendente
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      Gabarito: ({q.correctAnswer})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(isEditing ? null : q.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Concluir Edição' : 'Editar'}</span>
                  </button>

                  {confirmDeleteQId === q.id ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/90 border border-rose-200 dark:border-rose-800 px-3 py-1 rounded-xl"
                    >
                      <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                        Remover do rascunho?
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuestion(q.id);
                          setConfirmDeleteQId(null);
                        }}
                        className="px-2.5 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer shadow-xs"
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteQId(null);
                        }}
                        className="px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] cursor-pointer"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteQId(q.id);
                      }}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                      title="Excluir questão do rascunho"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Question Content */}
              <div className="p-6 space-y-4">
                {/* Stem / Enunciado */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Enunciado da Questão
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={q.stem}
                      onChange={(e) => handleUpdateQuestion(q.id, { stem: e.target.value })}
                      className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed">
                      {q.stem}
                    </p>
                  )}
                </div>

                {/* Edit Tag & Difficulty controls when editing */}
                {isEditing && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Origem / Tag
                      </label>
                      <input
                        type="text"
                        value={q.tags?.[0] || ''}
                        onChange={(e) =>
                          handleUpdateQuestion(q.id, {
                            tags: e.target.value.trim() ? [e.target.value.trim()] : [],
                          })
                        }
                        placeholder="Ex: FCC / 2023 / OAB"
                        className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Dificuldade
                      </label>
                      <select
                        value={q.difficulty || 'Médio'}
                        onChange={(e) =>
                          handleUpdateQuestion(q.id, {
                            difficulty: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="Fácil">Fácil</option>
                        <option value="Médio">Médio</option>
                        <option value="Difícil">Difícil</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Options & Correct Answer Selection Circles */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                    Alternativas (Clique no círculo para definir o Gabarito Correto):
                  </label>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = Boolean(q.correctAnswer) && q.correctAnswer === opt.label;

                      return (
                        <div
                          key={opt.label}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                            isCorrect
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestion(q.id, { correctAnswer: opt.label as OptionLabel })}
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all cursor-pointer ${
                              isCorrect
                                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900'
                            }`}
                            title={`Marcar opção ${opt.label} como gabarito correto`}
                          >
                            {opt.label}
                          </button>

                          {isEditing ? (
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => handleUpdateOptionText(q.id, optIdx, e.target.value)}
                              className="flex-1 px-3 py-1 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                            />
                          ) : (
                            <span
                              onClick={() => handleUpdateQuestion(q.id, { correctAnswer: opt.label as OptionLabel })}
                              className={`text-xs font-medium flex-1 cursor-pointer select-none ${
                                isCorrect ? 'text-emerald-950 dark:text-emerald-200 font-semibold' : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {opt.text}
                            </span>
                          )}

                          {isCorrect && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Gabarito Correto
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation Text Field */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                    Explicação / Comentários da Questão (Opcional):
                  </label>
                  <textarea
                    rows={2}
                    value={q.explanation || ''}
                    onChange={(e) => handleUpdateQuestion(q.id, { explanation: e.target.value })}
                    placeholder="Escreva a justificativa da resposta ou comentários para ajudar nos estudos..."
                    className="w-full p-3 rounded-xl text-xs bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Manual Question Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleAddQuestion}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Mais Uma Questão Manualmente</span>
        </button>
      </div>

      {/* Bottom Save Action Bar */}
      <div className="sticky bottom-4 mt-8 p-4 rounded-2xl bg-slate-900/90 dark:bg-slate-950/90 text-white backdrop-blur-md shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-xs font-bold">Revisão Concluída?</p>
            <p className="text-[11px] text-slate-400">
              {questions.length} questões prontas para serem salvas no caderno de estudos.
            </p>
          </div>
        </div>

        <button
          onClick={handleConfirmSaveClick}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Salvar no Caderno</span>
        </button>
      </div>
    </div>
  );
};
