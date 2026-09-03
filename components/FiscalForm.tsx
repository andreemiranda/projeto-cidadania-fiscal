'use client';

import React, { useState, useEffect, useId } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  Question,
  SurveyResponse,
} from '@/lib/types';
import {
  getQuestionsList,
  getAllResponses,
  calculateSurveyStats,
  submitSurveyResponse,
  checkUserOrBrowserAlreadySubmitted,
} from '@/lib/storage';
import { generateScientificPdfReport } from '@/lib/generatePdfReport';
import { calculateExactAge } from '@/lib/ageUtils';
import { getBrowserDeviceId } from '@/lib/browserId';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  FileCheck,
  RotateCcw,
  UserCheck,
  Shield,
  Laptop,
  BarChart3,
  FileDown,
} from 'lucide-react';

interface FiscalFormProps {
  onViewReport?: () => void;
}

export default function FiscalForm({ onViewReport }: FiscalFormProps = {}) {
  const { user } = useAuth();
  const formId = useId();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [previousResponse, setPreviousResponse] = useState<SurveyResponse | null>(null);
  const [browserId, setBrowserId] = useState<string>('');
  const [deviceBlocked, setDeviceBlocked] = useState<boolean>(false);
  const [deviceBlockedMessage, setDeviceBlockedMessage] = useState<string>('');

  // Form State
  const [birthDate, setBirthDate] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Age calculation state
  const ageResult = calculateExactAge(birthDate);

  // Initialize questions and verify unique user/browser status
  useEffect(() => {
    async function load() {
      try {
        const deviceId = getBrowserDeviceId();
        setBrowserId(deviceId);

        const qList = await getQuestionsList();
        setQuestions(qList);

        if (user?.email) {
          const check = await checkUserOrBrowserAlreadySubmitted(user.email, deviceId);

          if (check.alreadySubmitted && check.existingResponse) {
            // If submitted by another account on the same browser device
            if (
              check.byBrowser &&
              check.existingResponse.userEmail.toLowerCase() !== user.email.toLowerCase()
            ) {
              setDeviceBlocked(true);
              setDeviceBlockedMessage(
                `Este dispositivo já registrou uma submissão para esta pesquisa vinculada a outro e-mail institucional. Para preservar o rigor científico e a unicidade amostral da UNITINS, cada dispositivo pode responder uma única vez.`
              );
            } else {
              // Same user loaded previous response for review/editing
              setPreviousResponse(check.existingResponse);
              setBirthDate(check.existingResponse.birthDate || '');
              setAnswers(check.existingResponse.answers || {});
            }
          }
        }
      } catch (err) {
        console.error('Error loading form questions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  // Handle Answer Changes
  const handleRadioChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleCheckboxChange = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || [];
      // Special case: if selecting "Não conheço nenhum", deselect others
      if (value.toLowerCase().includes('não conheço nenhum')) {
        return {
          ...prev,
          [questionId]: current.includes(value) ? [] : [value],
        };
      }

      // If selecting another option while "Não conheço nenhum" is selected, remove "Não conheço nenhum"
      const filtered = current.filter((item) => !item.toLowerCase().includes('não conheço nenhum'));

      const next = filtered.includes(value)
        ? filtered.filter((v) => v !== value)
        : [...filtered, value];

      return {
        ...prev,
        [questionId]: next,
      };
    });
  };

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (deviceBlocked) {
      setErrorMsg(deviceBlockedMessage || 'Submissão bloqueada: este dispositivo já participou da pesquisa.');
      return;
    }

    if (!user?.email) {
      setErrorMsg('Você precisa estar autenticado com sua conta Google para enviar o formulário.');
      return;
    }

    if (!birthDate) {
      setErrorMsg('Por favor, preencha sua data de nascimento.');
      return;
    }

    if (!ageResult.isAdult || ageResult.age === null) {
      setErrorMsg('Formulário bloqueado: esta pesquisa é restrita exclusivamente a maiores de 18 anos.');
      return;
    }

    // Validate required questions
    for (const q of questions) {
      if (q.required) {
        const val = answers[q.id];
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0)
        ) {
          setErrorMsg(`Por favor, responda à questão obrigatória: "${q.title}"`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const activeBrowserId = browserId || getBrowserDeviceId();
      const responseData: SurveyResponse = {
        id: previousResponse ? previousResponse.id : `resp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email.split('@')[0],
        userPhoto: user.photoURL || undefined,
        birthDate,
        age: ageResult.age,
        browserId: activeBrowserId,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        answers,
        createdAt: new Date().toISOString(),
      };

      await submitSurveyResponse(responseData);
      setPreviousResponse(responseData);
      setSubmitted(true);
    } catch (err) {
      console.error('Submission failed:', err);
      setErrorMsg('Ocorreu um erro ao gravar sua resposta. Por favor, tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border-2 border-slate-300 p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 text-black animate-spin mx-auto mb-3" />
        <p className="text-black text-sm font-bold">Carregando questionário acadêmico...</p>
      </div>
    );
  }

  // Direct PDF download from success screen
  const handleDownloadDirectPdf = async () => {
    try {
      const qList = questions.length ? questions : await getQuestionsList();
      const rList = await getAllResponses();
      const st = calculateSurveyStats(qList, rList);
      generateScientificPdfReport(qList, rList, st);
    } catch (err) {
      console.error('Error downloading PDF:', err);
    }
  };

  // Success Screen
  if (submitted) {
    return (
      <div className="bg-white rounded-xl border-2 border-slate-300 p-8 sm:p-12 text-center shadow-xs max-w-2xl mx-auto my-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border-2 border-emerald-600">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-black mb-2">
          Resposta Enviada com Sucesso!
        </h2>
        <p className="text-sm font-medium text-black mb-6 leading-relaxed">
          Agradecemos a sua valiosa contribuição com o trabalho extensionista da UNITINS / Polo UAB Pedro Afonso sobre Cidadania Fiscal. Suas respostas foram computadas e consolidadas no banco de dados estatístico.
        </p>

        <div className="p-4 rounded-lg bg-slate-50 border-2 border-slate-300 text-left text-xs text-black space-y-2 mb-6 font-medium">
          <div className="flex justify-between border-b border-slate-200 pb-1.5">
            <span className="font-bold text-black">Respondente Autenticado:</span>
            <span className="font-extrabold text-black">{user?.email}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1.5">
            <span className="font-bold text-black">Idade Computada:</span>
            <span className="font-extrabold text-emerald-800">{ageResult.age} anos (Maior de 18 anos)</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-black">Data do Registro:</span>
            <span className="font-mono text-black">{new Date().toLocaleString('pt-BR')}</span>
          </div>
        </div>

        {/* Action Buttons: View Report Tab, Download PDF, or Review Answers */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {onViewReport && (
            <button
              type="button"
              onClick={onViewReport}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Ver Relatório da Pesquisa</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadDirectPdf}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
          >
            <FileDown className="w-4 h-4 text-emerald-400" />
            <span>Baixar Relatório em PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Revisar Respostas</span>
          </button>
        </div>
      </div>
    );
  }

  // Answered questions count and percentage
  const answeredCount = questions.filter((q) => {
    const val = answers[q.id];
    if (Array.isArray(val)) return val.length > 0;
    return !!val && String(val).trim().length > 0;
  }).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <div className="w-full bg-white rounded-xl shadow-xs border-2 border-slate-300 overflow-hidden">
      {/* Form Title Bar */}
      <div className="bg-slate-100 border-b-2 border-slate-300 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-black flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-700" />
            <span>Questionário Científico de Coleta de Dados</span>
          </h2>
          <p className="text-xs font-bold text-black mt-0.5">
            Responda às questões com base em sua experiência pessoal como cidadão e consumidor.
          </p>
        </div>

        {/* Security & Device Badge */}
        <div className="flex flex-wrap items-center gap-2">
          {previousResponse && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-black border border-indigo-300 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-800" />
              <span>Resposta Anterior Carregada (Modo Atualização)</span>
            </div>
          )}
        </div>
      </div>

      {/* Device Blocked Banner if applicable */}
      {deviceBlocked && (
        <div className="m-6 p-4 rounded-xl bg-amber-50 border-2 border-amber-400 text-black text-xs font-medium space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-black">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
            <span>Alerta de Integridade Amostral: Dispositivo Já Utilizado</span>
          </div>
          <p className="text-black text-xs leading-relaxed font-semibold">
            {deviceBlockedMessage}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {/* ========================================================= */}
        {/* TOP COMPONENT: BIRTH DATE & EXACT AGE CALCULATION GATEWAY */}
        {/* ========================================================= */}
        <div className="p-5 sm:p-6 rounded-xl bg-slate-50 border-2 border-slate-300 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <label
                htmlFor={`${formId}-birthDate`}
                className="block text-xs font-black text-black uppercase tracking-wider flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-indigo-700" />
                <span>Data de Nascimento (Verificação Obrigatória de Maioridade)</span>
                <span className="text-rose-700 font-black">*</span>
              </label>
              <p className="text-xs font-bold text-black mt-1">
                Conforme exigência metodológica do projeto acadêmico, esta pesquisa destina-se estritamente a consumidores com 18 anos completos ou mais.
              </p>
            </div>

            {ageResult.isValidDate && ageResult.age !== null && (
              <div className="shrink-0">
                <span className="text-[10px] text-black block uppercase font-extrabold tracking-wider">Idade Computada</span>
                <span
                  className={`inline-block mt-0.5 text-xs font-black px-2.5 py-1 rounded border ${
                    ageResult.isAdult
                      ? 'text-emerald-950 bg-emerald-100 border-emerald-400'
                      : 'text-rose-950 bg-rose-100 border-rose-400'
                  }`}
                >
                  {ageResult.age} {ageResult.age === 1 ? 'ano' : 'anos'} {ageResult.isAdult ? '(Aprovado - Maior de 18)' : '(Bloqueado - Menor de 18)'}
                </span>
              </div>
            )}
          </div>

          <div className="max-w-xs">
            <input
              id={`${formId}-birthDate`}
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full px-3.5 py-2.5 rounded-lg border-2 border-slate-400 text-black bg-white focus:outline-none focus:border-indigo-700 text-sm font-bold shadow-xs"
              required
            />
          </div>

          {/* Verification Status Feedback Banner */}
          {birthDate ? (
            ageResult.isAdult ? (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 border-2 border-emerald-300 text-black text-xs font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-extrabold text-black">Critério Atendido: </span>
                  <span className="text-black">{ageResult.message}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-rose-50 border-2 border-rose-400 text-black text-xs">
                <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-black text-sm text-black">Acesso Bloqueado para Menores de 18 Anos</p>
                  <p className="leading-relaxed font-bold text-black">{ageResult.message}</p>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 text-xs text-black font-bold italic">
              <span>Informe sua data de nascimento acima para liberar o preenchimento das perguntas.</span>
            </div>
          )}
        </div>

        {/* Progress indicator */}
        {ageResult.isAdult && (
          <div className="bg-slate-100 p-4 sm:p-5 rounded-xl border-2 border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1.5 w-full sm:w-auto">
              <span className="text-[11px] font-black text-black uppercase tracking-wider block">
                Progresso do Questionário
              </span>
              <div className="w-full sm:w-64 bg-slate-300 h-2.5 rounded-full overflow-hidden border border-slate-400">
                <div
                  className="bg-indigo-700 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-black text-black">
                {answeredCount} de {questions.length} respondidas ({progressPercent}%)
              </span>
            </div>
          </div>
        )}

        {/* Global Error Banner if any */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3.5 rounded-lg bg-rose-50 border-2 border-rose-400 text-black text-xs font-bold">
            <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* QUESTIONS LIST (DISABLED IF UNDER 18 OR NO BIRTHDATE) */}
        {/* ========================================================= */}
        <fieldset
          disabled={!ageResult.isAdult || deviceBlocked}
          className={`space-y-6 transition-opacity ${
            !ageResult.isAdult || deviceBlocked ? 'opacity-40 pointer-events-none select-none' : 'opacity-100'
          }`}
        >
          {questions.map((question, index) => {
            const currentVal = answers[question.id];

            return (
              <div
                key={question.id}
                className="p-5 sm:p-6 rounded-xl bg-white border-2 border-slate-300 hover:border-black transition shadow-xs space-y-4"
              >
                {/* Question Header */}
                <div>
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-black text-white text-xs font-black shrink-0 mt-0.5 shadow-xs">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-black leading-snug">
                        {question.title}
                        {question.required && (
                          <span className="text-rose-700 ml-1 font-black" title="Obrigatória">*</span>
                        )}
                      </h3>
                      {question.description && (
                        <p className="text-xs font-bold text-black mt-1">{question.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 1. RADIO / SINGLE CHOICE */}
                {question.type === 'radio' && question.options && (
                  <div className="space-y-2.5 pt-1 pl-0 sm:pl-10">
                    {question.options.map((option, oIdx) => {
                      const optId = `${question.id}-opt-${oIdx}`;
                      const isChecked = currentVal === option;

                      return (
                        <label
                          key={oIdx}
                          htmlFor={optId}
                          className={`flex items-center gap-3 p-3.5 rounded-lg border-2 text-sm cursor-pointer transition ${
                            isChecked
                              ? 'bg-indigo-50 border-indigo-700 text-black font-bold shadow-xs'
                              : 'bg-white border-slate-300 text-black hover:border-slate-700 hover:bg-slate-50 font-semibold'
                          }`}
                        >
                          <input
                            type="radio"
                            id={optId}
                            name={question.id}
                            value={option}
                            checked={isChecked}
                            onChange={() => handleRadioChange(question.id, option)}
                            className="w-4 h-4 text-indigo-700 focus:ring-indigo-700 border-2 border-slate-400"
                            required={question.required}
                          />
                          <span className="text-black">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* 2. CHECKBOX / MULTIPLE CHOICE */}
                {question.type === 'checkbox' && question.options && (
                  <div className="space-y-2.5 pt-1 pl-0 sm:pl-10">
                    <p className="text-xs text-black font-bold italic mb-2">
                      (Selecione uma ou mais opções aplicáveis)
                    </p>
                    {question.options.map((option, oIdx) => {
                      const optId = `${question.id}-chk-${oIdx}`;
                      const isChecked =
                        Array.isArray(currentVal) && currentVal.includes(option);

                      return (
                        <label
                          key={oIdx}
                          htmlFor={optId}
                          className={`flex items-center gap-3 p-3.5 rounded-lg border-2 text-sm cursor-pointer transition ${
                            isChecked
                              ? 'bg-indigo-50 border-indigo-700 text-black font-bold shadow-xs'
                              : 'bg-white border-slate-300 text-black hover:border-slate-700 hover:bg-slate-50 font-semibold'
                          }`}
                        >
                          <input
                            type="checkbox"
                            id={optId}
                            value={option}
                            checked={isChecked}
                            onChange={() => handleCheckboxChange(question.id, option)}
                            className="w-4 h-4 rounded text-indigo-700 focus:ring-indigo-700 border-2 border-slate-400"
                          />
                          <span className="text-black">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* 3. SHORT TEXT */}
                {question.type === 'text' && (
                  <div className="pt-1 pl-0 sm:pl-10">
                    <input
                      type="text"
                      value={(currentVal as string) || ''}
                      onChange={(e) => handleTextChange(question.id, e.target.value)}
                      placeholder="Digite sua resposta..."
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-400 text-black text-sm font-bold bg-white focus:outline-none focus:border-indigo-700 shadow-xs placeholder:text-slate-500"
                      required={question.required}
                    />
                  </div>
                )}

                {/* 4. TEXTAREA */}
                {question.type === 'textarea' && (
                  <div className="pt-1 pl-0 sm:pl-10">
                    <textarea
                      rows={3}
                      value={(currentVal as string) || ''}
                      onChange={(e) => handleTextChange(question.id, e.target.value)}
                      placeholder="Escreva detalhadamente sua resposta..."
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-400 text-black text-sm font-bold bg-white focus:outline-none focus:border-indigo-700 shadow-xs placeholder:text-slate-500"
                      required={question.required}
                    />
                  </div>
                )}

                {/* 5. RATING (1 to 5) */}
                {question.type === 'rating' && (
                  <div className="flex flex-wrap items-center gap-3 pt-2 pl-0 sm:pl-10">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const isSelected = currentVal === String(val);
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleRadioChange(question.id, String(val))}
                          className={`w-12 h-12 rounded-lg font-black text-base transition border-2 cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-700 text-white border-indigo-950 shadow-md'
                              : 'bg-slate-100 text-black border-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                    <span className="text-xs text-black font-extrabold ml-2">
                      (Escala Likert: 1 = Menor concordância / 5 = Maior concordância)
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </fieldset>

        {/* Submit Action Bar */}
        <div className="pt-6 border-t-2 border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-black flex items-center gap-2 font-bold">
            <UserCheck className="w-4 h-4 text-black" />
            <span>
              Respondendo como: <strong className="text-black underline">{user?.email}</strong>
            </span>
          </div>

          <button
            type="submit"
            disabled={!ageResult.isAdult || submitting || deviceBlocked}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-3.5 rounded-full font-black text-xs uppercase tracking-wider transition ${
              ageResult.isAdult && !submitting && !deviceBlocked
                ? 'bg-black hover:bg-slate-800 text-white cursor-pointer shadow-lg'
                : 'bg-slate-300 text-slate-600 border border-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gravando Resposta...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{previousResponse ? 'Atualizar Respostas' : 'Enviar Respostas'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
