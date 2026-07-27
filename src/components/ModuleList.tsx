import React, { useState } from 'react';
import {
  Search,
  Plus,
  BookOpen,
  Filter,
  Sparkles,
  Layers,
  Upload,
} from 'lucide-react';
import { Module, UserAnswer, Question } from '../types';
import { ModuleCard } from './ModuleCard';

interface ModuleListProps {
  modules: Module[];
  questions: Question[];
  userAnswers: UserAnswer[];
  onStartQuiz: (mod: Module) => void;
  onOpenDetail: (mod: Module) => void;
  onDeleteModule: (modId: string) => void;
  onExportModule: (mod: Module) => void;
  onOpenIngest: () => void;
}

export const ModuleList: React.FC<ModuleListProps> = ({
  modules,
  questions,
  userAnswers,
  onStartQuiz,
  onOpenDetail,
  onDeleteModule,
  onExportModule,
  onOpenIngest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  // Extract unique categories
  const categories = ['Todas', ...Array.from(new Set(modules.map((m) => m.category || 'Geral')))];

  // Filter modules
  const filteredModules = modules.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'Todas' || m.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Top Welcome Banner / Hero */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-indigo-200 to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-semibold mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>Extração Inteligente de PDFs e Documentos</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Meus Cadernos de Questões
          </h1>
          <p className="mt-2 text-indigo-200 text-xs sm:text-sm leading-relaxed">
            Anexe seu PDF. A IA lê e organiza apenas as perguntas e alternativas. Depois, você marca o gabarito e escreve a explicação de cada questão para fixar seu estudo.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenIngest}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-lg transition-all transform hover:scale-105 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Anexar Arquivo com IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cadernos por título ou assunto..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-1 flex-shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Matéria:</span>
          </span>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Modules Grid */}
      {filteredModules.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Nenhum caderno encontrado
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            Anexe um arquivo PDF ou imagem para a IA criar seu primeiro banco de questões.
          </p>
          <button
            onClick={onOpenIngest}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold mx-auto shadow-md cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Anexar Primeiro Arquivo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              questions={questions}
              answers={userAnswers}
              onStartQuiz={onStartQuiz}
              onOpenDetail={onOpenDetail}
              onDelete={onDeleteModule}
              onExport={onExportModule}
            />
          ))}
        </div>
      )}
    </div>
  );
};
