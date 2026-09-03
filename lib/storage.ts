import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import { Question, SurveyResponse, SurveyStats } from './types';
import { DEFAULT_QUESTIONS } from './defaultQuestions';

const LOCAL_STORAGE_QUESTIONS_KEY = 'unitins_fiscal_questions_v1';
const LOCAL_STORAGE_RESPONSES_KEY = 'unitins_fiscal_responses_v1';

/**
 * Loads the active list of questions (Local-first for zero latency, with background Firestore sync)
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
 * Saves or updates a question
 */
export async function saveQuestion(question: Question): Promise<void> {
  const currentQuestions = await getQuestionsList();
  const exists = currentQuestions.some((q) => q.id === question.id);
  const updated = exists
    ? currentQuestions.map((q) => (q.id === question.id ? question : q))
    : [...currentQuestions, question];

  // Save to Firestore if available
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

  // Always sync to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(updated));
  }
}

/**
 * Deletes a question by ID
 */
export async function deleteQuestionById(questionId: string): Promise<void> {
  const currentQuestions = await getQuestionsList();
  const updated = currentQuestions.filter((q) => q.id !== questionId);

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
 * Submits a new survey response
 */
export async function submitSurveyResponse(response: SurveyResponse): Promise<void> {
  // Save to local storage IMMEDIATELY for zero latency
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCAL_STORAGE_RESPONSES_KEY);
    const list: SurveyResponse[] = saved ? JSON.parse(saved) : [];
    // Replace if same ID or add
    const updated = [response, ...list.filter((r) => r.id !== response.id)];
    localStorage.setItem(LOCAL_STORAGE_RESPONSES_KEY, JSON.stringify(updated));
  }

  // Fire-and-forget to Firestore in background
  if (isConfigured && db) {
    setDoc(doc(db, 'respostas', response.id), {
      ...response,
      serverCreatedAt: serverTimestamp(),
    }).catch((err) => {
      console.warn('Background sync failed for response:', err);
    });
  }
}

/**
 * Retrieves all survey responses (Local-first for zero latency, with background Firestore sync)
 */
export async function getAllResponses(): Promise<SurveyResponse[]> {
  let localResponses: SurveyResponse[] = [];
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCAL_STORAGE_RESPONSES_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          localResponses = parsed;
        }
      } catch {
        // ignore
      }
    }
  }

  // If Firestore is available, fetch in background and update local cache if successful
  if (isConfigured && db) {
    getDocs(query(collection(db, 'respostas'), orderBy('createdAt', 'desc')))
      .then((rSnap) => {
        if (!rSnap.empty) {
          const list: SurveyResponse[] = [];
          rSnap.forEach((docSnap) => {
            list.push(docSnap.data() as SurveyResponse);
          });
          if (typeof window !== 'undefined' && list.length > 0) {
            localStorage.setItem(LOCAL_STORAGE_RESPONSES_KEY, JSON.stringify(list));
          }
        }
      })
      .catch((err) => {
        console.warn('Background Firestore responses sync warning:', err);
      });
  }

  return localResponses;
}

/**
 * Clears all responses so the form is ready for a fresh new survey run
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
    localStorage.removeItem(LOCAL_STORAGE_RESPONSES_KEY);
  }
}

/**
 * Checks if a user (by Google email) or a device (by browserId) has already submitted a response.
 * Enforces single-respondent integrity for academic research.
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
  const all = await getAllResponses();

  const foundByEmail = all.find(
    (r) => r.userEmail && r.userEmail.toLowerCase().trim() === email.toLowerCase().trim()
  );

  const foundByBrowser = browserId
    ? all.find((r) => r.browserId && r.browserId === browserId)
    : undefined;

  const alreadySubmitted = Boolean(foundByEmail || foundByBrowser);
  const existingResponse = foundByEmail || foundByBrowser || null;

  return {
    alreadySubmitted,
    byEmail: Boolean(foundByEmail),
    byBrowser: Boolean(foundByBrowser),
    existingResponse,
  };
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
