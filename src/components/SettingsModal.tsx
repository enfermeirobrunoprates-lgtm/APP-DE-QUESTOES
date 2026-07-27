import React, { useState } from 'react';
import {
  X,
  User,
  Save,
  Download,
  Upload,
  Database,
  Flame,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  LogOut,
} from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsModalProps {
  userProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => void;
  onLogout?: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  userProfile,
  onSaveProfile,
  onExportData,
  onImportData,
  onLogout,
  onClose,
}) => {
  const [name, setName] = useState(userProfile.name);
  const [dailyTarget, setDailyTarget] = useState(userProfile.dailyTarget);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSave = () => {
    onSaveProfile({
      ...userProfile,
      name,
      dailyTarget,
    });
    setStatusMsg('Perfil atualizado com sucesso!');
    setTimeout(() => setStatusMsg(null), 2000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onImportData(text);
        setStatusMsg('Dados importados com sucesso!');
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 max-w-lg w-full overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Configurações do Estudante
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ajuste metas de estudo, perfil e faça backup dos seus cadernos.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {statusMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Profile Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Perfil do Usuário
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Seu Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                E-mail da Conta
              </label>
              <input
                type="text"
                disabled
                value={userProfile.email}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Meta Diária (Questões/dia)
              </label>
              <input
                type="number"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Alterações do Perfil</span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da Conta</span>
                </button>
              )}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-700" />

          {/* Backup & Persistence */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-indigo-500" />
              <span>Backup e Persistência de Dados</span>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Seus dados estão salvos com segurança na sua conta no navegador (IndexedDB). Faça um backup em arquivo para sincronizar com outro dispositivo.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={onExportData}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Backup (JSON)</span>
              </button>

              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Importar Backup (JSON)</span>
                <input
                  type="file"
                  onChange={handleImportFile}
                  accept=".json"
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
