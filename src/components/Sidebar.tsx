import React from 'react';
import {
  Sparkles,
  BookOpen,
  Upload,
  RotateCcw,
  BarChart3,
  Settings,
  Plus,
  Layers,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { ActiveTab, Module } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  modules: Module[];
  onStartQuiz: (mod: Module) => void;
  onOpenIngest: () => void;
  errCount: number;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  modules,
  onStartQuiz,
  onOpenIngest,
  errCount,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  // Dot colors for recent modules list
  const dotColors = [
    'bg-emerald-500',
    'bg-indigo-500',
    'bg-amber-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-cyan-500',
  ];

  const sidebarContent = (
    <div className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between h-full p-4 overflow-y-auto">
      {/* Brand & Logo */}
      <div>
        <div
          onClick={() => {
            setActiveTab('modules');
            setIsOpenMobile(false);
          }}
          className="flex items-center gap-3 px-2 py-3 mb-6 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-tight">StudyForge</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
                IA
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Cadernos Inteligentes</p>
          </div>
        </div>

        {/* Navigation Group: Main */}
        <div className="mb-6 space-y-1">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Navegação Principal
          </div>

          <button
            onClick={() => {
              setActiveTab('modules');
              setIsOpenMobile(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
              activeTab === 'modules'
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4" />
              <span>Meus Cadernos</span>
            </div>
            {modules.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                {modules.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onOpenIngest();
              setIsOpenMobile(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
              activeTab === 'ingest'
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Upload className="w-4 h-4" />
              <span>Anexar Arquivo IA</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-300">
              PDF/DOCX
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('caderno_erros');
              setIsOpenMobile(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
              activeTab === 'caderno_erros'
                ? 'bg-rose-600/15 text-rose-400 border border-rose-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>Caderno de Erros</span>
            </div>
            {errCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                {errCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('stats');
              setIsOpenMobile(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
              activeTab === 'stats'
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4" />
              <span>Desempenho</span>
            </div>
          </button>
        </div>

        {/* Section Group: Recent Cadernos */}
        {modules.length > 0 && (
          <div className="mb-6 space-y-1">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
              <span>Cadernos Recentes</span>
              <Layers className="w-3 h-3 text-slate-600" />
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {modules.slice(0, 5).map((mod, idx) => (
                <button
                  key={mod.id}
                  onClick={() => {
                    onStartQuiz(mod);
                    setIsOpenMobile(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-slate-800/80 text-slate-300 hover:text-white transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColors[idx % dotColors.length]}`} />
                    <span className="truncate font-medium">{mod.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-400 flex-shrink-0 ml-1">
                    {mod.questionCount}q
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Primary Action Button & Settings */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <button
          onClick={() => {
            onOpenIngest();
            setIsOpenMobile(false);
          }}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/60 transition-all text-xs cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Anexar Arquivo IA</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('settings');
            setIsOpenMobile(false);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-slate-800 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configurações & Backup</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block flex-shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setIsOpenMobile(false)}
          />
          <div className="relative z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
