/**
 * DECISÃO ARQUITETURAL (OPÇÃO A): Persistência Dupla Integral (PostgreSQL + Firestore)
 *
 * 1. PostgreSQL (via Prisma & Server Actions):
 *    - Atua como a FONTE DE VERDADE TRANSACIONAL para a integridade acadêmica da pesquisa da UNITINS.
 *    - Garante unicidade através de constraints estritas no banco (userId, userEmail, browserId, ipAddress)
 *      e validação de cookie HTTP-only em submitSurveyAction.
 *    - Serve de base oficial para a extração de dados estatísticos, auditoria e emissão do Relatório
 *      Científico em PDF (via fetchSurveyStatsCached), com invalidação reativa (revalidateTag('survey_stats')).
 *
 * 2. Google Cloud Firestore:
 *    - Atua como camada de sincronização em tempo real e cache reativo de alta disponibilidade.
 *    - Recebe espelhamento assíncrono após confirmação bem-sucedida no PostgreSQL, sem bloquear a UI.
 *    - Alimenta o AdminDashboard e a aba de Relatórios em tempo real via onSnapshot.
 *    - Em caso de falha de conexão com o Firestore após confirmação no Postgres, a inconsistência é
 *      gravada na tabela SyncFailure do Postgres para reconciliação automática ou sob demanda ("Ressincronizar").
 *
 * 3. Perguntas (Opção A):
 *    - Mantidas no Firestore para carregamento instantâneo no cliente e sincronizadas no PostgreSQL
 *      (modelo Question no Prisma), garantindo redundância total de metadados e integridade metodológica.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import { Question, SurveyResponse, SurveyStats } from './types';
import { DEFAULT_QUESTIONS } from './defaultQuestions';
import {
  submitSurveyAction,
  checkAlreadySubmittedAction,
  recordSyncFailureAction,
  fetchSurveyStatsCached,
  saveQuestionPostgresAction,
  deleteQuestionPostgresAction,
  resyncFirestoreAction,
  markSyncFailuresResolvedAction,
} from '@/app/actions';

const LOCAL_STORAGE_QUESTIONS_KEY = 'unitins_fiscal_questions_v1';
const LOCAL_STORAGE_MY_RESPONSE_KEY = 'unitins_fiscal_my_last_response';

/**
 * Loads the active list of questions (Dual-persistence Option A)
 */
export async function getQuestionsList(): Promise<Question[]> {
  let localQuestions: Question[] = DEFAULT_QUESTIONS;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localQuestions = parsed;
        }
      } catch {
        // ignore
      }
    }
  }

  // If Firestore is available, fetch in background and update local cache if successful
  if (isConfigured && db) {
    getDocs(query(collection(db, 'perguntas'), orderBy('order', 'asc')))
      .then((qSnap) => {
        if (!qSnap.empty) {
          const list: Question[] = [];
          qSnap.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Question, 'id'>) });
          });
          if (typeof window !== 'undefined' && list.length > 0) {
            localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(list));
          }
        }
      })
      .catch((err) => {
        console.warn('Background Firestore question sync warning:', err);
      });
  }

  return localQuestions;
}

/**
 * Saves or updates a question in both Firestore and PostgreSQL (Option A)
 */
export async function saveQuestion(question: Question): Promise<void> {
  const currentQuestions = await getQuestionsList();
  const exists = currentQuestions.some((q) => q.id === question.id);
  const updated = exists
    ? currentQuestions.map((q) => (q.id === question.id ? question : q))
    : [...currentQuestions, question];

  // 1. Dual persistence: Save to PostgreSQL
  try {
    await saveQuestionPostgresAction(question);
  } catch (err) {
    console.warn('Failed to persist question in Postgres:', err);
  }

  // 2. Save to Firestore if available
  if (isConfigured && db) {
    try {
      await setDoc(doc(db, 'perguntas', question.id), {
        title: question.title,
        type: question.type,
        options: question.options || [],
        required: Boolean(question.required),
        order: question.order,
        description: question.description || '',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Failed saving question to Firestore:', err);
    }
  }

  // 3. Local cache
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(updated));
  }
}

/**
 * Deletes a question by ID in both stores (Option A)
 */
