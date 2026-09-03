'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import HeaderBanner from '@/components/HeaderBanner';
import AuthPrompt from '@/components/AuthPrompt';
import FiscalForm from '@/components/FiscalForm';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

function FormContent() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <HeaderBanner />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div>
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold mb-4 inline-block"
          >
            ← Voltar à Página Inicial
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-600 text-xs font-medium">Verificando credenciais de acesso...</p>
          </div>
        ) : !user ? (
          <AuthPrompt />
        ) : (
          <FiscalForm />
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="w-full bg-slate-900 border-t border-slate-800 text-slate-400 py-6 px-4 text-xs shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2 text-white font-semibold">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Universidade do Estado do Tocantins – UNITINS</span>
            </div>
            <p className="text-slate-400 text-xs">
              Sistema Universidade Aberta do Brasil (UAB) • Polo de Pedro Afonso - TO
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function FormPage() {
  return (
    <AuthProvider>
      <FormContent />
    </AuthProvider>
  );
}
