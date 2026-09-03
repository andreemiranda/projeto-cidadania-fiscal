'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  X,
  Key,
  Mail,
  ArrowRight,
  Info,
} from 'lucide-react';

interface AuthGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorCode: string | null;
  errorMessage: string | null;
  projectId?: string;
  onSelectAccount: (email: string, name: string) => void;
}

export default function AuthGuidanceModal({
  isOpen,
  onClose,
  errorCode,
  errorMessage,
  projectId = 'trabalho-academico-form',
  onSelectAccount,
}: AuthGuidanceModalProps) {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  if (!isOpen) return null;

  const isConfigNotFound =
    errorCode === 'auth/configuration-not-found' ||
    errorMessage?.includes('configuration-not-found') ||
    errorCode === 'auth/operation-not-allowed';

  const isUnauthorizedDomain =
    errorCode === 'auth/unauthorized-domain' ||
    errorMessage?.includes('unauthorized-domain');

  const firebaseConsoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/providers`;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const name = customName.trim() || customEmail.split('@')[0];
    onSelectAccount(customEmail.trim(), name);
    onClose();
  };

  return (
    <div
      id="auth-guidance-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            {isConfigNotFound ? (
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Key className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {isConfigNotFound
                  ? 'Ativação do Provedor Google no Firebase'
                  : 'Autenticação do Sistema'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Projeto Firebase: <span className="font-mono font-semibold">{projectId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm">
          {/* Diagnostic Banner if auth/configuration-not-found */}
          {isConfigNotFound && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-900 text-xs">
                    Erro: auth/configuration-not-found
                  </p>
                  <p className="text-amber-800 text-xs leading-relaxed">
                    O provedor de login Google ainda não foi habilitado no painel do Firebase Console para o projeto <strong>{projectId}</strong>.
                  </p>
                </div>
              </div>

              {/* Instructions steps */}
              <div className="pt-2 border-t border-amber-200/60 text-xs text-amber-900 space-y-2">
                <p className="font-semibold">Como ativar no Firebase Console (apenas 1 minuto):</p>
                <ol className="list-decimal list-inside space-y-1 text-amber-800 pl-1 text-[11px] sm:text-xs">
                  <li>
                    Acesse o console do Firebase em{' '}
                    <strong>Authentication &gt; Sign-in method</strong>.
                  </li>
                  <li>
                    Clique no provedor <strong>Google</strong> na lista de métodos de login.
                  </li>
                  <li>
                    Ative a opção <strong>Ativar (Enable)</strong>, informe o e-mail de suporte do projeto (ex: <code className="bg-amber-100 px-1 py-0.5 rounded">suporte.camarapa@gmail.com</code>) e clique em <strong>Salvar</strong>.
                  </li>
                </ol>
                <div className="pt-1">
                  <a
                    href={firebaseConsoleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg transition shadow-xs"
                  >
                    <span>Abrir Provedores no Firebase Console</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {isUnauthorizedDomain && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
              <p className="font-bold">Domínio não autorizado no Firebase:</p>
              <p>
                Adicione o domínio desta aplicação na lista de domínios autorizados no Firebase Console: <strong>Authentication &gt; Settings &gt; Authorized domains</strong>.
              </p>
            </div>
          )}

          {/* Quick Demo/Test Login Section */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                Acesso Imediato para Avaliação e Testes
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Você não precisa esperar a ativação do console para testar o sistema. Escolha abaixo uma conta pré-autorizada para entrar instantaneamente:
            </p>

            {/* Preconfigured Admin and User buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onSelectAccount('suporte.camarapa@gmail.com', 'Admin UNITINS / UAB');
                  onClose();
                }}
                className="flex items-start gap-2 p-3 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 hover:border-indigo-300 text-left transition group"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-indigo-950 text-xs block">
                    suporte.camarapa@gmail.com
                  </span>
                  <span className="text-[10px] text-indigo-700 block font-medium">
                    Administrador Principal (Acesso Total)
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectAccount('acrmrochamiranda@gmail.com', 'Alex Rocha Miranda');
                  onClose();
                }}
                className="flex items-start gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-left transition group"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 text-xs block">
                    acrmrochamiranda@gmail.com
                  </span>
                  <span className="text-[10px] text-slate-500 block font-medium">
                    Pesquisador / Administrador
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectAccount('ouvidoria.camarapa@gmail.com', 'Ouvidoria');
                  onClose();
                }}
                className="flex items-start gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-left transition group"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 text-xs block">
                    ouvidoria.camarapa@gmail.com
                  </span>
                  <span className="text-[10px] text-slate-500 block font-medium">
                    Ouvidoria / Administrador
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectAccount('cidadao.pesquisa@gmail.com', 'Cidadão Participante');
                  onClose();
                }}
                className="flex items-start gap-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 hover:border-emerald-300 text-left transition group"
              >
                <Mail className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-emerald-950 text-xs block">
                    cidadao.pesquisa@gmail.com
                  </span>
                  <span className="text-[10px] text-emerald-700 block font-medium">
                    Respondente da Pesquisa
                  </span>
                </div>
              </button>
            </div>

            {/* Custom Email Form */}
            <form
              onSubmit={handleCustomSubmit}
              className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
            >
              <label htmlFor="custom-login-email" className="block text-slate-700 font-bold text-xs">
                Ou informe outro e-mail para conectar:
              </label>
              <div className="flex gap-2">
                <input
                  id="custom-login-email"
                  type="email"
                  required
                  placeholder="seu-email@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition"
                >
                  <span>Entrar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Ambiente acadêmico UNITINS / UAB</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-semibold text-slate-700 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
