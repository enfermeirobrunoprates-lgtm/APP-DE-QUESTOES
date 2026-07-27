import React, { useState } from 'react';
import { Question, OptionLabel, QuestionOption, MindMapData } from '../types';
import { formatExplanationWithAI, generateMindMapWithAI } from '../services/api';
import { saveQuestion } from '../services/storage';
import {
  X,
  Save,
  Wand2,
  Loader2,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface QuestionEditModalProps {
  question: Question;
  onSaveSuccess: (updated: Question) => void;
  onClose: () => void;
}

export const QuestionEditModal: React.FC<QuestionEditModalProps> = ({
  question,
  onSaveSuccess,
  onClose,
}) => {
  const [stem, setStem] = useState(question.stem);
  const [options, setOptions] = useState<QuestionOption[]>(question.options || []);
  const [correctAnswer, setCorrectAnswer] = useState<OptionLabel>(question.correctAnswer || 'A');
  const [explanation, setExplanation] = useState(question.explanation || '');
  const [mindMap, setMindMap] = useState<MindMapData | undefined>(question.mindMap);

  const [isFormattingExplanation, setIsFormattingExplanation] = useState(false);
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOptionTextChange = (label: OptionLabel, text: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.label === label ? { ...opt, text } : opt))
    );
  };

  const handleFormatExplanation = async () => {
    if (!explanation.trim()) {
      setErrorMsg('Cole ou digite o texto da explicação antes de organizar com IA.');
      return;
    }
    setErrorMsg('');
    setIsFormattingExplanation(true);
    try {
      const formatted = await formatExplanationWithAI(explanation);
      setExplanation(formatted);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao organizar explicação.');
    } finally {
      setIsFormattingExplanation(false);
    }
  };

  const handleGenerateMindMap = async () => {
    if (!explanation.trim()) {
      setErrorMsg('A explicação deve conter texto para poder gerar um mapa mental.');
      return;
    }
    setErrorMsg('');
    setIsGeneratingMindMap(true);
    try {
      const generatedMap = await generateMindMapWithAI(explanation, stem);
      if (generatedMap) {
        setMindMap(generatedMap);
      } else {
        setErrorMsg('O texto da explicação é muito genérico ou curto para gerar um mapa mental útil.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao gerar mapa mental.');
    } finally {
      setIsGeneratingMindMap(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stem.trim()) {
      setErrorMsg('O enunciado da questão é obrigatório.');
      return;
    }
    setErrorMsg('');
    setIsSaving(true);

    const updatedQuestion: Question = {
      ...question,
      stem: stem.trim(),
      options,
      correctAnswer,
      explanation: explanation.trim(),
      mindMap,
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveQuestion(updatedQuestion);
      setIsSaving(false);
      onSaveSuccess(updatedQuestion);
    } catch (err: any) {
      console.error('Erro ao salvar edição da questão:', err);
      setIsSaving(false);
      setErrorMsg(err.message || 'Erro ao salvar alterações da questão.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 my-8 shadow-2xl relative space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Editar Questão</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Edite o enunciado, alternativas, gabarito, explicação e mapa mental.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Stem */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Enunciado da Questão
            </label>
            <textarea
              value={stem}
              onChange={(e) => setStem(e.target.value)}
              rows={4}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
              placeholder="Digite o enunciado da questão..."
            />
          </div>

          {/* Options */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Alternativas de Resposta
            </label>
            <div className="space-y-2.5">
              {options.map((opt) => (
                <div key={opt.label} className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {opt.label}
                  </span>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionTextChange(opt.label, e.target.value)}
                    className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder={`Texto da alternativa ${opt.label}...`}
                  />
                  <button
                    type="button"
                    onClick={() => setCorrectAnswer(opt.label)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      correctAnswer === opt.label
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {correctAnswer === opt.label ? 'Gabarito' : 'Marcar Correta'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation with AI formatting */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Texto de Explicação / Comentário da Resposta
              </label>
              <button
                type="button"
                onClick={handleFormatExplanation}
                disabled={isFormattingExplanation || !explanation.trim()}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isFormattingExplanation ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                <span>Organizar com IA</span>
              </button>
            </div>

            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={4}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
              placeholder="Explicação da resposta (pode conter marcadores, negritos e formatação)..."
            />
          </div>

          {/* Mind Map Generator */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-500" />
                <span>Mapa Mental Gerado por IA</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {mindMap
                  ? `Tema: "${mindMap.centralTopic}" (Gerado)`
                  : 'Gere um diagrama visual dos conceitos principais a partir da explicação.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateMindMap}
              disabled={isGeneratingMindMap || !explanation.trim()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGeneratingMindMap ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{mindMap ? 'Regerar Mapa Mental' : 'Gerar Mapa Mental'}</span>
            </button>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
