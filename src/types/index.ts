export type Gender = 'male' | 'female';
export type AnesthesiaType = 'general' | 'local' | 'sedation';
export type StaffRole = 'reception' | 'nurse' | 'doctor' | 'manager';
export type FollowUpStatus = 'pending' | 'sent' | 'read' | 'completed';
export type FollowUpChannel = 'sms' | 'wechat' | 'phone' | null;
export type RiskLevel = 'low' | 'medium' | 'high';
export type ExceptionStatus = 'pending' | 'processing' | 'resolved';
export type TimelineEventType = 
  | 'customer_created' 
  | 'followup_sent' 
  | 'phone_call' 
  | 'exception_reported' 
  | 'exception_assigned' 
  | 'exception_resolved'
  | 'checkin'
  | 'batch_sent'
  | 'doctor_advice'
  | 'handover_note'
  | 'handover_action';

export interface DoctorAdvice {
  dietAdvice: string;
  medicationAdvice: string;
  reviewTime: string;
  additionalAdvice?: string;
}

export interface HandoverAction {
  type: 'phone_confirmed' | 'review_reminded' | 'reassigned_doctor' | 'followup_done' | 'other';
  note: string;
  operatorId: string;
  operatorName: string;
}

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  doctorAdvice?: DoctorAdvice;
  handoverAction?: HandoverAction;
}

export interface BatchSendResult {
  customerId: string;
  customerName: string;
  success: boolean;
  error?: string;
}

export interface BatchSendResponse {
  results: BatchSendResult[];
  successCount: number;
  failCount: number;
}

export interface HandoverTask {
  id: string;
  customerId: string;
  customerName: string;
  type: 'pending_followup' | 'high_risk' | 'callback' | 'other';
  priority: 'high' | 'medium' | 'low';
  content: string;
  fromStaffId: string;
  fromStaffName: string;
  toStaffId?: string;
  isCompleted: boolean;
  createdAt: string;
  note?: string;
}

export interface HandoverRecord {
  id: string;
  fromStaffId: string;
  fromStaffName: string;
  toStaffId?: string;
  toStaffName?: string;
  tasks: HandoverTask[];
  note: string;
  createdAt: string;
  isAccepted: boolean;
  acceptedAt?: string;
}

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
  doctorAdvice?: DoctorAdvice;
}

export interface HandoverTask {
  id: string;
  customerId: string;
  customerName: string;
  type: 'pending_followup' | 'high_risk' | 'callback' | 'other';
  priority: 'high' | 'medium' | 'low';
  content: string;
  fromStaffId: string;
  fromStaffName: string;
  toStaffId?: string;
  toStaffName?: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  completedByName?: string;
  processingNote?: string;
  processingType?: string;
  createdAt: string;
  note?: string;
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
