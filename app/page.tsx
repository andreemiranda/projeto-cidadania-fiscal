'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import HeaderBanner from '@/components/HeaderBanner';
import ProjectCover from '@/components/ProjectCover';
import AuthPrompt from '@/components/AuthPrompt';
import FiscalForm from '@/components/FiscalForm';
import SurveyReportTab from '@/components/SurveyReportTab';
import { ShieldCheck, GraduationCap, FileText, BarChart3, Sparkles } from 'lucide-react';
import Link from 'next/link';

function MainContent() {
  const { user, loading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'form' | 'report'>('form');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 1. Header with centered landscape JPG logo 1200x196 */}
      <HeaderBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* 2. Project Academic Cover with Institutional Details */}
        <ProjectCover />

        {/* 3. Navigation Tabs: Form vs. Report */}
        <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              activeTab === 'form'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Formulário de Coleta</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              activeTab === 'report'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Relatório & Estatísticas</span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              activeTab === 'report' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
            }`}>
              PDF
            </span>
          </button>
        </div>

        {/* 4. Tab Content */}
        {activeTab === 'form' ? (
          <div>
            {loading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-slate-600 text-xs font-medium">Verificando credenciais de acesso...</p>
              </div>
            ) : !user ? (
              <AuthPrompt />
            ) : (
              <FiscalForm onViewReport={() => setActiveTab('report')} />
            )}
          </div>
        ) : (
          <SurveyReportTab />
        )}
      </main>

      {/* Institutional Footer conforming to Professional Polish theme */}
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

export default function HomePage() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
