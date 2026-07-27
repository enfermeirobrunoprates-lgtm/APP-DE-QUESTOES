import React from 'react';
import {
  Sparkles,
  BookOpen,
  RotateCcw,
  BarChart3,
  Settings,
  Flame,
  Zap,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Upload,
  Menu,
  X,
  Target,
  Layers,
} from 'lucide-react';
import { ActiveTab, UserProfile, UserAnswer } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userProfile: UserProfile;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  isOnline: boolean;
  onOpenIngest: () => void;
  errCount: number;
  userAnswers: UserAnswer[];
  activeQuizTitle?: string;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  isDarkMode,
  setIsDarkMode,
  isOnline,
  onOpenIngest,
  errCount,
  userAnswers,
  activeQuizTitle,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
}) => {
  // Compute overall accuracy percentage
  const totalAnswers = userAnswers.length;
  const correctAnswers = userAnswers.filter((a) => a.isCorrect).length;
  const overallAccuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

  // Contextual Title based on activeTab
  const getContextTitle = () => {
    if (activeQuizTitle) return activeQuizTitle;
    switch (activeTab) {
      case 'modules':
        return 'Meus Cadernos de Questões';
      case 'ingest':
        return 'Anexar Arquivo Bruto com IA';
      case 'caderno_erros':
        return 'Caderno de Erros';
      case 'stats':
        return 'Painel de Desempenho e Estatísticas';
      case 'settings':
        return 'Configurações e Backup de Dados';
      default:
        return 'StudyForge IA';
    }
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/80 px-4 sm:px-8 flex items-center justify-between transition-colors">
      
      {/* Left Context & Mobile Sidebar Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="md:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Abrir Menu Lateral"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-3">
          <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
            {getContextTitle()}
          </h1>

          {/* Online/Offline Status Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
            }`}
            title={isOnline ? 'IA Gemini Ativa (Correções e Explicações)' : 'Modo Local Offline'}
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isOnline ? 'IA Online' : 'Modo Offline'}</span>
          </div>
        </div>
      </div>

      {/* Right Gamification Metrics & User Controls */}
      <div className="flex items-center gap-2.5">
        
        {/* Overall Accuracy Metric */}
        {totalAnswers > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold">
            <Target className="w-3.5 h-3.5 text-emerald-500" />
            <span>{overallAccuracy}% Acertos</span>
          </div>
        )}

        {/* Streak Counter */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold">
          <Flame className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
          <span>{userProfile.streakDays}d</span>
        </div>

        {/* Level Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">
          <Zap className="w-3.5 h-3.5 text-purple-500" />
          <span>Nível {userProfile.level}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
          title={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Profile Avatar */}
        <div
          onClick={() => setActiveTab('settings')}
          className="w-8 h-8 rounded-full ring-2 ring-indigo-500/30 overflow-hidden cursor-pointer hover:scale-105 transition-transform"
          title={`Logado como ${userProfile.name} - Clique para Configurações`}
        >
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
};

