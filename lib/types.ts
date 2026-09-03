export type QuestionType = 'radio' | 'checkbox' | 'text' | 'textarea' | 'rating';

export interface Question {
  id: string;
  title: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  order: number;
  description?: string;
}

export interface SurveyResponse {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  userPhoto?: string;
  birthDate: string; // YYYY-MM-DD
  age: number;
  browserId: string; // Hardware/Browser persistent unique fingerprint
  userAgent?: string;
  answers: Record<string, string | string[]>; // questionId -> answer
  createdAt: string; // ISO String
}

export interface ParticipantRecord {
  id: string;
  email: string;
  name?: string;
  date: string;
  age: number;
  browserId: string;
  status: string;
}

export interface SurveyStats {
  totalResponses: number;
  averageAge: number;
  medianAge: number;
  standardDeviationAge: number;
  minAge: number;
  maxAge: number;
  emailsList: { email: string; date: string; age: number; browserId?: string }[];
  participantsList: ParticipantRecord[];
  questionStats: Record<
    string,
    {
      questionTitle: string;
      type: QuestionType;
      totalAnswers: number;
      optionCounts: Record<string, number>;
      textAnswers?: string[];
      meanRating?: number;
      stdDevRating?: number;
      medianRating?: number;
    }
  >;
}
