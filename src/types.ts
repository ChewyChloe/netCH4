/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ModuleId =
  | 'overview'
  | 'router-arch'
  | 'prefix-match'
  | 'queue-schedule'
  | 'ipv4-datagram'
  | 'ip-addressing'
  | 'dhcp'
  | 'nat'
  | 'ipv6'
  | 'sdn-openflow'
  | 'middleboxes'
  | 'quizzes'
  | 'summary';

export interface ConceptDetail {
  title: string;
  englishTitle: string;
  description: string;
  details: string[];
  latexFormula?: string;
}

export interface InteractiveModule {
  id: ModuleId;
  title: string;
  englishTitle: string;
  description: string;
  concepts: ConceptDetail[];
}

export interface QuizQuestion {
  id: number;
  moduleId: ModuleId;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ScoreState {
  answeredCount: number;
  correctCount: number;
  completed: boolean;
  history: Record<number, number>; // questionId -> selectedOptionIndex
}
