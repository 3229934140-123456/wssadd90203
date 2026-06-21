import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Customer,
  FollowUpRecord,
  ExceptionRecord,
  Template,
  Staff,
  OperationLog
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
  currentUser: Staff;
  
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  sendFollowUp: (followUpId: string, channel: 'sms' | 'wechat' | 'phone', templateId?: string) => void;
  markFollowUpRead: (followUpId: string) => void;
  completeFollowUp: (followUpId: string, note?: string) => void;
  
  addException: (exception: Omit<ExceptionRecord, 'id' | 'createdAt' | 'status'>) => void;
  assignException: (exceptionId: string, doctorId: string) => void;
  resolveException: (exceptionId: string, resolution: string) => void;
  
  addTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'useCount'>) => void;
  updateTemplate: (id: string, data: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
  incrementTemplateUse: (id: string) => void;
  
  addOperationLog: (log: Omit<OperationLog, 'id' | 'timestamp'>) => void;
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
      currentUser: mockStaff[0],

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

      sendFollowUp: (followUpId, channel, templateId) => {
        set((state) => ({
          followUps: state.followUps.map(f =>
            f.id === followUpId
              ? { ...f, status: 'sent', channel, sentAt: new Date().toISOString(), templateId }
              : f
          )
        }));
        if (templateId) {
          get().incrementTemplateUse(templateId);
        }
        const followUp = get().followUps.find(f => f.id === followUpId);
        const customer = get().customers.find(c => c.id === followUp?.customerId);
        if (customer) {
          get().addOperationLog({
            staffId: get().currentUser.id,
            staffName: get().currentUser.name,
            action: '发送随访提醒',
            target: customer.name,
            details: `通过${channel === 'sms' ? '短信' : channel === 'wechat' ? '微信' : '电话'}发送术后第${followUp?.dayNumber}天提醒`
          });
        }
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

      resolveException: (exceptionId, resolution) => {
        set((state) => ({
          exceptions: state.exceptions.map(e =>
            e.id === exceptionId
              ? { ...e, status: 'resolved', resolvedAt: new Date().toISOString(), resolution }
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
      }
    }),
    {
      name: 'diet-follow-up-storage',
      partialize: (state) => ({
        customers: state.customers,
        followUps: state.followUps,
        exceptions: state.exceptions,
        templates: state.templates,
        operationLogs: state.operationLogs
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
