import React, { useState } from 'react';
import {
  FileText,
  PlusCircle,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Wand2,
  ArrowRight,
  HelpCircle,
  FolderPlus,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { parseQuestionsWithAI } from '../services/api';
import { parseQuestionsFromText } from '../utils/textParser';
import { DraftIngestionBatch, Module } from '../types';

interface IngestionWorkspaceProps {
  modules: Module[];
  onBatchExtracted: (batch: DraftIngestionBatch) => void;
  onCancel: () => void;
  isOnline?: boolean;
}

export const IngestionWorkspace: React.FC<IngestionWorkspaceProps> = ({
  modules,
  onBatchExtracted,
  onCancel,
}) => {
  const [pastedText, setPastedText] = useState('');
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>('new');
  const [newNotebookTitle, setNewNotebookTitle] = useState('Novo Caderno de Questões');
  const [newNotebookCategory, setNewNotebookCategory] = useState('Geral');

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleOrganizeQuestions = async () => {
    setErrorMessage(null);
    setSuccessCount(null);

    if (!pastedText || !pastedText.trim()) {
      setErrorMessage('Por favor, cole o texto das questões antes de organizar.');
      return;
    }

    setIsProcessing(true);

    try {
      const res = await parseQuestionsWithAI(pastedText);
      let parsedQuestions = res.questions;

      // Fallback if AI returns empty array for some reason
      if (!parsedQuestions || parsedQuestions.length === 0) {
        parsedQuestions = parseQuestionsFromText(pastedText);
      }

      if (!parsedQuestions || parsedQuestions.length === 0) {
        setErrorMessage(
          'Não foi possível identificar nenhuma questão no texto fornecido. Verifique se o texto possui enunciados e alternativas (A, B, C, D, E).'
        );
        setIsProcessing(false);
        return;
      }

      setSuccessCount(parsedQuestions.length);

      let title = newNotebookTitle.trim() || 'Novo Caderno de Questões';
      let category = newNotebookCategory.trim() || 'Geral';
      let targetModuleId: string | undefined = undefined;

      if (selectedNotebookId !== 'new') {
        const existingMod = modules.find((m) => m.id === selectedNotebookId);
        if (existingMod) {
          title = existingMod.title;
          category = existingMod.category;
          targetModuleId = existingMod.id;
        }
      }

      const batch: DraftIngestionBatch = {
        suggestedTitle: title,
        suggestedCategory: category,
        questions: parsedQuestions,
        targetModuleId,
      };

      setTimeout(() => {
        setIsProcessing(false);
        onBatchExtracted(batch);
      }, 300);
    } catch (err: any) {
      console.error('Erro na estruturação por IA:', err);
      // Fallback attempt with local parser if AI fails or network error occurs
      const localQuestions = parseQuestionsFromText(pastedText);
      if (localQuestions && localQuestions.length > 0) {
        let title = newNotebookTitle.trim() || 'Novo Caderno de Questões';
        let category = newNotebookCategory.trim() || 'Geral';
        let targetModuleId: string | undefined = undefined;

        if (selectedNotebookId !== 'new') {
          const existingMod = modules.find((m) => m.id === selectedNotebookId);
          if (existingMod) {
            title = existingMod.title;
            category = existingMod.category;
            targetModuleId = existingMod.id;
          }
        }

        const batch: DraftIngestionBatch = {
          suggestedTitle: title,
          suggestedCategory: category,
          questions: localQuestions,
          targetModuleId,
        };

        setIsProcessing(false);
        onBatchExtracted(batch);
        return;
      }

      setErrorMessage(
        err.message || 'Erro ao estruturar questões com IA. Verifique sua conexão e tente novamente.'
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-3">
          <Wand2 className="w-3.5 h-3.5" />
          <span>Organização Determinística Instantânea</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Adicionar Questões por Texto
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-400 max-w-2xl">
          Cole o texto da sua prova, simulado ou exercício. O sistema organizará o enunciado e
          as alternativas instantaneamente, de forma local e 100% gratuita.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 space-y-6">
        
        {/* Notebook Destination Selector */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Adicionar ao caderno:</span>
            </label>
            <select
              value={selectedNotebookId}
              onChange={(e) => setSelectedNotebookId(e.target.value)}
              className="w-full sm:w-72 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="new">+ Criar novo caderno</option>
              {modules.map((mod) => (
                <option key={mod.id} value={mod.id}>
                  {mod.title} ({mod.questionCount} questões)
                </option>
              ))}
            </select>
          </div>

          {/* If 'new' selected, show inputs for Title & Category */}
          {selectedNotebookId === 'new' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700/60">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nome do novo caderno:
                </label>
                <div className="relative">
                  <FolderPlus className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={newNotebookTitle}
                    onChange={(e) => setNewNotebookTitle(e.target.value)}
                    placeholder="Ex: Prova de Direito Constitucional"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Categoria / Matéria:
                </label>
                <input
                  type="text"
                  value={newNotebookCategory}
                  onChange={(e) => setNewNotebookCategory(e.target.value)}
                  placeholder="Ex: Concursos / OAB"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Text Input Area */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Cole o texto das questões:</span>
            </label>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {pastedText.length} caracteres
            </span>
          </div>

          <textarea
            value={pastedText}
            onChange={(e) => {
              setPastedText(e.target.value);
              setErrorMessage(null);
            }}
            rows={12}
            placeholder={`Cole aqui o texto contendo uma ou mais questões.

Exemplo de estrutura aceita:

1. Qual é a capital do Brasil?
a) Rio de Janeiro
b) Brasília
c) São Paulo
d) Salvador

2. Quantos estados possui o Brasil?
a) 24
b) 25
c) 26
d) 27`}
            className="w-full p-4 text-sm font-mono bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-y leading-relaxed"
          />
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Success Feedback Badge */}
        {successCount !== null && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <p className="font-semibold">
              {successCount} questão(ões) organizada(s) com sucesso a partir do texto colado!
            </p>
          </div>
        )}

        {/* Loading Indicator for AI Processing */}
        {isProcessing && (
          <div className="p-5 bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-indigo-900 dark:text-indigo-200 text-sm flex items-center gap-4 animate-pulse">
            <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Estruturando questões com IA (Gemini)...</p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                Identificando enunciados, organizando alternativas A-E e extraindo informações do texto colado.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleOrganizeQuestions}
            disabled={!pastedText.trim() || isProcessing}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando com IA...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Adicionar / Processar com IA</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Help Tip */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Dica de formatação:</strong> O organizador reconhece automaticamente
            numerações como <code>1.</code>, <code>01)</code>, <code>Questão 1</code> e
            alternativas no formato <code>a)</code>, <code>A.</code>, <code>b-</code>. Na tela
            seguinte você poderá revisar e marcar os gabaritos corretos.
          </p>
        </div>
      </div>
    </div>
  );
};