export async function deleteQuestionById(questionId: string): Promise<void> {
  const currentQuestions = await getQuestionsList();
  const updated = currentQuestions.filter((q) => q.id !== questionId);

  // 1. Delete from PostgreSQL
  try {
    await deleteQuestionPostgresAction(questionId);
  } catch (err) {
    console.warn('Failed deleting question from Postgres:', err);
  }

  // 2. Delete from Firestore
  if (isConfigured && db) {
    try {
      await deleteDoc(doc(db, 'perguntas', questionId));
    } catch (err) {
      console.warn('Failed deleting question from Firestore:', err);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(updated));
  }
}

/**
 * Restores the questions list back to the UNITINS academic default questions
 */
export async function restoreDefaultQuestions(): Promise<Question[]> {
  if (isConfigured && db) {
    try {
      const qRef = collection(db, 'perguntas');
      const qSnap = await getDocs(qRef);
      for (const docSnap of qSnap.docs) {
        await deleteDoc(doc(db, 'perguntas', docSnap.id));
      }
      for (const q of DEFAULT_QUESTIONS) {
        await setDoc(doc(db, 'perguntas', q.id), {
          ...q,
          updatedAt: serverTimestamp(),
        });
        saveQuestionPostgresAction(q).catch(() => {});
      }
    } catch (err) {
      console.warn('Error resetting Firestore questions:', err);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(DEFAULT_QUESTIONS));
  }

  return DEFAULT_QUESTIONS;
}

/**
 * Submits a new survey response:
 * 1. Executes PostgreSQL transaction (source of truth & constraint validation).
 * 2. On success, asynchronously mirrors to Firestore (real-time read layer).
 * 3. Records any Firestore sync failures in PostgreSQL for reconciliation.
 */
export async function submitSurveyResponse(response: SurveyResponse): Promise<void> {
  // Step 1: Write to PostgreSQL via server action first
  const result = await submitSurveyAction({
    id: response.id,
    userId: response.userId,
    userEmail: response.userEmail,
    userName: response.userName,
    birthDate: response.birthDate,
    age: response.age,
    browserId: response.browserId,
    answers: response.answers,
  });

  if (!result.success) {
    throw new Error(result.error || 'Falha ao validar ou registrar a resposta no servidor.');
  }

  // Step 2: Store only the current user's last response in localStorage (stop rewriting entire database)
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_MY_RESPONSE_KEY, JSON.stringify(response));
    } catch {
      // ignore
    }
  }

  // Step 3: Asynchronously mirror to Firestore without blocking the UI response
  if (isConfigured && db) {
    const firestorePayload = {
      ...response,
      serverCreatedAt: serverTimestamp(),
    };

    setDoc(doc(db, 'respostas', response.id), firestorePayload).catch(async (syncErr) => {
      console.error('Async Firestore mirror failed, registering in Postgres sync_failures:', syncErr);
      try {
        await recordSyncFailureAction(
          'survey_response',
          response.id,
          response,
          syncErr?.message || 'Firestore setDoc async mirror failed'
        );
      } catch (recordErr) {
        console.error('Failed to log sync failure in Postgres:', recordErr);
      }
    });
  }
}

/**
 * Checks if a user (by Google email) or a device (by browserId) has already submitted a response.
 * Uses a single fast indexed query in PostgreSQL via checkAlreadySubmittedAction.
 */
