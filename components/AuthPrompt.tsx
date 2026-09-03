'use client';

import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ShieldCheck, Lock, UserCheck, ShieldAlert } from 'lucide-react';

export default function AuthPrompt() {
  const { loginWithGoogle, loginAsDemoAdmin, loginAsDemoUser } = useAuth();

  return (
    <div className="w-full bg-white rounded-xl shadow-xs border border-slate-300 p-6 sm:p-10 text-center max-w-2xl mx-auto my-6">
      <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto mb-4 border border-indigo-200">
        <Lock className="w-8 h-8" />
      </div>

      <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-[11px] font-bold uppercase tracking-wider mb-3 border border-indigo-200">
        Identificação Obrigatória
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-black mb-2">
        Autenticação com Conta Google
      </h2>
      <p className="text-sm font-medium text-black max-w-lg mx-auto mb-6 leading-relaxed">
        Para assegurar a validade metodológica desta pesquisa científica e garantir a unicidade de respostas por participante, o acesso ao formulário requer identificação com sua conta Google registrada.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => loginWithGoogle()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wider transition shadow-lg shadow-indigo-100 hover:shadow-none cursor-pointer"
        >
          {/* Google "G" Icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Entrar com o Google</span>
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-black font-semibold">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Ambiente seguro • Amostragem protegida por protocolo de usuário e dispositivo único</span>
      </div>
    </div>
  );
}

