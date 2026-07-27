import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { syncUserDataToFirestoreIfNew } from './services/storage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ModuleList } from './components/ModuleList';
import { QuizPlayer } from './components/QuizPlayer';
import { IngestionWorkspace } from './components/IngestionWorkspace';
import { ReviewDraftModal } from './components/ReviewDraftModal';
import { CadernoDeErros } from './components/CadernoDeErros';
import { StatsView } from './components/StatsView';
import { ModuleDetailModal } from './components/ModuleDetailModal';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthScreen } from './components/AuthScreen';

import {
  getModules,
  saveModule,
  deleteModule,
  getQuestionsByModule,
  getAllQuestions,
  saveQuestion,
  saveBatchQuestions,
  deleteQuestion,
  removeQuestionFromErrorLog,
  getUserAnswers,
  saveUserAnswer,
  getFlaggedQuestions,
  toggleFlagQuestion,
  getUserProfile,
  saveUserProfile,
  exportDataJSON,
  importDataJSON,
} from './services/storage';

import {
  Module,
  Question,
  UserAnswer,
  UserProfile,
  DraftIngestionBatch,
  DraftQuestion,
  ActiveTab,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('modules');

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('studyforge_auth_user');
  });

  // Database State
  const [modules, setModules] = useState<Module[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Estudante Focado',
    email: 'estudante@studyforge.app',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    dailyTarget: 20,
    streakDays: 3,
    lastActiveDate: new Date().toISOString().split('T')[0],
    xp: 450,
    level: 2,
  });

  // Active Context State (Quiz, Ingestion Draft, Modal Popups)
  const [activeQuizModule, setActiveQuizModule] = useState<Module | null>(null);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);

  const [activeDraftBatch, setActiveDraftBatch] = useState<DraftIngestionBatch | null>(null);

  const [detailModule, setDetailModule] = useState<Module | null>(null);
  const [exportModule, setExportModule] = useState<Module | null>(null);

  // App Theme, Connectivity & Mobile Sidebar
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Load initial data from IndexedDB
  const refreshDatabase = async () => {
    try {
      const mods = await getModules();
      const qs = await getAllQuestions();
      const ans = await getUserAnswers();
      const flags = await getFlaggedQuestions();
      const profile = await getUserProfile();

      setModules(mods);
      setQuestions(qs);
      setUserAnswers(ans);
      setFlaggedIds(flags.map((f) => f.questionId));

      // Restore saved profile if available in localStorage or IDB
      const savedAuthStr = localStorage.getItem('studyforge_auth_user');
      if (savedAuthStr) {
        try {
          const parsed = JSON.parse(savedAuthStr);
          setUserProfile(parsed);
        } catch (e) {
          setUserProfile(profile);
        }
      } else {
        setUserProfile(profile);
      }
    } catch (err) {
      console.error('Erro ao carregar banco de dados IndexedDB:', err);
    }
  };

  useEffect(() => {
    refreshDatabase();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Synchronize dark mode class on HTML root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Auth State Subscription
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        await syncUserDataToFirestoreIfNew(user.uid);
        const profile: UserProfile = {
          name: user.displayName || user.email?.split('@')[0] || 'Estudante Focado',
          email: user.email || 'estudante@studyforge.app',
          avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || 'user')}`,
          dailyTarget: 20,
          streakDays: 3,
          lastActiveDate: new Date().toISOString().split('T')[0],
          xp: 450,
          level: 2,
        };
        setUserProfile(profile);
        localStorage.setItem('studyforge_auth_user', JSON.stringify(profile));
        await refreshDatabase();
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem('studyforge_auth_user');
      }
    });
    return () => unsubscribe();
  }, []);

  // Auth Handlers
  const handleLoginSuccess = async (profile: UserProfile) => {
    localStorage.setItem('studyforge_auth_user', JSON.stringify(profile));
    await saveUserProfile(profile);
    setUserProfile(profile);
    setIsAuthenticated(true);
    await refreshDatabase();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Erro ao sair:', e);
    }
    localStorage.removeItem('studyforge_auth_user');
    setIsAuthenticated(false);
  };

  // Quiz Player Start Handler
  const handleStartQuiz = async (mod: Module) => {
    const modQuestions = questions.filter((q) => q.moduleId === mod.id);
    if (modQuestions.length === 0) {
      alert('Este caderno ainda não possui questões.');
      return;
    }
    setActiveQuizModule(mod);
    setActiveQuizQuestions(modQuestions);
    setActiveTab('modules');
  };

  const handleFinishQuiz = async (answers: UserAnswer[]) => {
    for (const ans of answers) {
      await saveUserAnswer(ans);
    }
    setActiveQuizModule(null);
    setActiveQuizQuestions([]);
    await refreshDatabase();
  };

  // Draft Batch Extracted Handler (from IngestionWorkspace)
  const handleBatchExtracted = (batch: DraftIngestionBatch) => {
    setActiveDraftBatch(batch);
  };

  // Confirm Save Draft to Module in IndexedDB
  const handleConfirmSaveDraft = async (
    title: string,
    category: string,
    draftQuestions: DraftQuestion[],
    targetModuleIdOverride?: string
  ) => {
    const targetModuleId = targetModuleIdOverride || activeDraftBatch?.targetModuleId;
    const existingModule = targetModuleId ? modules.find((m) => m.id === targetModuleId) : null;

    let targetModule: Module;
    let formattedQuestions: Question[] = [];

    if (existingModule) {
      targetModule = {
        ...existingModule,
        title: title.trim() || existingModule.title,
        category: category.trim() || existingModule.category,
        questionCount: existingModule.questionCount + draftQuestions.length,
        updatedAt: new Date().toISOString(),
      };

      const existingQuestions = questions.filter((q) => q.moduleId === existingModule.id);
      formattedQuestions = draftQuestions.map((dq, idx) => ({
        id: `q-${existingModule.id}-${Date.now()}-${idx}`,
        moduleId: existingModule.id,
        stem: dq.stem,
        options: dq.options.map((o, optIdx) => ({
          id: `opt-${existingQuestions.length + idx}-${optIdx}`,
          label: o.label,
          text: o.text,
        })),
        correctAnswer: dq.correctAnswer,
        explanation: dq.explanation,
        breakdown: dq.breakdown,
        sources: dq.sources,
        difficulty: dq.difficulty,
        tags: dq.tags,
        isCustomAiSolved: dq.isCustomAiSolved,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await saveModule(targetModule);
      await saveBatchQuestions(existingModule.id, formattedQuestions);
    } else {
      const moduleId = `mod-${Date.now()}`;
      targetModule = {
        id: moduleId,
        title: title.trim() || 'Novo Caderno de Questões',
        description: `Caderno com ${draftQuestions.length} questões.`,
        category: category.trim() || 'Geral',
        questionCount: draftQuestions.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      formattedQuestions = draftQuestions.map((dq, idx) => ({
        id: `q-${moduleId}-${idx}`,
        moduleId,
        stem: dq.stem,
        options: dq.options.map((o, optIdx) => ({
          id: `opt-${idx}-${optIdx}`,
          label: o.label,
          text: o.text,
        })),
        correctAnswer: dq.correctAnswer,
        explanation: dq.explanation,
        breakdown: dq.breakdown,
        sources: dq.sources,
        difficulty: dq.difficulty,
        tags: dq.tags,
        isCustomAiSolved: dq.isCustomAiSolved,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await saveModule(targetModule);
      await saveBatchQuestions(moduleId, formattedQuestions);
    }

    setActiveDraftBatch(null);
    await refreshDatabase();

    // Fetch full updated list for quiz launch
    const updatedQs = await getQuestionsByModule(targetModule.id);
    setActiveQuizModule(targetModule);
    setActiveQuizQuestions(updatedQs);
    setActiveTab('modules');
  };

  // Flag toggle handler
  const handleToggleFlag = async (qId: string) => {
    const flagged = await toggleFlagQuestion(qId);
    if (flagged) {
      setFlaggedIds((prev) => [...prev, qId]);
    } else {
      setFlaggedIds((prev) => prev.filter((id) => id !== qId));
    }
  };

  // Module & Question deletion handlers
  const handleDeleteModule = async (modId: string) => {
    try {
      await deleteModule(modId);
      if (detailModule?.id === modId) setDetailModule(null);
      if (activeQuizModule?.id === modId) setActiveQuizModule(null);
      if (exportModule?.id === modId) setExportModule(null);
      await refreshDatabase();
    } catch (err: any) {
      console.error('Erro ao excluir caderno:', err);
      alert('Ocorreu um erro ao excluir o caderno: ' + (err?.message || 'Falha no banco de dados.'));
    }
  };

  const handleDeleteQuestion = async (qId: string, modId: string) => {
    try {
      await deleteQuestion(qId, modId);
      if (detailModule && detailModule.id === modId) {
        setDetailModule((prev) =>
          prev ? { ...prev, questionCount: Math.max(0, prev.questionCount - 1) } : null
        );
      }
      await refreshDatabase();
    } catch (err: any) {
      console.error('Erro ao excluir questão:', err);
      alert('Ocorreu um erro ao excluir a questão: ' + (err?.message || 'Falha no banco de dados.'));
    }
  };

  const handleRemoveFromErrors = async (qId: string) => {
    try {
      await removeQuestionFromErrorLog(qId);
      await refreshDatabase();
    } catch (err: any) {
      console.error('Erro ao remover erro:', err);
      alert('Ocorreu um erro ao remover da lista de erros: ' + (err?.message || 'Falha no banco de dados.'));
    }
  };

  // Backup handlers
  const handleExportBackup = async () => {
    const jsonStr = await exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyForge_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportBackup = async (jsonStr: string) => {
    const success = await importDataJSON(jsonStr);
    if (success) {
      await refreshDatabase();
    } else {
      alert('Arquivo de backup inválido.');
    }
  };

  // Compute total missed questions count for header badge
  const latestAnswersMap = new Map<string, UserAnswer>();
  userAnswers.forEach((ans) => {
    const existing = latestAnswersMap.get(ans.questionId);
    if (!existing || new Date(ans.answeredAt) > new Date(existing.answeredAt)) {
      latestAnswersMap.set(ans.questionId, ans);
    }
  });

  let missedCount = 0;
  latestAnswersMap.forEach((ans) => {
    if (!ans.isCorrect) missedCount++;
  });

  // REQUIREMENT 2.1: Render Auth Screen first if not logged in
  if (!isAuthenticated) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col md:flex-row">
      
      {/* Sleek Dark Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        modules={modules}
        onStartQuiz={handleStartQuiz}
        onOpenIngest={() => {
          setActiveDraftBatch(null);
          setActiveTab('ingest');
        }}
        errCount={missedCount}
        isOpenMobile={isMobileSidebarOpen}
        setIsOpenMobile={setIsMobileSidebarOpen}
      />

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        
        {/* Top Header Bar */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userProfile={userProfile}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          isOnline={isOnline}
          onOpenIngest={() => {
            setActiveDraftBatch(null);
            setActiveTab('ingest');
          }}
          errCount={missedCount}
          userAnswers={userAnswers}
          activeQuizTitle={activeQuizModule?.title}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        />

        {/* Main Workspace Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          
          {/* ACTIVE QUIZ PLAYER VIEW */}
          {activeQuizModule ? (
            <QuizPlayer
              module={activeQuizModule}
              questions={activeQuizQuestions}
              onFinishQuiz={handleFinishQuiz}
              onBack={() => {
                setActiveQuizModule(null);
                setActiveQuizQuestions([]);
              }}
              onToggleFlag={handleToggleFlag}
              flaggedIds={flaggedIds}
            />
          ) : activeDraftBatch ? (
            /* HUMAN REVIEW DRAFT STEP */
            <ReviewDraftModal
              draftBatch={activeDraftBatch}
              modules={modules}
              onConfirmSave={handleConfirmSaveDraft}
              onCancel={() => setActiveDraftBatch(null)}
            />
          ) : (
            <>
              {/* TAB 1: MODULES LIST */}
              {activeTab === 'modules' && (
                <ModuleList
                  modules={modules}
                  questions={questions}
                  userAnswers={userAnswers}
                  onStartQuiz={handleStartQuiz}
                  onOpenDetail={(mod) => setDetailModule(mod)}
                  onDeleteModule={handleDeleteModule}
                  onExportModule={(mod) => setExportModule(mod)}
                  onOpenIngest={() => setActiveTab('ingest')}
                />
              )}

              {/* TAB 2: INGESTION WORKSPACE */}
              {activeTab === 'ingest' && (
                <IngestionWorkspace
                  modules={modules}
                  onBatchExtracted={handleBatchExtracted}
                  onCancel={() => setActiveTab('modules')}
                  isOnline={isOnline}
                />
              )}

              {/* TAB 3: CADERNO DE ERROS */}
              {activeTab === 'caderno_erros' && (
                <CadernoDeErros
                  questions={questions}
                  userAnswers={userAnswers}
                  modules={modules}
                  onFinishQuiz={handleFinishQuiz}
                  onToggleFlag={handleToggleFlag}
                  flaggedIds={flaggedIds}
                  onRemoveFromErrors={handleRemoveFromErrors}
                  onDeleteQuestion={handleDeleteQuestion}
                />
              )}

              {/* TAB 4: STATS & ANALYTICS */}
              {activeTab === 'stats' && (
                <StatsView
                  userAnswers={userAnswers}
                  modules={modules}
                  userProfile={userProfile}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* MODAL 1: MODULE DETAIL & QUESTION EDITOR */}
      {detailModule && (
        <ModuleDetailModal
          module={detailModule}
          questions={questions.filter((q) => q.moduleId === detailModule.id)}
          onSaveQuestion={async (q) => {
            await saveQuestion(q);
            await refreshDatabase();
          }}
          onDeleteQuestion={async (qId) => {
            await handleDeleteQuestion(qId, detailModule.id);
          }}
          onUpdateModuleInfo={async (title, category) => {
            const updated = { ...detailModule, title, category, updatedAt: new Date().toISOString() };
            await saveModule(updated);
            setDetailModule(updated);
            await refreshDatabase();
          }}
          onClose={() => setDetailModule(null)}
          onExport={() => {
            setExportModule(detailModule);
            setDetailModule(null);
          }}
        />
      )}

      {/* MODAL 2: EXPORT PRINTABLE STUDY GUIDE */}
      {exportModule && (
        <ExportModal
          module={exportModule}
          questions={questions.filter((q) => q.moduleId === exportModule.id)}
          onClose={() => setExportModule(null)}
        />
      )}

      {/* MODAL 3: SETTINGS & BACKUP */}
      {activeTab === 'settings' && (
        <SettingsModal
          userProfile={userProfile}
          onSaveProfile={async (profile) => {
            await saveUserProfile(profile);
            setUserProfile(profile);
            localStorage.setItem('studyforge_auth_user', JSON.stringify(profile));
          }}
          onExportData={handleExportBackup}
          onImportData={handleImportBackup}
          onLogout={handleLogout}
          onClose={() => setActiveTab('modules')}
        />
      )}
    </div>
  );
}