export async function checkUserOrBrowserAlreadySubmitted(
  email: string,
  browserId: string
): Promise<{
  alreadySubmitted: boolean;
  byEmail: boolean;
  byBrowser: boolean;
  existingResponse: SurveyResponse | null;
}> {
  try {
    // Single indexed query to PostgreSQL (WHERE userEmail = $1 OR browserId = $2 LIMIT 1)
    const result = await checkAlreadySubmittedAction(email, browserId);
    if (result.alreadySubmitted) {
      return result;
    }
  } catch (err) {
    console.warn('PostgreSQL check query encountered error, checking local/Firestore backup:', err);
  }

  // Backup check in local storage for current user's prior response
  if (typeof window !== 'undefined') {
    try {
      const mySaved = localStorage.getItem(LOCAL_STORAGE_MY_RESPONSE_KEY);
      if (mySaved) {
        const parsed: SurveyResponse = JSON.parse(mySaved);
        const matchEmail = email && parsed.userEmail.toLowerCase() === email.toLowerCase().trim();
        const matchBrowser = browserId && parsed.browserId === browserId;
        if (matchEmail || matchBrowser) {
          return {
            alreadySubmitted: true,
            byEmail: Boolean(matchEmail),
            byBrowser: Boolean(matchBrowser),
            existingResponse: parsed,
          };
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    alreadySubmitted: false,
    byEmail: false,
    byBrowser: false,
    existingResponse: null,
  };
}

/**
 * Retrieves all survey responses from PostgreSQL via fetchSurveyStatsCached
 * for official stats and scientific PDF reports.
 */
export async function getAllResponses(): Promise<SurveyResponse[]> {
  try {
    const responses = await fetchSurveyStatsCached();
    if (responses && responses.length > 0) {
      return responses;
    }
  } catch (err) {
    console.warn('Could not fetch cached responses from Postgres, checking Firestore:', err);
  }

  // Fallback to Firestore
  if (isConfigured && db) {
    try {
      const rSnap = await getDocs(query(collection(db, 'respostas'), orderBy('createdAt', 'desc')));
      if (!rSnap.empty) {
        const list: SurveyResponse[] = [];
        rSnap.forEach((docSnap) => {
          list.push(docSnap.data() as SurveyResponse);
        });
        return list;
      }
    } catch (err) {
      console.warn('Firestore fallback fetch failed:', err);
    }
  }

  // Fallback to current user's local response
  if (typeof window !== 'undefined') {
    const mySaved = localStorage.getItem(LOCAL_STORAGE_MY_RESPONSE_KEY);
    if (mySaved) {
      try {
        return [JSON.parse(mySaved)];
      } catch {
        // ignore
      }
    }
  }

  return [];
}

/**
 * Subscribes to real-time response changes via Firestore onSnapshot
 * for the live Admin Dashboard.
 */
export function subscribeToResponses(
  onUpdate: (responses: SurveyResponse[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!isConfigured || !db) {
    // If Firebase is not configured, fetch once from Postgres and return no-op unsubscriber
    getAllResponses().then(onUpdate).catch(() => {});
    return () => {};
  }

  const q = query(collection(db, 'respostas'), orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const list: SurveyResponse[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as SurveyResponse);
      });
      onUpdate(list);
    },
    (err) => {
      console.warn('Firestore real-time subscription error, falling back to cached fetch:', err);
      if (onError) onError(err);
      getAllResponses().then(onUpdate).catch(() => {});
    }
  );

  return unsubscribe;
}

/**
 * Reconciles PostgreSQL responses to Firestore (triggered by admin "Ressincronizar" button)
 */
export async function resyncPostgresToFirestore(): Promise<{
  success: boolean;
  syncedCount: number;
  message: string;
}> {
  try {
    const res = await resyncFirestoreAction();
    if (!res.success || !res.records) {
      return { success: false, syncedCount: 0, message: 'Falha ao buscar registros do PostgreSQL.' };
    }

    if (!isConfigured || !db) {
      return {
        success: false,
        syncedCount: 0,
        message: 'Firestore não configurado para espelhamento.',
      };
    }

    const resolvedIds: string[] = [];
    let synced = 0;

    for (const record of res.records) {
      await setDoc(doc(db, 'respostas', record.id), {
        ...record,
        serverCreatedAt: serverTimestamp(),
      });
      resolvedIds.push(record.id);
      synced++;
    }

    if (resolvedIds.length > 0) {
      await markSyncFailuresResolvedAction(resolvedIds);
    }

    return {
      success: true,
      syncedCount: synced,
      message: `${synced} respostas verificadas e reconciliadas com sucesso no Firestore.`,
    };
  } catch (err: any) {
    console.error('resyncPostgresToFirestore error:', err);
    return {
      success: false,
      syncedCount: 0,
      message: `Erro durante ressincronização: ${err?.message || 'Falha desconhecida'}`,
    };
  }
}

/**
 * Clears responses across both layers (Administrator maintenance action)
 */
export async function resetAllResponses(): Promise<void> {
  if (isConfigured && db) {
    try {
      const rRef = collection(db, 'respostas');
      const rSnap = await getDocs(rRef);
      for (const docSnap of rSnap.docs) {
        await deleteDoc(doc(db, 'respostas', docSnap.id));
      }
    } catch (err) {
      console.warn('Error clearing Firestore responses:', err);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_MY_RESPONSE_KEY);
  }
}

/**
 * Compiles statistical data for reports and charts
 */
export function calculateSurveyStats(
  questions: Question[],
  responses: SurveyResponse[]
): SurveyStats {
  const total = responses.length;
  if (total === 0) {
    return {
      totalResponses: 0,
      averageAge: 0,
      medianAge: 0,
      standardDeviationAge: 0,
      minAge: 0,
      maxAge: 0,
      emailsList: [],
      participantsList: [],
      questionStats: {},
    };
  }

  const ages = responses
    .map((r) => r.age)
    .filter((a) => typeof a === 'number' && !isNaN(a))
    .sort((a, b) => a - b);

  const avgAge = ages.length ? Math.round((ages.reduce((sum, a) => sum + a, 0) / ages.length) * 10) / 10 : 0;
  const minAge = ages.length ? Math.min(...ages) : 0;
  const maxAge = ages.length ? Math.max(...ages) : 0;

  // Median Age
  let medianAge = 0;
  if (ages.length > 0) {
    const mid = Math.floor(ages.length / 2);
    medianAge = ages.length % 2 !== 0 ? ages[mid] : Math.round(((ages[mid - 1] + ages[mid]) / 2) * 10) / 10;
  }

  // Standard Deviation of Age
  let standardDeviationAge = 0;
  if (ages.length > 1) {
    const variance = ages.reduce((sum, a) => sum + Math.pow(a - avgAge, 2), 0) / (ages.length - 1);
    standardDeviationAge = Math.round(Math.sqrt(variance) * 10) / 10;
  }

  const emailsList = responses.map((r) => ({
    email: r.userEmail,
    date: r.createdAt,
    age: r.age,
    browserId: r.browserId,
  }));

  const participantsList = responses.map((r) => ({
    id: r.id,
    email: r.userEmail,
    name: r.userName || r.userEmail.split('@')[0],
    date: r.createdAt,
    age: r.age,
    browserId: r.browserId || 'BRW-LEGACY-HASH',
    status: 'Validado (Maior de 18)',
  }));

  const questionStats: SurveyStats['questionStats'] = {};

  for (const q of questions) {
    const optionCounts: Record<string, number> = {};
    if (q.options) {
      q.options.forEach((opt) => {
        optionCounts[opt] = 0;
      });
    }

    const textAnswers: string[] = [];
    const ratingValues: number[] = [];
    let answeredCount = 0;

    for (const res of responses) {
      const ans = res.answers[q.id];
      if (ans !== undefined && ans !== null && ans !== '') {
        answeredCount++;
        if (Array.isArray(ans)) {
          ans.forEach((val) => {
            optionCounts[val] = (optionCounts[val] || 0) + 1;
          });
        } else if (typeof ans === 'string') {
          if (q.type === 'text' || q.type === 'textarea') {
            textAnswers.push(ans);
          } else {
            optionCounts[ans] = (optionCounts[ans] || 0) + 1;
          }

          if (q.type === 'rating') {
            const num = parseFloat(ans);
            if (!isNaN(num)) {
              ratingValues.push(num);
            }
          }
        }
      }
    }

    // Compute rating metrics if applicable
    let meanRating: number | undefined = undefined;
    let stdDevRating: number | undefined = undefined;
    let medianRating: number | undefined = undefined;

    if (q.type === 'rating' && ratingValues.length > 0) {
      ratingValues.sort((a, b) => a - b);
      meanRating =
        Math.round((ratingValues.reduce((acc, v) => acc + v, 0) / ratingValues.length) * 100) / 100;

      const mid = Math.floor(ratingValues.length / 2);
      medianRating =
        ratingValues.length % 2 !== 0
          ? ratingValues[mid]
          : (ratingValues[mid - 1] + ratingValues[mid]) / 2;

      if (ratingValues.length > 1) {
        const variance =
          ratingValues.reduce((sum, v) => sum + Math.pow(v - meanRating!, 2), 0) /
          (ratingValues.length - 1);
        stdDevRating = Math.round(Math.sqrt(variance) * 100) / 100;
      } else {
        stdDevRating = 0;
      }
    }

    questionStats[q.id] = {
      questionTitle: q.title,
      type: q.type,
      totalAnswers: answeredCount,
      optionCounts,
      textAnswers,
      meanRating,
      stdDevRating,
      medianRating,
    };
  }

  return {
    totalResponses: total,
    averageAge: avgAge,
    medianAge,
    standardDeviationAge,
    minAge,
    maxAge,
    emailsList,
    participantsList,
    questionStats,
  };
}
