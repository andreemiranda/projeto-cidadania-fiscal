'use client';

import React, { useState, useEffect } from 'react';
import { Question, SurveyResponse, SurveyStats } from '@/lib/types';
import { getQuestionsList, getAllResponses, calculateSurveyStats } from '@/lib/storage';
import { generateScientificPdfReport } from '@/lib/generatePdfReport';
import {
  FileDown,
  Users,
  Calendar,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  RefreshCw,
  Award,
  Sparkles,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const CHART_COLORS = ['#2563eb', '#059669', '#7c3aed', '#d97706', '#0891b2', '#e11d48'];

export default function SurveyReportTab() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const qList = await getQuestionsList();
        const rList = await getAllResponses();
        if (isMounted) {
          setQuestions(qList);
          setResponses(rList);
          const computed = calculateSurveyStats(qList, rList);
          setStats(computed);
        }
      } catch (err) {
        console.error('Error loading report data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDownloadPdf = () => {
    if (!stats) return;
    setGeneratingPdf(true);
    try {
      generateScientificPdfReport(questions, responses, stats);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
    } finally {
      setTimeout(() => setGeneratingPdf(false), 800);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-slate-700 text-sm font-semibold">Carregando relatório e estatísticas...</p>
      </div>
    );
  }

  const totalN = stats?.totalResponses || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner with PDF Action */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wider uppercase backdrop-blur-xs">
              UNITINS • UAB • Pedro Afonso
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" /> Emissão Atualizada
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Relatório Técnico-Científico de Extensão
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl font-medium">
            Diagnóstico consolidado da consciência tributária e percepção social dos consumidores maiores de 18 anos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={generatingPdf}
          className="inline-flex items-center justify-center gap-2.5 bg-white text-blue-900 hover:bg-blue-50 active:scale-98 px-5 py-3 rounded-lg text-xs sm:text-sm font-extrabold shadow-md transition cursor-pointer shrink-0 disabled:opacity-75"
        >
          {generatingPdf ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-blue-700" />
              <span>Gerando PDF...</span>
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4 text-blue-700" />
              <span>Baixar Relatório em PDF (ABNT)</span>
            </>
          )}
        </button>
      </div>

      {/* Descriptive Statistics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-blue-700 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Amostra (N)</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-950">{totalN}</div>
          <p className="text-[11px] text-blue-800/80 font-medium mt-0.5">
            {totalN === 1 ? '1 participante válido' : `${totalN} participantes válidos`}
          </p>
        </div>

        <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-700 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Média de Idade (μ)</span>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-950">
            {stats?.averageAge || 0} <span className="text-sm font-bold text-indigo-700">anos</span>
          </div>
          <p className="text-[11px] text-indigo-800/80 font-medium mt-0.5">
            Mediana: {stats?.medianAge || 0} anos
          </p>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Critério Etário</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950">100%</div>
          <p className="text-[11px] text-emerald-800/80 font-medium mt-0.5">
            Todos maiores de 18 anos
          </p>
        </div>

        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Dispersão Amostral</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-950">
            {stats?.minAge || 0} - {stats?.maxAge || 0} <span className="text-xs font-bold text-amber-700">anos</span>
          </div>
          <p className="text-[11px] text-amber-800/80 font-medium mt-0.5">
            Desvio: s = {stats?.standardDeviationAge || 0}
          </p>
        </div>
      </div>

      {/* Questions Charts & Distributions */}
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-700" />
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              Distribuição Quantitativa por Questão
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {questions.length} Questões Avaliadas
          </span>
        </div>

        {totalN === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            <p className="text-sm font-semibold">Nenhuma resposta submetida ainda.</p>
            <p className="text-xs text-slate-400 mt-1">Preencha o formulário para visualizar os gráficos consolidados em tempo real.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, idx) => {
              const qStat = stats?.questionStats[q.id];
              const optionCounts = qStat?.optionCounts || {};
              const totalVotes = Object.values(optionCounts).reduce((a, b) => a + b, 0) || 1;

              const chartData = (q.options || []).map((opt) => ({
                name: opt,
                votos: optionCounts[opt] || 0,
                percentual: Math.round(((optionCounts[opt] || 0) / totalVotes) * 100),
              }));

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                          Questão {idx + 1}
                        </span>
                        {q.type === 'rating' && (
                          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                            Escala de 1 a 5
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        {q.title.replace(/^\d+\.\s*/, '')}
                      </h4>
                      {q.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{q.description}</p>
                      )}
                    </div>

                    {q.type === 'rating' && qStat?.meanRating !== undefined && (
                      <div className="text-right shrink-0 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg">
                        <span className="block text-[10px] font-bold text-purple-700 uppercase">Média</span>
                        <span className="text-base font-black text-purple-950">
                          {qStat.meanRating.toFixed(2)} / 5.0
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Horizontal Bar Chart & Frequency Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-7 h-48 sm:h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                        >
                          <XAxis type="number" hide domain={[0, 'dataMax + 1']} />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={120}
                            tick={{ fontSize: 11, fill: '#334155' }}
                          />
                          <Tooltip
                            formatter={((value: any) => [`${value ?? 0} respostas`, 'Frequência']) as any}
                          />
                          <Bar dataKey="votos" radius={[0, 4, 4, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="lg:col-span-5 space-y-2 text-xs">
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                          <thead className="bg-slate-100 text-slate-700 text-[11px] font-bold">
                            <tr>
                              <th className="p-2">Alternativa</th>
                              <th className="p-2 text-center">Votos</th>
                              <th className="p-2 text-right">%</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {chartData.map((item, oIdx) => (
                              <tr key={oIdx} className="hover:bg-slate-50">
                                <td className="p-2 text-slate-800 font-medium truncate max-w-[140px]">
                                  {item.name}
                                </td>
                                <td className="p-2 text-center font-bold text-slate-900">
                                  {item.votos}
                                </td>
                                <td className="p-2 text-right font-semibold text-blue-700">
                                  {item.percentual}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Participants Audit Register */}
      {totalN > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Auditoria de Participações (Google Federado)
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {responses.length} Registros Auditados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">E-mail do Participante</th>
                  <th className="p-2.5 text-center">Idade</th>
                  <th className="p-2.5">Data e Horário</th>
                  <th className="p-2.5">Hash do Dispositivo</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responses.map((resp, i) => (
                  <tr key={resp.id || i} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-500">{i + 1}</td>
                    <td className="p-2.5 font-semibold text-slate-800">{resp.userEmail}</td>
                    <td className="p-2.5 text-center font-bold text-slate-900">{resp.age} anos</td>
                    <td className="p-2.5 text-slate-600">
                      {resp.createdAt ? new Date(resp.createdAt).toLocaleString('pt-BR') : 'N/A'}
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-slate-500">
                      {resp.browserId ? resp.browserId.slice(0, 16) + '...' : 'BRW-OK'}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Validado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
