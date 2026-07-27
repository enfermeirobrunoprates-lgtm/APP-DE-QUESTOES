import React, { useState } from 'react';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  CheckCircle2,
  Brain,
  LogIn,
  UserPlus,
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { syncUserDataToFirestoreIfNew } from '../services/storage';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

function getFirebaseErrorMessage(error: any): string {
  const code = error?.code || '';
  if (code === 'auth/email-already-in-use') {
    return 'Este e-mail já está cadastrado. Faça login ou utilize outro e-mail.';
  }
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'E-mail ou senha incorretos. Por favor, verifique seus dados.';
  }
  if (code === 'auth/user-not-found') {
    return 'Usuário não encontrado. Verifique o e-mail ou cadastre-se.';
  }
  if (code === 'auth/weak-password') {
    return 'A senha deve conter no mínimo 6 caracteres.';
  }
  if (code === 'auth/invalid-email') {
    return 'O formato do e-mail digitado é inválido.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'A janela de autenticação foi fechada antes de concluir.';
  }
  return error?.message || 'Falha na autenticação. Tente novamente.';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Por favor, preencha o e-mail e a senha.');
      return;
    }

    if (isSignUp && !name.trim()) {
      setErrorMsg('Por favor, informe seu nome.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim() && userCredential.user) {
          await updateProfile(userCredential.user, { displayName: name.trim() });
        }
        await syncUserDataToFirestoreIfNew(userCredential.user.uid);
        const profile: UserProfile = {
          name: name.trim() || email.split('@')[0],
          email: userCredential.user.email || email,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
          dailyTarget: 20,
          streakDays: 1,
          lastActiveDate: new Date().toISOString().split('T')[0],
          xp: 150,
          level: 1,
        };
        setIsLoading(false);
        onLoginSuccess(profile);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        await syncUserDataToFirestoreIfNew(userCredential.user.uid);
        const profile: UserProfile = {
          name: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'Estudante Focado',
          email: userCredential.user.email || email,
          avatarUrl: userCredential.user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
          dailyTarget: 20,
          streakDays: 1,
          lastActiveDate: new Date().toISOString().split('T')[0],
          xp: 200,
          level: 1,
        };
        setIsLoading(false);
        onLoginSuccess(profile);
      }
    } catch (err: any) {
      console.error('Erro na autenticação:', err);
      setIsLoading(false);
      setErrorMsg(getFirebaseErrorMessage(err));
    }
  };

  const handleGoogleOAuth = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await syncUserDataToFirestoreIfNew(userCredential.user.uid);
      const googleUser: UserProfile = {
        name: userCredential.user.displayName || 'Estudante Google',
        email: userCredential.user.email || '',
        avatarUrl: userCredential.user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        dailyTarget: 20,
        streakDays: 3,
        lastActiveDate: new Date().toISOString().split('T')[0],
        xp: 350,
        level: 2,
      };
      setIsLoading(false);
      onLoginSuccess(googleUser);
    } catch (err: any) {
      console.error('Erro ao autenticar com Google:', err);
      setIsLoading(false);
      setErrorMsg(getFirebaseErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-600/30 mb-2">
            <Sparkles className="w-7 h-7" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
            StudyForge IA
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            Anexe PDFs, organize perguntas automaticamente e estude com o seu próprio caderno inteligente.
          </p>
        </div>

        {/* Feature Highlights Pill */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-300 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>IA Leitora de PDFs</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>Salvo na Nuvem</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>Edição com Autosave</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Suporte Offline</span>
          </div>
        </div>

        {/* Auth Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 backdrop-blur-xl">
          
          {/* Header Switch */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {isSignUp ? <UserPlus className="w-4 h-4 text-indigo-400" /> : <LogIn className="w-4 h-4 text-indigo-400" />}
              <span>{isSignUp ? 'Criar Nova Conta' : 'Acessar Minha Conta'}</span>
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {isSignUp ? 'Já tem conta? Entrar' : 'Novo por aqui? Criar'}
            </button>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleOAuth}
            disabled={isLoading}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md text-xs sm:text-sm active:scale-98 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar com o Google</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ou e-mail</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Seu Nome Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Ana Souza"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-2.5 pl-10 pr-3 text-xs focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Seu E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@exemplo.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-2.5 pl-10 pr-3 text-xs focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Sua Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-2.5 pl-10 pr-3 text-xs focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/80 transition-all cursor-pointer text-xs sm:text-sm mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Criar Conta e Entrar' : 'Entrar no StudyForge'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-500">
          Garantia de privacidade. Seus cadernos e questões são vinculados e sincronizados com a sua conta.
        </p>
      </div>
    </div>
  );
};
