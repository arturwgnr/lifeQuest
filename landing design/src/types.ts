/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Task {
  id: string;
  title: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  dependency: string | null;
  isAvoided: boolean;
  reason: string;
  isApproved: boolean;
  isCompleted: boolean;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  xp: number;
  level: number;
  isLoggedIn: boolean;
}

export interface OracleSuggestionResponse {
  title: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  dependency: string | null;
  isAvoided: boolean;
  reason: string;
}
