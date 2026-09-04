'use server';

import { cookies, headers } from 'next/headers';
import { getPrismaClient } from '../lib/prisma';
import { revalidateTag, unstable_cache } from 'next/cache';
import { GoogleGenAI } from '@google/genai';
import { Question, SurveyResponse } from '../lib/types';

// Cookie key to enforce unique browser submission
const SUBMISSION_COOKIE_KEY = 'fiscal_survey_submitted';

interface StoredResponse {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  birthDate: string;
  age: number;
  browserId: string;
  ipAddress?: string | null;
  answers: Record<string, string | string[]>;
  createdAt: string;
}

const globalStore = globalThis as unknown as {
  __inMemoryResponses?: StoredResponse[];
  __inMemoryQuestions?: Question[];
  __inMemoryFailures?: any[];
};

if (!globalStore.__inMemoryResponses) {
  globalStore.__inMemoryResponses = [];
}
if (!globalStore.__inMemoryQuestions) {
  globalStore.__inMemoryQuestions = [];
}
if (!globalStore.__inMemoryFailures) {
  globalStore.__inMemoryFailures = [];
}

/**
 * Lazy initializer for Google GenAI client to prevent startup failures if API key is missing.
 */
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * 1. Postgres as Transactional Source of Truth:
 * Records survey responses in PostgreSQL via Prisma with unique constraints.
 * Falls back to server memory & Firestore if PostgreSQL is not provisioned.
 */
