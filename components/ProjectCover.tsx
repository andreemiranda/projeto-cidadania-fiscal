'use client';

import React from 'react';
import { BookOpen, Users, GraduationCap, Scale, Target, UserCheck } from 'lucide-react';

export default function ProjectCover() {
  const academicos = [
    'Constancia Rodrigues Tavares de Souza',
    'Lavinia Volary Brito Teixeira',
    'Amanda Oliveira Rocha',
    'Renazielly de Souza Luz',
    'Keila Pereira dos Santos',
    'Aloísio Machado de Sousa',
  ];

  return (
    <div className="w-full bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden mb-6">
      {/* Institutional Header Banner inside card */}
      <div className="bg-slate-900 text-white p-6 sm:p-7 text-center border-b-2 border-indigo-600">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 text-indigo-300 text-xs font-semibold mb-2 tracking-wider uppercase border border-indigo-800/60">
          <GraduationCap className="w-4 h-4 text-indigo-400" />
          Extensão Universitária • Ensino Superior
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
          UNIVERSIDADE DO ESTADO DO TOCANTINS – UNITINS
        </h1>
        <h2 className="text-xs sm:text-sm font-semibold text-indigo-300 tracking-wide mb-1 uppercase">
          Universidade Aberta do Brasil – UAB • Polo de Pedro Afonso
        </h2>
        <div className="inline-block px-3.5 py-1 mt-2 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 font-bold text-[11px] sm:text-xs uppercase tracking-widest">
          Trabalho Extensionista
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Research Title */}
        <div className="border-l-4 border-black pl-4 py-1">
          <h2 className="text-xl sm:text-2xl font-black text-black">
            Pesquisa sobre Cidadania Fiscal
          </h2>
          <p className="text-xs sm:text-sm text-black font-semibold mt-0.5 italic">
            Objetivo: conhecer o que as pessoas sabem sobre impostos e aplicação dos recursos públicos.
          </p>
        </div>

        {/* Course & Academic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border-2 border-slate-300 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-black uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-black" />
                <span>Disciplina / Componente Curricular</span>
              </div>
              <p className="text-sm font-extrabold text-black">
                Temas Contemporâneos da Administração Pública
              </p>
              <p className="text-xs font-bold text-black">
                Polo Universitário Presencial de Pedro Afonso - TO
              </p>
            </div>
          </div>

          {/* Academic Team panel */}
          <div className="p-4 bg-slate-50 border-2 border-slate-300 rounded-lg">
            <h4 className="text-[11px] font-black text-black uppercase mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-black" />
              <span>Equipe Acadêmica de Pesquisa</span>
            </h4>
            <ul className="text-xs space-y-1.5 text-black font-bold grid grid-cols-1 sm:grid-cols-2 gap-x-2">
              {academicos.map((nome, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0"></span>
                  <span className="truncate">{nome}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Conceptual Definition: Cidadania Fiscal */}
        <div className="bg-slate-50 border-l-4 border-black p-4 sm:p-5 rounded-r-lg border-2 border-slate-300">
          <div className="flex items-center gap-2 text-black font-black text-xs uppercase tracking-wider mb-1.5">
            <Scale className="w-4 h-4 text-black" />
            <span>Conceito de Cidadania Fiscal</span>
          </div>
          <p className="text-sm text-black leading-relaxed font-semibold italic">
            &ldquo;Cidadania fiscal é o exercício pleno dos direitos e deveres dos cidadãos na relação com os recursos públicos. Ela envolve compreender de onde vem o dinheiro do Estado (tributos) e para onde ele vai (serviços públicos), permitindo que a sociedade acompanhe e fiscalize a aplicação das verbas arrecadadas.&rdquo;
          </p>
        </div>

        {/* Target Audience and Objective */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border-2 border-slate-300 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-black text-white shrink-0 shadow-xs">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-black uppercase tracking-wide">Público-Alvo</h3>
              <p className="text-sm font-extrabold text-black mt-0.5">
                Consumidores acima de 18 anos
              </p>
              <p className="text-xs font-bold text-black mt-1">
                Participação voluntária com validação prévia de maioridade e identificação com conta Google.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border-2 border-slate-300 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-black text-white shrink-0 shadow-xs">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-black uppercase tracking-wide">Objetivo da Pesquisa</h3>
              <p className="text-sm font-extrabold text-black mt-0.5">
                Conhecer a percepção sobre tributos e nota fiscal
              </p>
              <p className="text-xs font-bold text-black mt-1">
                Avaliar o nível de compreensão pública sobre a arrecadação e destinação social dos recursos públicos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
