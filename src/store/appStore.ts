import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Customer,
  FollowUpRecord,
  ExceptionRecord,
  Template,
  Staff,
  OperationLog,
  TimelineEvent,
  BatchSendResponse,
  BatchSendResult,
  HandoverRecord,
  HandoverTask,
  DoctorAdvice,
  HandoverAction
} from '@/types';
import {
  mockCustomers,
  mockFollowUps,
  mockExceptions,
  mockTemplates,
  mockStaff,
  mockOperationLogs
} from '@/data/mockData';
import { generateId, getDaysAfterSurgery } from '@/utils';

interface AppState {
  customers: Customer[];
  followUps: FollowUpRecord[];
  exceptions: ExceptionRecord[];
  templates: Template[];
  staff: Staff[];
  operationLogs: OperationLog[];
  handoverRecords: HandoverRecord[];
  currentUser: Staff;
  preselectedBatchCustomerIds: string[];
  
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  sendFollowUp: (followUpId: string, channel: 'sms' | 'wechat' | 'phone', templateId?: string, phoneCallContent?: string) => void;
  batchSendFollowUps: (customerIds: string[], channel: 'sms' | 'wechat', templateId: string) => BatchSendResponse;
  markFollowUpRead: (followUpId: string) => void;
  completeFollowUp: (followUpId: string, note?: string) => void;
  
  addException: (exception: Omit<ExceptionRecord, 'id' | 'createdAt' | 'status'>) => void;
  assignException: (exceptionId: string, doctorId: string) => void;
  resolveException: (exceptionId: string, resolution: string, doctorAdvice?: DoctorAdvice) => void;
  getAssignedExceptions: (doctorId?: string) => ExceptionRecord[];
  getOverdueHighRiskExceptions: () => ExceptionRecord[];
  
  addTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'useCount'>) => void;
  updateTemplate: (id: string, data: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
  incrementTemplateUse: (id: string) => void;
  
  addOperationLog: (log: Omit<OperationLog, 'id' | 'timestamp'>) => void;
  
  setPreselectedBatchCustomerIds: (ids: string[]) => void;
  getCustomerTimeline: (customerId: string) => TimelineEvent[];
  
  switchUser: (staffId: string) => void;
  
  createHandover: (tasks: Omit<HandoverTask, 'id' | 'fromStaffId' | 'fromStaffName' | 'createdAt' | 'isCompleted'>[], note: string) => HandoverRecord;
  acceptHandover: (handoverId: string) => void;
  canAcceptHandover: (handover: HandoverRecord) => boolean;
  processHandoverTask: (taskId: string, actionType: string, note: string) => void;
  completeHandoverTask: (taskId: string, actionType?: string, note?: string) => void;
  getPendingHandovers: () => HandoverRecord[];
  getTodayHandoverTasks: () => HandoverTask[];
  getAcceptedActiveTasks: () => HandoverTask[];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      customers: mockCustomers,
      followUps: mockFollowUps,
      exceptions: mockExceptions,
      templates: mockTemplates,
      staff: mockStaff,
      operationLogs: mockOperationLogs,
      handoverRecords: [],
      currentUser: mockStaff[0],
      preselectedBatchCustomerIds: [],

      addCustomer: (customer) => {
        const newCustomer: Customer = {
          ...customer,
          id: generateId(),
          createdAt: new Date().toISOString()
        };
        set((state) => ({ customers: [newCustomer, ...state.customers] }));
        get().addOperationLog({
          staffId: get().currentUser.id,
          staffName: get().currentUser.name,
          action: '新建顾客档案',
          target: customer.name,
          details: `新建顾客档案，项目：${customer.projectType}`
        });
        
        const surgeryDays = customer.dietPeriodDays;
        const followUpDays = [1, 3, 7].filter(d => d <= surgeryDays);
        const newFollowUps: FollowUpRecord[] = followUpDays.map(day => ({
          id: generateId(),
          customerId: newCustomer.id,
          dayNumber: day,
          status: 'pending',
          channel: null,
          sentAt: null,
          isRead: false,
          lastCheckIn: null,
          note: ''
        }));
        set((state) => ({ followUps: [...state.followUps, ...newFollowUps] }));
      },

      updateCustomer: (id, data) => {
        set((state) => ({
          customers: state.customers.map(c => c.id === id ? { ...c, ...data } : c)
        }));
      },

      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter(c => c.id !== id),
          followUps: state.followUps.filter(f => f.customerId !== id),
          exceptions: state.exceptions.filter(e => e.customerId !== id)
        }));
      },

      sendFollowUp: (followUpId, channel, templateId, phoneCallContent) => {
        set((state) => ({
          followUps: state.followUps.map(f =>
            f.id === followUpId
              ? { ...f, status: 'sent', channel, sentAt: new Date().toISOString(), templateId, phoneCallContent }
              : f
          )
        }));
        if (templateId) {
          get().incrementTemplateUse(templateId);
        }
        const followUp = get().followUps.find(f => f.id === followUpId);
        const customer = get().customers.find(c => c.id === followUp?.customerId);
        if (customer) {
          const channelName = channel === 'sms' ? '短信' : channel === 'wechat' ? '微信' : '电话';
          let logDetails = `通过${channelName}发送术后第${followUp?.dayNumber}天提醒`;
          if (channel === 'phone' && phoneCallContent) {
            logDetails += `，通话内容：${phoneCallContent}`;
          }
          get().addOperationLog({
            staffId: get().currentUser.id,
            staffName: get().currentUser.name,
            action: channel === 'phone' ? '电话随访' : '发送随访提醒',
            target: customer.name,
            details: logDetails
          });
        }
      },

      batchSendFollowUps: (customerIds, channel, templateId) => {
        const batchId = generateId();
        const now = new Date().toISOString();
        const results: BatchSendResult[] = [];
        const affectedCustomerNames: string[] = [];
        
        set((state) => {
          const newFollowUps: FollowUpRecord[] = [];
          
          const updatedFollowUps = state.followUps.map(f => {
            if (customerIds.includes(f.customerId) && f.status === 'pending') {
              const customer = state.customers.find(c => c.id === f.customerId);
              if (customer) {
                results.push({
                  customerId: customer.id,
                  customerName: customer.name,
                  success: true
                });
                if (!affectedCustomerNames.includes(customer.name)) {
                  affectedCustomerNames.push(customer.name);
                }
              }
              return { ...f, status: 'sent' as const, channel, sentAt: now, templateId, batchSendId: batchId };
            }
            return f;
          });
          
          // 给没有待随访任务的顾客也创建一条记录，方便在时间线中查看
          const sentCustomerIds = state.followUps
            .filter(f => customerIds.includes(f.customerId) && f.status === 'pending')
            .map(f => f.customerId);
          
          customerIds.forEach(cid => {
            if (!sentCustomerIds.includes(cid)) {
              const customer = state.customers.find(c => c.id === cid);
              if (customer) {
                results.push({
                  customerId: customer.id,
                  customerName: customer.name,
                  success: true
                });
                affectedCustomerNames.push(customer.name);
                const days = getDaysAfterSurgery(customer.surgeryDate);
                newFollowUps.push({
                  id: generateId(),
                  customerId: customer.id,
                  dayNumber: days,
                  status: 'sent' as const,
                  channel,
                  sentAt: now,
                  isRead: false,
                  lastCheckIn: null,
                  note: '',
                  templateId,
                  batchSendId: batchId
                });
              }
            }
          });
          
          return {
            followUps: [...updatedFollowUps, ...newFollowUps],
            preselectedBatchCustomerIds: []
          };
        });
        
        if (templateId) {
          get().incrementTemplateUse(templateId);
        }
        const template = get().templates.find(t => t.id === templateId);
        get().addOperationLog({
          staffId: get().currentUser.id,
          staffName: get().currentUser.name,
          action: '批量发送提醒',
          target: `${results.length}位顾客`,
          details: `使用【${template?.name || '节假日模板'}】通过${channel === 'sms' ? '短信' : '微信'}批量发送给：${affectedCustomerNames.join('、')}`
        });
        
        return {
          results,
          successCount: results.filter(r => r.success).length,
          failCount: results.filter(r => !r.success).length
        };
      },

      markFollowUpRead: (followUpId) => {
        set((state) => ({
          followUps: state.followUps.map(f =>
            f.id === followUpId
              ? { ...f, isRead: true, lastCheckIn: new Date().toISOString() }
              : f
          )
        }));
      },

      completeFollowUp: (followUpId, note = '') => {
        set((state) => ({
          followUps: state.followUps.map(f =>
            f.id === followUpId
              ? { ...f, status: 'completed', note }
              : f
          )
        }));
      },

      addException: (exception) => {
        const newException: ExceptionRecord = {
          ...exception,
          id: generateId(),
          createdAt: new Date().toISOString(),
          status: 'pending'
        };
        set((state) => ({ exceptions: [newException, ...state.exceptions] }));
        const customer = get().customers.find(c => c.id === exception.customerId);
        if (customer) {
          get().addOperationLog({
            staffId: get().currentUser.id,
            staffName: get().currentUser.name,
            action: '标记异常',
            target: customer.name,
            details: `标记${exception.type}异常，风险等级：${exception.level === 'low' ? '低' : exception.level === 'medium' ? '中' : '高'}`
          });
        }
      },

      assignException: (exceptionId, doctorId) => {
        const doctor = get().staff.find(s => s.id === doctorId);
        set((state) => ({
          exceptions: state.exceptions.map(e =>
            e.id === exceptionId
              ? { ...e, status: 'processing', assignedDoctor: doctor?.name || null }
              : e
          )
        }));
      },

      resolveException: (exceptionId, resolution, doctorAdvice) => {
        const now = new Date().toISOString();
        set((state) => ({
          exceptions: state.exceptions.map(e =>
            e.id === exceptionId
              ? { ...e, status: 'resolved', resolvedAt: now, resolution, doctorAdvice }
              : e
          )
        }));
      },

      addTemplate: (template) => {
        const newTemplate: Template = {
          ...template,
          id: generateId(),
          useCount: 0,
          createdAt: new Date().toISOString()
        };
        set((state) => ({ templates: [newTemplate, ...state.templates] }));
        get().addOperationLog({
          staffId: get().currentUser.id,
          staffName: get().currentUser.name,
          action: '新建提醒模板',
          target: template.name,
          details: `新建${template.category}模板：${template.name}`
        });
      },

      updateTemplate: (id, data) => {
        set((state) => ({
          templates: state.templates.map(t => t.id === id ? { ...t, ...data } : t)
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter(t => t.id !== id)
        }));
      },

      incrementTemplateUse: (id) => {
        set((state) => ({
          templates: state.templates.map(t =>
            t.id === id ? { ...t, useCount: t.useCount + 1 } : t
          )
        }));
      },

      addOperationLog: (log) => {
        const newLog: OperationLog = {
          ...log,
          id: generateId(),
          timestamp: new Date().toISOString()
        };
        set((state) => ({ operationLogs: [newLog, ...state.operationLogs] }));
      },

      setPreselectedBatchCustomerIds: (ids) => {
        set({ preselectedBatchCustomerIds: ids });
      },

      getAssignedExceptions: (doctorId) => {
        const targetDoctorId = doctorId || get().currentUser.id;
        const doctor = get().staff.find(s => s.id === targetDoctorId);
        if (!doctor) return [];
        
        return get().exceptions
          .filter(e => e.assignedDoctor === doctor.name && e.status !== 'resolved')
          .sort((a, b) => {
            const levelOrder = { high: 0, medium: 1, low: 2 };
            const levelDiff = levelOrder[a.level] - levelOrder[b.level];
            if (levelDiff !== 0) return levelDiff;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });
      },

      getOverdueHighRiskExceptions: () => {
        const now = new Date().getTime();
        const HIGH_RISK_OVERDUE_MS = 30 * 60 * 1000; // 高风险30分钟未处理即超时
        return get().exceptions.filter(e => {
          if (e.level !== 'high' || e.status === 'resolved') return false;
          const elapsed = now - new Date(e.createdAt).getTime();
          return elapsed > HIGH_RISK_OVERDUE_MS;
        });
      },

      getCustomerTimeline: (customerId) => {
        const state = get();
        const events: TimelineEvent[] = [];
        const customer = state.customers.find(c => c.id === customerId);
        if (!customer) return events;

        // 1. 建档事件
        events.push({
          id: `create-${customer.id}`,
          type: 'customer_created',
          timestamp: customer.createdAt,
          title: '顾客建档',
          description: `${customer.projectType}，手术日期：${new Date(customer.surgeryDate).toLocaleDateString('zh-CN')}，忌口周期${customer.dietPeriodDays}天，主治医生：${customer.doctorName}`
        });

        // 2. 随访记录事件
        state.followUps
          .filter(f => f.customerId === customerId && f.sentAt)
          .forEach(f => {
            const template = state.templates.find(t => t.id === f.templateId);
            if (f.batchSendId) {
              events.push({
                id: `followup-${f.id}`,
                type: 'batch_sent',
                timestamp: f.sentAt!,
                title: `批量发送提醒（术后第${f.dayNumber}天）`,
                description: `通过${f.channel === 'sms' ? '短信' : f.channel === 'wechat' ? '微信' : '电话'}发送${template ? `【${template.name}】` : '提醒'}`,
                metadata: { templateName: template?.name, channel: f.channel }
              });
            } else if (f.channel === 'phone') {
              events.push({
                id: `followup-${f.id}`,
                type: 'phone_call',
                timestamp: f.sentAt!,
                title: `电话随访（术后第${f.dayNumber}天）`,
                description: f.phoneCallContent || '已完成电话随访',
                metadata: { content: f.phoneCallContent }
              });
            } else {
              events.push({
                id: `followup-${f.id}`,
                type: 'followup_sent',
                timestamp: f.sentAt!,
                title: `发送${f.channel === 'sms' ? '短信' : '微信'}提醒（术后第${f.dayNumber}天）`,
                description: template ? `模板：${template.name}` : '已发送提醒'
              });
            }
          });

        // 3. 异常记录事件
        state.exceptions
          .filter(e => e.customerId === customerId)
          .forEach(e => {
            events.push({
              id: `exception-report-${e.id}`,
              type: 'exception_reported',
              timestamp: e.createdAt,
              title: `异常上报：${e.type}`,
              description: `风险等级：${e.level === 'low' ? '低' : e.level === 'medium' ? '中' : '高'}，${e.description}`,
              metadata: { level: e.level }
            });
            if (e.assignedDoctor) {
              events.push({
                id: `exception-assign-${e.id}`,
                type: 'exception_assigned',
                timestamp: e.createdAt,
                title: '分配医生处理',
                description: `分配给${e.assignedDoctor}医生处理`
              });
            }
            if (e.status === 'resolved' && e.resolvedAt) {
              if (e.doctorAdvice) {
                events.push({
                  id: `exception-advice-${e.id}`,
                  type: 'doctor_advice',
                  timestamp: e.resolvedAt,
                  title: `医生处置建议：${e.type}`,
                  description: e.resolution || '医生已填写结构化处置建议',
                  doctorAdvice: e.doctorAdvice,
                  metadata: { doctor: e.assignedDoctor, exceptionType: e.type }
                });
              } else {
                events.push({
                  id: `exception-advice-${e.id}`,
                  type: 'doctor_advice',
                  timestamp: e.resolvedAt,
                  title: `医生处理建议：${e.type}`,
                  description: e.resolution,
                  metadata: { doctor: e.assignedDoctor, exceptionType: e.type }
                });
              }
              events.push({
                id: `exception-resolve-${e.id}`,
                type: 'exception_resolved',
                timestamp: e.resolvedAt,
                title: '异常已解决',
                description: `${e.assignedDoctor}医生处理完成`
              });
            }
          });

        // 4. 打卡记录
        state.followUps
          .filter(f => f.customerId === customerId && f.lastCheckIn)
          .forEach(f => {
            events.push({
              id: `checkin-${f.id}`,
              type: 'checkin',
              timestamp: f.lastCheckIn!,
              title: '顾客打卡',
              description: `术后第${f.dayNumber}天打卡确认`
            });
          });

        // 5. 交接班处理动作事件
        state.handoverRecords.forEach(h => {
          h.tasks
            .filter(t => t.customerId === customerId)
            .forEach(t => {
              if (t.processingNote || t.isCompleted) {
                const actionTime = t.completedAt || t.createdAt;
                const actionType = t.processingType || '处理';
                events.push({
                  id: `handover-action-${t.id}`,
                  type: 'handover_action',
                  timestamp: actionTime,
                  title: `接班${actionType}`,
                  description: t.processingNote || '接班处理',
                  handoverAction: {
                    type: (t.processingType as any) || 'other',
                    note: t.processingNote || '',
                    operatorId: t.toStaffId || h.fromStaffId,
                    operatorName: t.toStaffName || h.fromStaffName
                  },
                  metadata: {
                    handoverId: h.id,
                    taskId: t.id,
                    fromStaffName: h.fromStaffName
                  }
                });
              }
            });
          if (h.note && h.tasks.some(t => t.customerId === customerId)) {
            events.push({
              id: `handover-note-${h.id}`,
              type: 'handover_note',
              timestamp: h.createdAt,
              title: `交接班（${h.fromStaffName} → ${h.toStaffName || '待接交'}）`,
              description: h.note,
              metadata: {
                fromStaffName: h.fromStaffName,
                toStaffName: h.toStaffName,
                isAccepted: h.isAccepted
              }
            });
          }
        });

        // 按时间排序，最新在前
        return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      },

      switchUser: (staffId) => {
        const user = get().staff.find(s => s.id === staffId);
        if (user) {
          set({ currentUser: user });
        }
      },

      createHandover: (tasks, note) => {
        const currentUser = get().currentUser;
        const now = new Date().toISOString();
        const handoverTasks: HandoverTask[] = tasks.map(t => ({
          ...t,
          id: generateId(),
          fromStaffId: currentUser.id,
          fromStaffName: currentUser.name,
          createdAt: now,
          isCompleted: false
        }));
        
        const handover: HandoverRecord = {
          id: generateId(),
          fromStaffId: currentUser.id,
          fromStaffName: currentUser.name,
          tasks: handoverTasks,
          note,
          createdAt: now,
          isAccepted: false
        };
        
        set((state) => ({
          handoverRecords: [handover, ...state.handoverRecords]
        }));
        
        get().addOperationLog({
          staffId: currentUser.id,
          staffName: currentUser.name,
          action: '创建交接班',
          target: `${tasks.length}项待办`,
          details: `交接班包含${tasks.length}项任务，备注：${note}`
        });
        
        return handover;
      },

      acceptHandover: (handoverId) => {
        const currentUser = get().currentUser;
        const handover = get().handoverRecords.find(h => h.id === handoverId);
        if (!handover) return;
        // 禁止接自己的交班
        if (handover.fromStaffId === currentUser.id) return;
        // 禁止非护士接交
        if (currentUser.role !== 'nurse') return;

        const now = new Date().toISOString();
        set((state) => ({
          handoverRecords: state.handoverRecords.map(h => 
            h.id === handoverId 
              ? { 
                  ...h, 
                  isAccepted: true, 
                  toStaffId: currentUser.id, 
                  toStaffName: currentUser.name, 
                  acceptedAt: now,
                  tasks: h.tasks.map(t => ({
                    ...t,
                    toStaffId: currentUser.id,
                    toStaffName: currentUser.name
                  }))
                }
              : h
          )
        }));
        
        const updatedHandover = get().handoverRecords.find(h => h.id === handoverId);
        if (updatedHandover) {
          get().addOperationLog({
            staffId: currentUser.id,
            staffName: currentUser.name,
            action: '接交接班',
            target: updatedHandover.fromStaffName,
            details: `接收了${updatedHandover.tasks.length}项交接班任务`
          });
        }
      },

      canAcceptHandover: (handover) => {
        const currentUser = get().currentUser;
        return handover.fromStaffId !== currentUser.id && currentUser.role === 'nurse' && !handover.isAccepted;
      },

      processHandoverTask: (taskId, actionType, note) => {
        const currentUser = get().currentUser;
        set((state) => ({
          handoverRecords: state.handoverRecords.map(h => ({
            ...h,
            tasks: h.tasks.map(t => 
              t.id === taskId ? { 
                ...t, 
                processingNote: note, 
                processingType: actionType
              } : t
            )
          }))
        }));
        get().addOperationLog({
          staffId: currentUser.id,
          staffName: currentUser.name,
          action: '记录接班处理',
          target: '',
          details: `交接班处理（${actionType}）：${note}`
        });
      },

      completeHandoverTask: (taskId, actionType, note) => {
        const currentUser = get().currentUser;
        const now = new Date().toISOString();
        set((state) => ({
          handoverRecords: state.handoverRecords.map(h => ({
            ...h,
            tasks: h.tasks.map(t => 
              t.id === taskId ? { 
                ...t, 
                isCompleted: true,
                completedAt: now,
                completedBy: currentUser.id,
                completedByName: currentUser.name,
                ...(actionType ? { processingType: actionType } : {}),
                ...(note ? { processingNote: note } : {})
              } : t
            )
          }))
        }));
      },

      getPendingHandovers: () => {
        const currentUserId = get().currentUser.id;
        // 过滤掉自己创建的交班（不能接自己的）
        return get().handoverRecords.filter(h => !h.isAccepted && h.fromStaffId !== currentUserId);
      },

      getTodayHandoverTasks: () => {
        const state = get();
        const allTasks: HandoverTask[] = [];
        state.handoverRecords.forEach(h => {
          h.tasks.forEach(t => {
            if (!t.isCompleted) {
              allTasks.push(t);
            }
          });
        });
        return allTasks.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
      },

      getAcceptedActiveTasks: () => {
        const currentUser = get().currentUser;
        const state = get();
        const tasks: HandoverTask[] = [];
        state.handoverRecords
          .filter(h => h.isAccepted && h.toStaffId === currentUser.id)
          .forEach(h => {
            h.tasks
              .filter(t => !t.isCompleted)
              .forEach(t => tasks.push(t));
          });
        return tasks.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
      }
    }),
    {
      name: 'diet-follow-up-storage',
      partialize: (state) => ({
        customers: state.customers,
        followUps: state.followUps,
        exceptions: state.exceptions,
        templates: state.templates,
        operationLogs: state.operationLogs,
        handoverRecords: state.handoverRecords,
        currentUser: state.currentUser
      })
    }
  )
);

export function useTodayFollowUps() {
  const { customers, followUps } = useAppStore();
  
  const day1 = followUps.filter(f => {
    const customer = customers.find(c => c.id === f.customerId);
    if (!customer) return false;
    const days = getDaysAfterSurgery(customer.surgeryDate);
    return days === 1 && f.status === 'pending';
  });
  
  const day3 = followUps.filter(f => {
    const customer = customers.find(c => c.id === f.customerId);
    if (!customer) return false;
    const days = getDaysAfterSurgery(customer.surgeryDate);
    return days === 3 && f.status === 'pending';
  });
  
  const day7 = followUps.filter(f => {
    const customer = customers.find(c => c.id === f.customerId);
    if (!customer) return false;
    const days = getDaysAfterSurgery(customer.surgeryDate);
    return days === 7 && f.status === 'pending';
  });

  return { day1, day3, day7 };
}
