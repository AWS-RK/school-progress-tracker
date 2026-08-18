export type Level = 'Emerging' | 'Developing' | 'Secure' | 'Independent';
export type Source = 'parent' | 'teacher' | 'assessment';
export type TeamRole = 'family' | 'school_staff' | 'service_provider';
export type TeamScope = 'full' | 'academic_only';
export type GoalStatus = 'On Track' | 'In Progress' | 'Needs Support';

export interface Profile {
  id: string;
  name: string;
  gradeLabel: string;
  iepStatus: string;
  lastReevaluationDate: string;
  nextAnnualReviewDate: string;
}

export interface Skill {
  id: string;
  domainId: string;
  name: string;
  sortOrder: number;
  percent: number;
  lastAssessedAt: string;
}

export interface Domain {
  id: string;
  profileId: string;
  name: string;
  icon: string;
  sortOrder: number;
  skills: Skill[];
}

export interface Goal {
  id: string;
  profileId: string;
  domainId: string;
  title: string;
  baseline: string;
  target: string;
  percent: number;
}

export interface TimelineEntry {
  id: string;
  profileId: string;
  domainId: string;
  authorId: string | null;
  source: Source;
  level: Level;
  note: string;
  attachmentUrl: string | null;
  occurredAt: string;
}

export interface TeamMember {
  id: string;
  profileId: string;
  userId: string | null;
  name: string;
  title: string;
  role: TeamRole;
  scope: TeamScope;
  invitedEmail: string;
}