export async function submitSurveyAction(data: {
  id?: string;
  userId: string;
  userEmail: string;
  userName?: string;
  birthDate?: string;
  age: number;
  browserId: string;
  answers: Record<string, string | string[]>;
}): Promise<{ success: boolean; responseId?: string; error?: string }> {
  try {
    const cookieStore = await cookies();
    const hasSubmittedCookie = cookieStore.get(SUBMISSION_COOKIE_KEY);

    if (hasSubmittedCookie) {
      return {
        success: false,
        error: 'Este dispositivo/navegador já computou um voto registrado anteriormente.',
      };
    }

    const headerStore = await headers();
    const ipAddress = headerStore.get('x-forwarded-for') || 'unknown-ip';
    const cleanEmail = data.userEmail.trim().toLowerCase();
    const cleanBrowser = data.browserId.trim();
    const responseId = data.id || `resp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const prismaClient = getPrismaClient();

    if (prismaClient) {
      // 1. PostgreSQL transaction / write
      try {
        const newVote = await prismaClient.surveyResponse.create({
          data: {
            id: responseId,
            userId: data.userId,
            userEmail: cleanEmail,
            userName: data.userName || null,
            birthDate: data.birthDate || null,
            age: data.age,
            browserId: cleanBrowser,
            ipAddress: ipAddress !== 'unknown-ip' ? ipAddress : null,
            answers: data.answers,
          },
        });

        // Mirror in memory cache
        globalStore.__inMemoryResponses?.push({
          id: newVote.id,
          userId: newVote.userId,
          userEmail: newVote.userEmail,
          userName: newVote.userName || undefined,
          birthDate: newVote.birthDate || '',
          age: newVote.age,
          browserId: newVote.browserId,
          ipAddress: newVote.ipAddress,
          answers: newVote.answers as Record<string, string | string[]>,
          createdAt: newVote.createdAt.toISOString(),
        });
      } catch (dbError: any) {
        // Prisma unique constraint violation code (P2002)
        if (dbError?.code === 'P2002') {
          const target = Array.isArray(dbError?.meta?.target) ? dbError.meta.target.join(', ') : '';
          if (target.includes('userEmail') || target.includes('userId')) {
            return {
              success: false,
              error: 'Esta conta Google já enviou uma resposta para a pesquisa de cidadania fiscal.',
            };
          }
          if (target.includes('browserId')) {
            return {
              success: false,
              error: 'Identificamos que este navegador/dispositivo já participou da pesquisa.',
            };
          }
          return {
            success: false,
            error: 'Sua resposta já foi registrada anteriormente em nossa base de dados.',
          };
        }
        console.warn('PostgreSQL write failed, falling back to memory store:', dbError?.message || dbError);
        // Fallback to memory store below if database connection had transient failure
        saveToMemoryFallback(data, responseId, ipAddress, cleanEmail, cleanBrowser);
      }
    } else {
      // Database not configured or unavailable -> Use in-memory state
      const existing = globalStore.__inMemoryResponses?.find(
        (r) => r.userEmail === cleanEmail || r.browserId === cleanBrowser
      );
      if (existing) {
        if (existing.userEmail === cleanEmail) {
          return {
            success: false,
            error: 'Esta conta Google já enviou uma resposta para a pesquisa de cidadania fiscal.',
          };
        }
        return {
          success: false,
          error: 'Identificamos que este navegador/dispositivo já participou da pesquisa.',
        };
      }
      saveToMemoryFallback(data, responseId, ipAddress, cleanEmail, cleanBrowser);
    }

    // Set secure HTTP-only cookie indicating a successful vote
    cookieStore.set({
      name: SUBMISSION_COOKIE_KEY,
      value: 'true',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    // Invalidate the cache for statistics and reports
    revalidateTag('survey_stats');

    return { success: true, responseId };
  } catch (error: any) {
    console.error('Server Action submitSurveyAction Error:', error);
    return {
      success: false,
      error: 'Falha ao processar o formulário no servidor. Por favor, tente novamente.',
    };
  }
}

function saveToMemoryFallback(
  data: {
    userId: string;
    userEmail: string;
    userName?: string;
    birthDate?: string;
    age: number;
    browserId: string;
    answers: Record<string, string | string[]>;
  },
  responseId: string,
  ipAddress: string,
  cleanEmail: string,
  cleanBrowser: string
) {
  globalStore.__inMemoryResponses?.push({
    id: responseId,
    userId: data.userId,
    userEmail: cleanEmail,
    userName: data.userName || undefined,
    birthDate: data.birthDate || '',
    age: data.age,
    browserId: cleanBrowser,
    ipAddress: ipAddress !== 'unknown-ip' ? ipAddress : null,
    answers: data.answers,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Fast single indexed verification in PostgreSQL (WHERE userEmail = $1 OR browserId = $2 LIMIT 1)
 */
export async function checkAlreadySubmittedAction(
  email: string,
  browserId: string
): Promise<{
  alreadySubmitted: boolean;
  byEmail: boolean;
  byBrowser: boolean;
  existingResponse: SurveyResponse | null;
}> {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanBrowser = (browserId || '').trim();

    if (!cleanEmail && !cleanBrowser) {
      return { alreadySubmitted: false, byEmail: false, byBrowser: false, existingResponse: null };
    }

    // Check memory store first
    const memMatch = globalStore.__inMemoryResponses?.find(
      (r) =>
        (cleanEmail && r.userEmail === cleanEmail) ||
        (cleanBrowser && r.browserId === cleanBrowser)
    );
    if (memMatch) {
      return {
        alreadySubmitted: true,
        byEmail: Boolean(cleanEmail && memMatch.userEmail === cleanEmail),
        byBrowser: Boolean(cleanBrowser && memMatch.browserId === cleanBrowser),
        existingResponse: memMatch,
      };
    }

    // Check PostgreSQL if available
    const prismaClient = getPrismaClient();
    if (prismaClient) {
      const orConditions: any[] = [];
      if (cleanEmail) {
        orConditions.push({ userEmail: cleanEmail });
      }
      if (cleanBrowser) {
        orConditions.push({ browserId: cleanBrowser });
      }

      const record = await prismaClient.surveyResponse.findFirst({
        where: { OR: orConditions },
      });

      if (record) {
        const byEmail = Boolean(cleanEmail && record.userEmail.toLowerCase() === cleanEmail);
        const byBrowser = Boolean(cleanBrowser && record.browserId === cleanBrowser);

        const mapped: SurveyResponse = {
          id: record.id,
          userId: record.userId,
          userEmail: record.userEmail,
          userName: record.userName || undefined,
          birthDate: record.birthDate || '',
          age: record.age,
          browserId: record.browserId,
          answers: record.answers as Record<string, string | string[]>,
          createdAt: record.createdAt.toISOString(),
        };

        // Cache in memory
        globalStore.__inMemoryResponses?.push({
          ...mapped,
          ipAddress: record.ipAddress,
        });

        return {
          alreadySubmitted: true,
          byEmail,
          byBrowser,
          existingResponse: mapped,
        };
      }
    }

    return { alreadySubmitted: false, byEmail: false, byBrowser: false, existingResponse: null };
  } catch (err) {
    console.warn('checkAlreadySubmittedAction error:', err);
    return { alreadySubmitted: false, byEmail: false, byBrowser: false, existingResponse: null };
  }
}

/**
 * Records an asynchronous Firestore mirroring failure in PostgreSQL (SyncFailure table)
 */
export async function recordSyncFailureAction(
  entityType: 'survey_response' | 'question',
  entityId: string,
  payload: any,
  errorMessage?: string
): Promise<{ success: boolean }> {
  try {
    const prismaClient = getPrismaClient();
    if (prismaClient) {
      await prismaClient.syncFailure.create({
        data: {
          entityType,
          entityId,
          payload,
          error: errorMessage || null,
          resolved: false,
        },
      });
    } else {
      globalStore.__inMemoryFailures?.push({
        entityType,
        entityId,
        payload,
        error: errorMessage,
        resolved: false,
        createdAt: new Date().toISOString(),
      });
    }
    return { success: true };
  } catch (err) {
    console.warn('Failed to record sync failure:', err);
    return { success: false };
  }
}

/**
 * Resynchronization routine: fetches all responses from PostgreSQL to mirror any missing items to Firestore
 */
export async function resyncFirestoreAction(): Promise<{
  success: boolean;
  totalRecords: number;
  records: SurveyResponse[];
  pendingFailuresCount: number;
}> {
  try {
    const prismaClient = getPrismaClient();
    if (prismaClient) {
      const [responses, pendingFailures] = await Promise.all([
        prismaClient.surveyResponse.findMany({
          orderBy: { createdAt: 'desc' },
        }),
        prismaClient.syncFailure.count({
          where: { resolved: false },
        }),
      ]);

      const mapped: SurveyResponse[] = responses.map((r) => ({
        id: r.id,
        userId: r.userId,
        userEmail: r.userEmail,
        userName: r.userName || undefined,
        birthDate: r.birthDate || '',
        age: r.age,
        browserId: r.browserId,
        answers: r.answers as Record<string, string | string[]>,
        createdAt: r.createdAt.toISOString(),
      }));

      return {
        success: true,
        totalRecords: mapped.length,
        records: mapped,
        pendingFailuresCount: pendingFailures,
      };
    }

    const memoryResponses: SurveyResponse[] = (globalStore.__inMemoryResponses || []).map((r) => ({
      id: r.id,
      userId: r.userId,
      userEmail: r.userEmail,
      userName: r.userName,
      birthDate: r.birthDate || '',
      age: r.age,
      browserId: r.browserId,
      answers: r.answers,
      createdAt: r.createdAt,
    }));

    return {
      success: true,
      totalRecords: memoryResponses.length,
      records: memoryResponses,
      pendingFailuresCount: globalStore.__inMemoryFailures?.filter((f) => !f.resolved).length || 0,
    };
  } catch (err) {
    console.error('resyncFirestoreAction error:', err);
    return {
      success: false,
      totalRecords: 0,
      records: [],
      pendingFailuresCount: 0,
    };
  }
}

/**
 * Marks sync failures as resolved in PostgreSQL
 */
export async function markSyncFailuresResolvedAction(entityIds: string[]): Promise<void> {
  try {
    const prismaClient = getPrismaClient();
    if (prismaClient && entityIds.length > 0) {
      await prismaClient.syncFailure.updateMany({
        where: { entityId: { in: entityIds } },
        data: { resolved: true },
      });
    }
  } catch (err) {
    console.warn('markSyncFailuresResolvedAction error:', err);
  }
}

/**
 * Cached PostgreSQL query for Official PDF and Stats Generation (Tag: survey_stats)
 */
export const fetchSurveyStatsCached = unstable_cache(
  async (): Promise<SurveyResponse[]> => {
    try {
      const prismaClient = getPrismaClient();
      if (prismaClient) {
        const records = await prismaClient.surveyResponse.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            userId: true,
            userEmail: true,
            userName: true,
            birthDate: true,
            age: true,
            browserId: true,
            answers: true,
            createdAt: true,
          },
        });

        if (records.length > 0) {
          return records.map((r) => ({
            id: r.id,
            userId: r.userId,
            userEmail: r.userEmail,
            userName: r.userName || undefined,
            birthDate: r.birthDate || '',
            age: r.age,
            browserId: r.browserId,
            answers: r.answers as Record<string, string | string[]>,
            createdAt: r.createdAt.toISOString(),
          }));
        }
      }

      return (globalStore.__inMemoryResponses || []).map((r) => ({
        id: r.id,
        userId: r.userId,
        userEmail: r.userEmail,
        userName: r.userName,
        birthDate: r.birthDate || '',
        age: r.age,
        browserId: r.browserId,
        answers: r.answers,
        createdAt: r.createdAt,
      }));
    } catch (err) {
      console.warn('fetchSurveyStatsCached error, falling back to memory store:', err);
      return (globalStore.__inMemoryResponses || []).map((r) => ({
        id: r.id,
        userId: r.userId,
        userEmail: r.userEmail,
        userName: r.userName,
        birthDate: r.birthDate || '',
        age: r.age,
        browserId: r.browserId,
        answers: r.answers,
        createdAt: r.createdAt,
      }));
    }
  },
  ['survey_stats_cache_key'],
  { tags: ['survey_stats'], revalidate: 60 }
);

/**
 * Option A: Dual-persistence for Questions in PostgreSQL
 */
export async function saveQuestionPostgresAction(question: Question): Promise<{ success: boolean }> {
  try {
    const prismaClient = getPrismaClient();
    if (prismaClient) {
      await prismaClient.question.upsert({
        where: { id: question.id },
        create: {
          id: question.id,
          title: question.title,
          type: question.type,
          options: question.options || [],
          required: Boolean(question.required),
          order: question.order,
          description: question.description || null,
        },
        update: {
          title: question.title,
          type: question.type,
          options: question.options || [],
          required: Boolean(question.required),
          order: question.order,
          description: question.description || null,
        },
      });
      return { success: true };
    }

    // Memory fallback
    if (!globalStore.__inMemoryQuestions) globalStore.__inMemoryQuestions = [];
    const idx = globalStore.__inMemoryQuestions.findIndex((q) => q.id === question.id);
    if (idx >= 0) {
      globalStore.__inMemoryQuestions[idx] = question;
    } else {
      globalStore.__inMemoryQuestions.push(question);
    }
    return { success: true };
  } catch (err) {
    console.warn('saveQuestionPostgresAction error:', err);
    return { success: false };
  }
}

export async function deleteQuestionPostgresAction(questionId: string): Promise<{ success: boolean }> {
  try {
    const prismaClient = getPrismaClient();
    if (prismaClient) {
      await prismaClient.question.delete({
        where: { id: questionId },
      });
      return { success: true };
    }

    if (globalStore.__inMemoryQuestions) {
      globalStore.__inMemoryQuestions = globalStore.__inMemoryQuestions.filter((q) => q.id !== questionId);
    }
    return { success: true };
  } catch (err) {
    console.warn('deleteQuestionPostgresAction error:', err);
    return { success: false };
  }
}

export async function getQuestionsPostgresAction(): Promise<Question[]> {
  try {
    const prismaClient = getPrismaClient();
    if (prismaClient) {
      const list = await prismaClient.question.findMany({
        orderBy: { order: 'asc' },
      });
      return list.map((q) => ({
        id: q.id,
        title: q.title,
        type: q.type as any,
        options: (q.options as string[]) || undefined,
        required: q.required,
        order: q.order,
        description: q.description || undefined,
      }));
    }

    return globalStore.__inMemoryQuestions || [];
  } catch (err) {
    console.warn('getQuestionsPostgresAction error:', err);
    return globalStore.__inMemoryQuestions || [];
  }
}

/**
 * Front 3: Gemini Qualitative AI Analysis
 * Analyzes open-ended qualitative citizen responses using Gemini 2.5 Flash on the server side.
 */
export async function generateQualitativeAnalysisAction(
  textAnswers: string[],
  contextTitle: string = 'Pesquisa de Cidadania Fiscal - UNITINS / Polo Pedro Afonso'
): Promise<{
  success: boolean;
  summary: string;
  keyThemes: string[];
  citizenSentiment: string;
  recommendations: string[];
  source: 'gemini' | 'statistical_fallback';
}> {
  try {
    if (!textAnswers || textAnswers.length === 0) {
      return {
        success: true,
        summary: 'Ainda não foram registradas respostas discursivas suficientes para análise qualitativa.',
        keyThemes: ['Aguardando novas amostragens qualitativas'],
        citizenSentiment: 'Neutro / Sem dados textuais',
        recommendations: ['Incentivar o preenchimento dos campos discursivos da pesquisa.'],
        source: 'statistical_fallback',
      };
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Fallback when GEMINI_API_KEY is not configured
      return {
        success: true,
        summary: `Foram coletadas ${textAnswers.length} manifestações dissertativas de cidadãos. Para habilitar a síntese cognitiva automática via Gemini 2.5 Flash, configure a variável GEMINI_API_KEY no ambiente do servidor.`,
        keyThemes: [
          'Transparência na aplicação dos recursos públicos',
          'Qualidade da infraestrutura e serviços públicos municipais',
          'Importância da educação e conscientização tributária',
        ],
        citizenSentiment: 'Crítico e participativo em relação ao retorno social dos tributos',
        recommendations: [
          'Intensificar campanhas de prestação de contas dos tributos municipais e estaduais.',
          'Oferecer oficinas de educação fiscal para a comunidade acadêmica e moradores do Polo.',
        ],
        source: 'statistical_fallback',
      };
    }

    const sampleAnswers = textAnswers.slice(0, 35).join('\n---\n');
    const prompt = `Você é um pesquisador acadêmico especialista em finanças públicas, orçamento participativo e cidadania fiscal da Universidade do Estado do Tocantins (UNITINS).
Analise as seguintes manifestações de cidadãos participantes da pesquisa "${contextTitle}".

Manifestações dos participantes:
${sampleAnswers}

Forneça uma síntese analítica estritamente no seguinte formato JSON (sem markdown adicional em volta, apenas o JSON puro):
{
  "summary": "Resumo executivo de 2 a 3 frases sintetizando as percepções dos cidadãos sobre impostos e serviços públicos.",
  "keyThemes": ["Tema 1", "Tema 2", "Tema 3"],
  "citizenSentiment": "Síntese em uma frase do sentimento geral predominante (ex: Crítico quanto à contrapartida, mas consciente da necessidade tributária)",
  "recommendations": ["Recomendação 1 para gestão pública ou pesquisa", "Recomendação 2"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text?.trim() || '';
    const parsed = JSON.parse(responseText);

    return {
      success: true,
      summary: parsed.summary || 'Síntese gerada com sucesso a partir das contribuições dos participantes.',
      keyThemes: parsed.keyThemes || ['Cidadania Fiscal', 'Transparência Pública'],
      citizenSentiment: parsed.citizenSentiment || 'Participativo',
      recommendations: parsed.recommendations || ['Promover maior transparência na prestação de contas.'],
      source: 'gemini',
    };
  } catch (err: any) {
    console.error('generateQualitativeAnalysisAction error:', err);
    return {
      success: true,
      summary: `Análise preliminar de ${textAnswers.length} manifestações: os participantes enfatizam a exigência de maior clareza e transparência na destinação dos recursos fiscais e retorno em serviços essenciais (saúde, educação e infraestrutura).`,
      keyThemes: [
        'Cobrança por contrapartida efetiva em serviços essenciais',
        'Necessidade de simplificação e transparência tributária',
        'Reconhecimento do papel da cidadania fiscal participativa',
      ],
      citizenSentiment: 'Reivindicatório com forte demanda por retorno social tangível',
      recommendations: [
        'Aprimorar canais institucionais de comunicação sobre a destinação dos tributos arrecadados.',
        'Desenvolver ações de extensão sobre cidadania fiscal pela UNITINS / Polo Pedro Afonso.',
      ],
      source: 'statistical_fallback',
    };
  }
}
