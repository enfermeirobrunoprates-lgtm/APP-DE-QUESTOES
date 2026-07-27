import React from 'react';
import {
  BarChart3,
  Award,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Target,
  TrendingUp,
  Brain,
  BookOpen,
} from 'lucide-react';
import { UserAnswer, Module, UserProfile } from '../types';

interface StatsViewProps {
  userAnswers: UserAnswer[];
  modules: Module[];
  userProfile: UserProfile;
}

export const StatsView: React.FC<StatsViewProps> = ({
  userAnswers,
  modules,
  userProfile,
}) => {
  const totalAnswered = userAnswers.length;
  const correctAnswers = userAnswers.filter((a) => a.isCorrect);
  const incorrectAnswers = userAnswers.filter((a) => !a.isCorrect);

  const overallAccuracy = totalAnswered > 0 ? Math.round((correctAnswers.length / totalAnswered) * 100) : 0;

  // Compute stats by category
  const categoryStatsMap = new Map<string, { total: number; correct: number }>();

  userAnswers.forEach((ans) => {
    const mod = modules.find((m) => m.id === ans.moduleId);
    const cat = mod?.category || 'Geral';

    const current = categoryStatsMap.get(cat) || { total: 0, correct: 0 };
    current.total += 1;
    if (ans.isCorrect) current.correct += 1;
    categoryStatsMap.set(cat, current);
  });

  const categoryList = Array.from(categoryStatsMap.entries()).map(([cat, stat]) => ({
    category: cat,
    total: stat.total,
    correct: stat.correct,
    accuracy: Math.round((stat.correct / stat.total) * 100),
  }));

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-8">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Seu Desempenho & Estatísticas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe a precisão dos seus estudos, ofensiva diária e áreas de maior aproveitamento.
          </p>
        </div>

        {/* Level / XP Pill */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
            L{userProfile.level}
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-purple-950 dark:text-purple-200">
              <span>Nível {userProfile.level}</span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400">{userProfile.xp} XP</span>
            </div>
            <div className="w-32 h-1.5 bg-purple-200 dark:bg-purple-900 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full"
                style={{ width: `${(userProfile.xp % 200) / 2}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Answered */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Respondido</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3">
            {totalAnswered}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Questões resolvidas nos cadernos
          </p>
        </div>

        {/* Metric 2: Accuracy Rate */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Taxa de Acerto</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3">
            {overallAccuracy}%
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
            {correctAnswers.length} certas / {incorrectAnswers.length} erradas
          </p>
        </div>

        {/* Metric 3: Streak Days */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Ofensiva Atual</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
              <Flame className="w-4 h-4 animate-bounce" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3">
            {userProfile.streakDays} {userProfile.streakDays === 1 ? 'dia' : 'dias'}
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
            Consecutivos estudando
          </p>
        </div>

        {/* Metric 4: Daily Goal */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Meta Diária</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3">
            {userProfile.dailyTarget} Qs/dia
          </p>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
            Alvo configurado
          </p>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          <span>Aproveitamento por Matéria / Disciplina</span>
        </h3>

        {categoryList.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
            Ainda não há dados suficientes. Responda a algumas questões para visualizar seu mapa de aproveitamento.
          </p>
        ) : (
          <div className="space-y-4">
            {categoryList.map((item) => (
              <div key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">{item.category}</span>
                  <span className={`font-bold ${item.accuracy >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {item.accuracy}% ({item.correct}/{item.total} acertos)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.accuracy >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${item.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Recommendation Box */}
      <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-indigo-600 text-white flex-shrink-0">
          <Brain className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
            Recomendação de Estudo da IA:
          </h4>
          <p className="text-xs text-indigo-900/80 dark:text-indigo-300/80 mt-1 leading-relaxed">
            {overallAccuracy >= 80
              ? 'Seu aproveitamento geral está altíssimo! Recomendamos avançar para cadernos com nível de dificuldade "Difícil" ou gerar questões inéditas simulando bancas mais exigentes.'
              : 'Você tem um bom ritmo. Priorize o Caderno de Erros para zerar suas dúvidas nas matérias com taxa de acerto inferior a 70%.'}
          </p>
        </div>
      </div>
    </div>
  );
};
