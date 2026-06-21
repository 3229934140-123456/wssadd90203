export type Gender = 'male' | 'female';
export type AnesthesiaType = 'general' | 'local' | 'sedation';
export type StaffRole = 'reception' | 'nurse' | 'doctor' | 'manager';
export type FollowUpStatus = 'pending' | 'sent' | 'read' | 'completed';
export type FollowUpChannel = 'sms' | 'wechat' | 'phone' | null;
export type RiskLevel = 'low' | 'medium' | 'high';
export type ExceptionStatus = 'pending' | 'processing' | 'resolved';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: Gender;
  projectType: string;
  surgeryDate: string;
  anesthesiaType: AnesthesiaType;
  doctorName: string;
  specialInstructions: string;
  dietPeriodDays: number;
  allergyHistory: string;
  createdAt: string;
  avatar?: string;
}

export interface FollowUpRecord {
  id: string;
  customerId: string;
  dayNumber: number;
  status: FollowUpStatus;
  channel: FollowUpChannel;
  sentAt: string | null;
  isRead: boolean;
  lastCheckIn: string | null;
  note: string;
  templateId?: string;
  operatorId?: string;
  phoneCallContent?: string;
  batchSendId?: string;
}

export interface ExceptionRecord {
  id: string;
  customerId: string;
  type: string;
  level: RiskLevel;
  description: string;
  status: ExceptionStatus;
  assignedDoctor: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolution: string;
  reporterId?: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
  useCount: number;
  createdAt: string;
}

export interface Staff {
  id: string;
  name: string;
  avatar: string;
  role: StaffRole;
  followUpCount: number;
  completionRate: number;
}

export interface OperationLog {
  id: string;
  staffId: string;
  staffName: string;
  action: string;
  target: string;
  timestamp: string;
  details: string;
}

export interface DietPhase {
  dayRange: string;
  title: string;
  forbidden: string[];
  recommended: string[];
}

export interface ProjectDietConfig {
  projectType: string;
  periodDays: number;
  phases: DietPhase[];
}

export interface StatisticsOverview {
  totalFollowUps: number;
  completionRate: number;
  exceptionCount: number;
  satisfactionScore: number;
}

export interface DailyTrendData {
  date: string;
  followUps: number;
  completed: number;
}

export interface ExceptionDistribution {
  type: string;
  count: number;
}
