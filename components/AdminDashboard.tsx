'use client';

import React, { useState, useEffect, useId } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Question, SurveyResponse, SurveyStats, QuestionType } from '@/lib/types';
import {
  getQuestionsList,
  saveQuestion,
  deleteQuestionById,
  restoreDefaultQuestions,
  getAllResponses,
  resetAllResponses,
  calculateSurveyStats,
} from '@/lib/storage';
import { generateScientificPdfReport } from '@/lib/generatePdfReport';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Settings,
  FileDown,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Users,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  ListFilter,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Mail,
  Calendar,
  Layers,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';

const CHART_COLORS = [
  '#4f46e5',
  '#0f172a',
  '#0284c7',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#dc2626',
  '#475569',
];

export default function AdminDashboard() {
  const { user, isAdmin, loginWithGoogle, isFirebaseActive } = useAuth();
  const formId = useId();

  const [activeTab, setActiveTab] = useState<'analytics' | 'questions' | 'reset'>('analytics');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SurveyStats | null>(null);

  // Question editing / creation modal
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [optionsText, setOptionsText] = useState('');

  // Confirmation modal for resetting
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load data
  const refreshData = async () => {
    setLoading(true);
    try {
      const [qList, rList] = await Promise.all([
        getQuestionsList(),
        getAllResponses(),
      ]);
      setQuestions(qList);
      setResponses(rList);
      setStats(calculateSurveyStats(qList, rList));
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [qList, rList] = await Promise.all([
          getQuestionsList(),
          getAllResponses(),
        ]);
        if (active) {
          setQuestions(qList);
          setResponses(rList);
          setStats(calculateSurveyStats(qList, rList));
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading admin data:', err);
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  // Open modal to add a new question
  const handleAddNewQuestion = () => {
    setEditingQuestion({
      id: `q_${Date.now()}`,
      order: questions.length + 1,
      title: '',
      type: 'radio',
      required: true,
      options: ['Sim', 'Não'],
    });
    setOptionsText('Sim\nNão');
    setIsEditingModalOpen(true);
  };

  // Open modal to edit existing question
  const handleEditQuestion = (q: Question) => {
    setEditingQuestion({ ...q });
    setOptionsText((q.options || []).join('\n'));
    setIsEditingModalOpen(true);
  };

  // Save question
  const handleSaveQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !editingQuestion.title) return;

    const parsedOptions = optionsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const questionToSave: Question = {
      id: editingQuestion.id || `q_${Date.now()}`,
      order: editingQuestion.order || questions.length + 1,
      title: editingQuestion.title.trim(),
      type: (editingQuestion.type as QuestionType) || 'radio',
      required: Boolean(editingQuestion.required),
      options: ['radio', 'checkbox'].includes(editingQuestion.type || '')
        ? parsedOptions
        : undefined,
      description: editingQuestion.description?.trim() || '',
    };

    try {
      await saveQuestion(questionToSave);
      showNotification('success', 'Pergunta gravada com sucesso!');
      setIsEditingModalOpen(false);
      setEditingQuestion(null);
      await refreshData();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Falha ao salvar pergunta.');
    }
  };

  // Delete question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta pergunta do formulário?')) {
      return;
    }

    try {
      await deleteQuestionById(questionId);
      showNotification('success', 'Pergunta removida com sucesso!');
      await refreshData();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Falha ao remover a pergunta.');
    }
  };

  // Restore Default Questions
  const handleRestoreDefaults = async () => {
    if (
      !window.confirm(
        'Deseja restaurar as 6 perguntas originais da UNITINS? Quaisquer alterações personalizadas serão substituídas pelas perguntas acadêmicas padrão.'
      )
    ) {
      return;
    }

    try {
      await restoreDefaultQuestions();
      showNotification('success', 'Perguntas originais restauradas com sucesso!');
      await refreshData();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Falha ao restaurar perguntas originais.');
    }
  };

  // Reset all responses (novo início do formulário)
  const handleResetResponses = async () => {
    setResetting(true);
    try {
      await resetAllResponses();
      showNotification('success', 'Formulário reinicializado! Todas as respostas anteriores foram limpas com sucesso.');
      setIsResetConfirmOpen(false);
      await refreshData();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Falha ao reinicializar respostas.');
    } finally {
      setResetting(false);
    }
  };

  // PDF Export
  const handleExportPDF = () => {
    if (!stats) return;
    try {
      generateScientificPdfReport(questions, responses, stats);
      showNotification('success', 'Relatório em PDF gerado e iniciado o download com sucesso!');
    } catch (err) {
      console.error('PDF generation error:', err);
      showNotification('error', 'Erro ao compilar relatório PDF.');
    }
  };

  // 1. Guard check for unauthorized users
  if (!user || !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          Área Restrita aos Administradores
        </h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          O acesso ao painel de configurações, gerenciamento de perguntas e emissão de relatórios científicos é restrito exclusivamente a contas previamente autorizadas pela coordenação do projeto.
        </p>

        {user ? (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 mb-6 text-left space-y-1">
            <p>
              <strong>Usuário conectado atualmente:</strong> {user.email}
            </p>
            <p className="text-rose-700">
              Este e-mail não está cadastrado na lista de administradores autorizados.
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => loginWithGoogle()}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Conectar com Conta Google de Administrador</span>
            </button>
          </div>
        )}

        <div className="text-xs text-slate-500 pt-4 border-t border-slate-100">
          Contas autorizadas pré-configuradas: <strong>suporte.camarapa@gmail.com</strong> ou definidas em <code>NEXT_PUBLIC_ADMIN_EMAILS</code>.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 shadow-md animate-in slide-in-from-top duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-800 text-white'
              : 'bg-rose-700 text-white'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-300" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-300" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Admin Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                Painel Administrativo do Formulário
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                  Extensão Universitária • UNITINS
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">Polo Pedro Afonso</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 italic">
            Gestão de perguntas, conferência de respostas, gráficos estatísticos e emissão de relatório científico em PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={refreshData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-xs"
            title="Recarregar dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-lg shadow-indigo-100 hover:shadow-none"
          >
            <FileDown className="w-4 h-4" />
            <span>Baixar Relatório Científico (PDF)</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50/60'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Respostas & Gráficos ({responses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition whitespace-nowrap ${
            activeTab === 'questions'
              ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50/60'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Gerenciar Perguntas ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reset')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition whitespace-nowrap ${
            activeTab === 'reset'
              ? 'border-b-2 border-rose-600 text-rose-700 bg-rose-50/60'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reinicialização do Formulário</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS & RESPONSES */}
      {activeTab === 'analytics' && stats && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                <span>Total de Respostas</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
                {stats.totalResponses}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Participantes autenticados</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                <span>Média de Idade</span>
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-2">
                {stats.averageAge} <span className="text-sm font-normal text-slate-500">anos</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Consumidores adultos</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                <span>Menor Idade</span>
                <span className="text-xs font-bold text-slate-400">Min</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
                {stats.minAge || '-'} <span className="text-sm font-normal text-slate-500">anos</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Restrição ≥ 18 anos</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                <span>Maior Idade</span>
                <span className="text-xs font-bold text-slate-400">Max</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
                {stats.maxAge || '-'} <span className="text-sm font-normal text-slate-500">anos</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Amplitude da amostra</p>
            </div>
          </div>

          {/* Graphical Question Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {questions.map((q, idx) => {
              const qStat = stats.questionStats[q.id];
              if (!qStat || qStat.totalAnswers === 0) {
                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-2">
                        Questão {idx + 1}: {q.title.replace(/^\d+\.\s*/, '')}
                      </h3>
                      <p className="text-xs text-slate-400 italic">Sem respostas computadas ainda.</p>
                    </div>
                  </div>
                );
              }

              const optionsData = Object.keys(qStat.optionCounts).map((opt) => ({
                name: opt.length > 25 ? opt.substring(0, 23) + '...' : opt,
                fullName: opt,
                count: qStat.optionCounts[opt],
              }));

              const isMulti = q.type === 'checkbox';

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                        Questão {idx + 1} • {isMulti ? 'Múltipla Escolha' : 'Escolha Única'}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {qStat.totalAnswers} resposta(s)
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {q.title.replace(/^\d+\.\s*/, '')}
                    </h3>
                  </div>

                  {/* Visual Chart */}
                  {optionsData.length > 0 ? (
                    <div className="h-64 w-full">
                      {idx % 2 === 0 ? (
                        // Bar Chart
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={optionsData} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                              dataKey="name"
                              angle={-20}
                              textAnchor="end"
                              interval={0}
                              tick={{ fontSize: 10, fill: '#475569' }}
                            />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#475569' }} />
                            <Tooltip
                              formatter={(value) => [`${value} respostas`, 'Frequência']}
                              labelFormatter={(label) => {
                                const item = optionsData.find((d) => d.name === label);
                                return item ? item.fullName : label;
                              }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {optionsData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        // Pie Chart
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={optionsData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={80}
                              paddingAngle={3}
                              dataKey="count"
                              nameKey="fullName"
                              label={({ name, percent }) =>
                                (percent || 0) > 0.05
                                  ? `${name ? String(name).slice(0, 12) : ''}: ${((percent || 0) * 100).toFixed(0)}%`
                                  : ''
                              }
                            >
                              {optionsData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} respostas`, 'Frequência']} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  ) : null}

                  {/* Table summary of counts */}
                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                    {optionsData.map((item, oIndex) => (
                      <div key={oIndex} className="flex items-center justify-between text-slate-600">
                        <span className="truncate max-w-[280px]">{item.fullName}</span>
                        <span className="font-semibold text-slate-900 shrink-0 ml-2">
                          {item.count} ({stats.totalResponses > 0 ? ((item.count / stats.totalResponses) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Respondent Emails Table (Requirement from prompt) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Listagem de E-mails e Auditoria dos Respondentes</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Relação das contas Google autenticadas que responderam ao formulário.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-700">
                {stats.emailsList.length} registro(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-center">#</th>
                    <th className="px-4 py-3">E-mail Autenticado</th>
                    <th className="px-4 py-3 text-center">Idade</th>
                    <th className="px-4 py-3">Data de Nascimento</th>
                    <th className="px-4 py-3">Data e Hora de Envio</th>
                    <th className="px-4 py-3 text-center">Validação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {responses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        Nenhuma resposta registrada até o momento.
                      </td>
                    </tr>
                  ) : (
                    responses.map((resp, i) => (
                      <tr key={resp.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 text-center font-mono text-slate-400">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>{resp.userEmail}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-700">
                          {resp.age} anos
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">{resp.birthDate}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">
                          {new Date(resp.createdAt).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium text-[10px] border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> Verificado
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUESTIONS MANAGEMENT */}
      {activeTab === 'questions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Perguntas do Questionário Extensionista
              </h2>
              <p className="text-xs text-slate-500">
                Insira novas perguntas, altere redações ou opções existentes, ou remova questões. O formulário suporta múltipla escolha, escolha única, texto e escalas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRestoreDefaults}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Restaurar Perguntas Originais</span>
              </button>

              <button
                onClick={handleAddNewQuestion}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Pergunta</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-5 rounded-xl border border-slate-200 hover:border-indigo-200 bg-white shadow-2xs transition flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold uppercase tracking-wider">
                      Questão {idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold uppercase">
                      {q.type === 'radio'
                        ? 'Escolha Única'
                        : q.type === 'checkbox'
                        ? 'Múltipla Escolha'
                        : q.type === 'text'
                        ? 'Texto Curto'
                        : q.type === 'textarea'
                        ? 'Dissertativa'
                        : 'Avaliação 1-5'}
                    </span>
                    {q.required && (
                      <span className="text-rose-600 text-[10px] font-bold uppercase">
                        Obrigatória
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{q.title}</h3>
                  {q.description && <p className="text-xs text-slate-500">{q.description}</p>}

                  {q.options && q.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <span
                          key={oIdx}
                          className="text-xs bg-white text-slate-600 px-2.5 py-1 rounded border border-slate-200 font-medium"
                        >
                          • {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleEditQuestion(q)}
                    className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition"
                    title="Editar pergunta"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-2 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition"
                    title="Excluir pergunta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FORM RESET & MAINTENANCE */}
      {activeTab === 'reset' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-rose-600" />
              <span>Reinicialização do Formulário de Pesquisa</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Esta ferramenta limpa os registros computados para que o formulário fique pronto para um novo início de coleta de dados.
            </p>
          </div>

          <div className="p-5 rounded-xl border-2 border-rose-200 bg-rose-50/50 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-rose-900">
                  Atenção: Ação Irreversível de Limpeza de Respostas
                </h3>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Ao acionar a reinicialização, todas as respostas coletadas ({responses.length} no momento) serão excluídas da base de dados, deixando o formulário totalmente limpo para uma nova rodada de aplicação com os consumidores. Recomenda-se baixar o Relatório em PDF antes de prosseguir.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
              >
                <FileDown className="w-4 h-4 text-emerald-700" />
                <span>Salvar Backup em PDF Antes</span>
              </button>

              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reiniciar Formulário e Limpar Respostas</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Informações do Sistema e Permissões
            </h3>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-600">
              <div>
                <strong>Administradores cadastrados:</strong>{' '}
                <code>suporte.camarapa@gmail.com, {process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'Nenhum adicional'}</code>
              </div>
              <div>
                <strong>Status do Banco de Dados:</strong>{' '}
                {isFirebaseActive ? (
                  <span className="text-emerald-700 font-semibold">Firebase Firestore Conectado</span>
                ) : (
                  <span className="text-amber-700 font-semibold">
                    Desconectado (Configure as credenciais do Firebase nas variáveis de ambiente para sincronização online)
                  </span>
                )}
              </div>
              <div>
                <strong>Domínio da Aplicação (NEXT_PUBLIC_APP_URL):</strong>{' '}
                <code className="text-slate-800">
                  {process.env.NEXT_PUBLIC_APP_URL || 'https://ais-dev-gn7idgdqrma4lz3sqkuexa-771752383788.us-east1.run.app'}
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT QUESTION */}
      {isEditingModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingQuestion.title ? 'Editar Pergunta' : 'Nova Pergunta'}
              </h3>
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestionSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label
                  htmlFor={`${formId}-editTitle`}
                  className="block font-bold text-slate-800 mb-1"
                >
                  Título / Enunciado da Pergunta *
                </label>
                <textarea
                  id={`${formId}-editTitle`}
                  rows={2}
                  value={editingQuestion.title || ''}
                  onChange={(e) =>
                    setEditingQuestion((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Ex: 7. Você costuma verificar o valor dos tributos discriminados no cupom fiscal?"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor={`${formId}-editType`}
                    className="block font-bold text-slate-800 mb-1"
                  >
                    Tipo de Pergunta
                  </label>
                  <select
                    id={`${formId}-editType`}
                    value={editingQuestion.type || 'radio'}
                    onChange={(e) =>
                      setEditingQuestion((prev) => ({
                        ...prev,
                        type: e.target.value as QuestionType,
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="radio">Escolha Única (Radio)</option>
                    <option value="checkbox">Múltipla Escolha (Checkbox)</option>
                    <option value="text">Texto Curto</option>
                    <option value="textarea">Texto Longo / Dissertativa</option>
                    <option value="rating">Escala / Avaliação (1 a 5)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={Boolean(editingQuestion.required)}
                      onChange={(e) =>
                        setEditingQuestion((prev) => ({ ...prev, required: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-600"
                    />
                    <span>Resposta Obrigatória</span>
                  </label>
                </div>
              </div>

              {['radio', 'checkbox'].includes(editingQuestion.type || '') && (
                <div>
                  <label
                    htmlFor={`${formId}-editOptions`}
                    className="block font-bold text-slate-800 mb-1"
                  >
                    Opções de Resposta (Uma por linha)
                  </label>
                  <textarea
                    id={`${formId}-editOptions`}
                    rows={4}
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Cada linha digitada se tornará uma alternativa selecionável.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-xs"
                >
                  Salvar Pergunta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET CONFIRMATION */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Confirmar Reinicialização do Formulário?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Todas as <strong>{responses.length} respostas</strong> salvas serão excluídas. O formulário ficará em branco e pronto para uma nova rodada de pesquisa.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                disabled={resetting}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetResponses}
                disabled={resetting}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                {resetting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Limpando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmar e Reiniciar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
