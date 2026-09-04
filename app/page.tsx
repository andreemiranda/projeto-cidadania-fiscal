'use client';

import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import HeaderBanner from '@/components/HeaderBanner';
import ProjectCover from '@/components/ProjectCover';
import { ShieldCheck, GraduationCap, FileText, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, isAdmin, loginWithGoogle, loading } = useAuth();
  const router = useRouter();

  const handleStartSurvey = async () => {
    if (!user) {
      await loginWithGoogle();
      // After successful login, redirect to form. 
      // The onAuthStateChanged in AuthContext will update user state.
    } else {
      router.push('/form');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <HeaderBanner />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 flex flex-col items-center justify-center">
        <ProjectCover />

        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs max-w-2xl w-full text-center space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Bem-vindo à Pesquisa</h2>
            <p className="text-sm text-slate-600">
              Sua participação é fundamental para o sucesso deste trabalho extensionista. 
              { !user && " É necessário autenticar com sua conta Google para participar." }
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStartSurvey}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wider transition shadow-lg hover:shadow-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : user ? (
                <>
                  <FileText className="w-5 h-5" />
                  <span>Acessar Formulário</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Entrar com Google e Acessar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      <footer className="w-full bg-slate-900 border-t border-slate-800 text-slate-400 py-6 px-4 text-xs shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2 text-white font-semibold">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Universidade do Estado do Tocantins – UNITINS</span>
            </div>
            <p className="text-slate-400 text-xs">
              Sistema Universidade Aberta do Brasil (UAB) • Polo de Pedro Afonso - TO
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-2 text-slate-400 text-xs">
            <span className="inline-block px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
              Exclusivo para consumidores maiores de 18 anos
            </span>
            {isAdmin && (
              <Link
                href="/configuracoes"
                className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition font-semibold text-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Painel Administrativo do Polo</span>
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
