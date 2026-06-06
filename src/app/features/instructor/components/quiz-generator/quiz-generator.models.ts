export type ProcessingStatus = 'Pending' | 'In Progress' | 'Completed';

export interface UploadedFileItem {
  id: number;
  name: string;
  size: string;
  status: string;
}

export interface ProcessingTask {
  title: string;
  description?: string;
  status: ProcessingStatus;
}

export interface QuizQuestionOption {
  id: string;
  label: string;
  correct: boolean;
}

export interface QuizQuestion {
  id: number;
  type: string;
  text: string;
  options: QuizQuestionOption[];
}

export interface SourceMaterial {
  id: number;
  name: string;
  status: string;
}

