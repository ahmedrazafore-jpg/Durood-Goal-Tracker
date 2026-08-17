export type ActiveTab = 'home' | 'rankings' | 'submit' | 'admin';

export interface JamiaClass {
  id: string;
  name: string;
  totalDurood: number;
  rank: number;
}

export interface StudentPerformance {
  studentName: string;
  className: string;
  totalDurood: number;
  submissionCount: number;
  lastSubmittedAt?: string;
  rank: number;
}

export interface SubmissionItem {
  id?: string;
  campaignId?: string;
  studentName?: string;
  className: string;
  duroodCount?: number;
  count: number;
  submittedAt?: string;
  timestamp: string;
  status?: string;
  verified: boolean;
}

export interface CampaignDocument {
  id?: string;
  title: string;
  target: number;
  totalRecited: number;
  remaining: number;
  progressPercentage: number;
  startDate: string;
  startTime?: string;
  durationDays?: number;
  endDate: string;
  endTime?: string;
  isActive: boolean;
  archivedAt?: string;
  createdAt?: string;
  updatedAt: string;
}

export interface CampaignStats {
  campaignId?: string;
  title?: string;
  campaignTarget: number;
  totalRecited: number;
  remainingTarget: number;
  progressPercentage: number;
  totalSubmissionsCount: number;
  activeClassesCount: number;
  daysRemaining: number;
  hoursRemaining?: number;
  startDate?: string;
  startTime?: string;
  durationDays?: number;
  endDate?: string;
  endTime?: string;
  scheduleStatus?: 'upcoming' | 'active' | 'expired';
}

export interface AdminUser {
  uid: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}
