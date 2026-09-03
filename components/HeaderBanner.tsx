'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import bannerImg from '../public/banner-header.png';
import { useAuth } from '@/lib/AuthContext';
import { Settings, LogOut, LogIn, ShieldCheck, Home } from 'lucide-react';

export default function HeaderBanner() {
  const { user, isAdmin, loginWithGoogle, logout, isFirebaseActive } = useAuth();

  return (
    <header className="w-full bg-white shadow-sm border-b border-slate-200 shrink-0">
      {/* Top utility / user bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-slate-100 tracking-wide">UNITINS</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">UAB Pedro Afonso - TO</span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-400">Cidadania Fiscal</span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || user.email || 'Usuário'}
                      width={22}
                      height={22}
                      className="w-5 h-5 rounded-full border border-slate-600 object-cover"
                      referrerPolicy="no-referrer"
                      unoptimized
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-[10px] text-white">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[120px] sm:max-w-[190px] truncate text-slate-200 text-xs">
                    {user.displayName || user.email}
                  </span>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3 text-amber-400" /> Admin
                    </span>
                  )}
                </div>

                {isAdmin ? (
                  <Link
                    href="/configuracoes"
                    className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-md transition text-xs font-semibold shadow-xs"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Configurações</span>
                  </Link>
                ) : null}

                <button
                  onClick={() => logout()}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-400 transition text-xs font-medium px-1.5 py-1"
                  title="Sair da conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => loginWithGoogle()}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1 rounded-md font-semibold transition text-xs shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar com Google</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Logo Banner Header - Pure White Background */}
      <div className="w-full bg-white flex justify-center items-center overflow-hidden border-b border-slate-200 py-1">
        <Link
          href="/"
          className="group block relative w-full max-w-[1200px] hover:opacity-95 transition focus:outline-none"
          title="Clique para retornar à página inicial"
        >
          {/* Responsive aspect ratio container conforming to 1200px / 196px */}
          <div className="relative w-full aspect-[1200/196] max-h-[196px]">
            <Image
              src={bannerImg}
              alt="Logo UNITINS"
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-contain w-full h-full"
              referrerPolicy="no-referrer"
            />
          </div>
        </Link>
      </div>

      {/* Institutional strip */}
      <div className="bg-slate-50 py-3 px-6 text-center border-b border-slate-200">
        <h1 className="text-xs sm:text-sm font-bold tracking-wider text-black uppercase">
          Universidade do Estado do Tocantins – UNITINS | UAB | Polo Pedro Afonso
        </h1>
        <p className="text-[11px] sm:text-xs font-bold text-black mt-1 uppercase tracking-wide">
          Trabalho Extensionista: Temas Contemporâneos da Administração Pública
        </p>
      </div>

      {/* Navigation Sub-bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <Link href="/" className="flex items-center gap-1.5 text-indigo-700 hover:text-indigo-900 transition">
              <Home className="w-3.5 h-3.5" />
              <span>Início</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700">Questionário Extensionista de Coleta</span>
          </div>
        </div>
      </div>
    </header>
  );
}
