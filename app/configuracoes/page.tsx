'use client';

import React from 'react';
import { AuthProvider } from '@/lib/AuthContext';
import HeaderBanner from '@/components/HeaderBanner';
import AdminDashboard from '@/components/AdminDashboard';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export default function ConfiguracoesPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        {/* Header with full width landscape JPG logo */}
        <HeaderBanner />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition shadow-2xs hover:border-indigo-200"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Voltar para o Formulário Principal</span>
            </Link>
          </div>

          <AdminDashboard />
        </main>
      </div>
    </AuthProvider>
  );
}
