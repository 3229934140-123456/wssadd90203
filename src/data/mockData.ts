import type { Customer, FollowUpRecord, ExceptionRecord, Template, Staff, OperationLog } from '@/types';
import { generateId } from '@/utils';

const today = new Date();
const getDateBefore = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};
const getDateTimeBefore = (days: number, hours: number = 10) => {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  d.setHours(hours, 0, 0, 0);
  return d.toISOString();
};

export const mockCustomers: Customer[] = [
  {
    id: 'c1',
    name: '张美丽',
    phone: '13800138001',
    age: 28,
    gender: 'female',
    projectType: '双眼皮手术',
    surgeryDate: getDateBefore(0),
    anesthesiaType: 'local',
    doctorName: '李医生',
    specialInstructions: '术后第二天换药，一周后拆线',
    dietPeriodDays: 7,
    allergyHistory: '青霉素过敏',
    createdAt: getDateTimeBefore(0, 9),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1'
  },
  {
    id: 'c2',
    name: '王婷婷',
    phone: '13800138002',
    age: 32,
    gender: 'female',
    projectType: '隆鼻手术',
    surgeryDate: getDateBefore(1),
    anesthesiaType: 'general',
    doctorName: '王医生',
    specialInstructions: '鼻腔填塞物48小时后取出',
    dietPeriodDays: 14,
    allergyHistory: '无',
    createdAt: getDateTimeBefore(1, 9),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2'
  },
  {
    id: 'c3',
    name: '李思琪',
    phone: '13800138003',
    age: 25,
    gender: 'female',
    projectType: '双眼皮手术',
    surgeryDate: getDateBefore(2),
    anesthesiaType: 'local',
    doctorName: '李医生',
    specialInstructions: '',
    dietPeriodDays: 7,
    allergyHistory: '海鲜过敏',
    createdAt: getDateTimeBefore(2, 9),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3'
  },
  {
    id: 'c4',
    name: '刘芳芳',
    phone: '13800138004',
    age: 35,
    gender: 'female',
    projectType: '颌面手术',
    surgeryDate: getDateBefore(2),
    anesthesiaType: 'general',
    doctorName: '张医生',
    specialInstructions: '术后流食一周，注意口腔卫生',
    dietPeriodDays: 30,
    allergyHistory: '无',
    createdAt: getDateTimeBefore(2, 8),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4'
  },
  {
    id: 'c5',
    name: '陈美丽',
    phone: '13800138005',
    age: 29,
    gender: 'female',
    projectType: '吸脂手术',
    surgeryDate: getDateBefore(3),
    anesthesiaType: 'sedation',
    doctorName: '王医生',
    specialInstructions: '24小时穿塑身衣',
    dietPeriodDays: 14,
    allergyHistory: '无',
    createdAt: getDateTimeBefore(3, 10),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5'
  },
  {
    id: 'c6',
    name: '赵雅婷',
    phone: '13800138006',
    age: 27,
    gender: 'female',
    projectType: '玻尿酸填充',
    surgeryDate: getDateBefore(5),
    anesthesiaType: 'local',
    doctorName: '李医生',
    specialInstructions: '',
    dietPeriodDays: 3,
    allergyHistory: '无',
    createdAt: getDateTimeBefore(5, 11),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6'
  },
  {
    id: 'c7',
    name: '孙晓晓',
    phone: '13800138007',
    age: 31,
    gender: 'female',
    projectType: '肉毒素注射',
    surgeryDate: getDateBefore(6),
    anesthesiaType: 'local',
    doctorName: '张医生',
    specialInstructions: '6小时内不要平躺',
    dietPeriodDays: 3,
    allergyHistory: '无',
    createdAt: getDateTimeBefore(6, 14),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7'
  },
  {
    id: 'c8',
    name: '周梦琪',
    phone: '13800138008',
    age: 26,
    gender: 'female',
    projectType: '双眼皮手术',
    surgeryDate: getDateBefore(6),
    anesthesiaType: 'local',
    doctorName: '王医生',
    specialInstructions: '',
    dietPeriodDays: 7,
    allergyHistory: '无',
    createdAt: getDateTimeBefore(6, 9),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8'
  }
];

export const mockFollowUps: FollowUpRecord[] = [
  { id: 'f1', customerId: 'c1', dayNumber: 1, status: 'pending', channel: null, sentAt: null, isRead: false, lastCheckIn: null, note: '' },
  { id: 'f2', customerId: 'c2', dayNumber: 1, status: 'sent', channel: 'wechat', sentAt: getDateTimeBefore(0, 10), isRead: false, lastCheckIn: null, note: '已发送微信提醒' },
  { id: 'f3', customerId: 'c3', dayNumber: 3, status: 'read', channel: 'sms', sentAt: getDateTimeBefore(1, 10), isRead: true, lastCheckIn: getDateTimeBefore(1, 15), note: '顾客回复情况良好' },
  { id: 'f4', customerId: 'c4', dayNumber: 3, status: 'sent', channel: 'phone', sentAt: getDateTimeBefore(1, 11), isRead: true, lastCheckIn: null, note: '电话确认术后情况，顾客表示有些肿胀属正常' },
  { id: 'f5', customerId: 'c5', dayNumber: 3, status: 'completed', channel: 'wechat', sentAt: getDateTimeBefore(0, 10), isRead: true, lastCheckIn: getDateTimeBefore(0, 14), note: '已完成随访，顾客恢复良好' },
  { id: 'f6', customerId: 'c6', dayNumber: 7, status: 'completed', channel: 'sms', sentAt: getDateTimeBefore(2, 10), isRead: true, lastCheckIn: getDateTimeBefore(2, 16), note: '' },
  { id: 'f7', customerId: 'c7', dayNumber: 7, status: 'completed', channel: 'wechat', sentAt: getDateTimeBefore(1, 10), isRead: true, lastCheckIn: getDateTimeBefore(1, 12), note: '顾客非常满意' },
  { id: 'f8', customerId: 'c8', dayNumber: 7, status: 'sent', channel: 'wechat', sentAt: getDateTimeBefore(0, 10), isRead: false, lastCheckIn: null, note: '' },
  { id: 'f9', customerId: 'c2', dayNumber: 3, status: 'pending', channel: null, sentAt: null, isRead: false, lastCheckIn: null, note: '' },
  { id: 'f10', customerId: 'c3', dayNumber: 7, status: 'pending', channel: null, sentAt: null, isRead: false, lastCheckIn: null, note: '' },
];

export const mockExceptions: ExceptionRecord[] = [
  {
    id: 'e1',
    customerId: 'c3',
    type: '饮食违规',
    level: 'low',
    description: '顾客反馈吃了一点辛辣食物，担心影响恢复',
    status: 'resolved',
    assignedDoctor: '李医生',
    createdAt: getDateTimeBefore(1, 16),
    resolvedAt: getDateTimeBefore(1, 17),
    resolution: '告知顾客少量辛辣影响不大，建议后面几天严格忌口，多喝水促进代谢'
  },
  {
    id: 'e2',
    customerId: 'c4',
    type: '伤口渗液',
    level: 'high',
    description: '顾客说伤口有淡黄色渗液，伴轻微疼痛',
    status: 'processing',
    assignedDoctor: '张医生',
    createdAt: getDateTimeBefore(0, 9),
    resolvedAt: null,
    resolution: ''
  },
  {
    id: 'e3',
    customerId: 'c5',
    type: '饮酒',
    level: 'medium',
    description: '顾客朋友聚会喝了两杯啤酒',
    status: 'pending',
    assignedDoctor: null,
    createdAt: getDateTimeBefore(0, 14),
    resolvedAt: null,
    resolution: ''
  }
];

export const mockTemplates: Template[] = [
  {
    id: 't1',
    name: '术后第1天提醒',
    category: '常规随访',
    content: '亲爱的{name}您好，今天是您{project}术后第1天。请记得：1. 保持伤口清洁干燥 2. 饮食清淡，忌辛辣海鲜烟酒 3. 注意休息，避免剧烈运动。如有不适请及时联系我们。',
    useCount: 128,
    createdAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 't2',
    name: '术后第3天提醒',
    category: '常规随访',
    content: '亲爱的{name}您好，今天是您{project}术后第3天。请继续保持良好的作息和饮食习惯，注意观察伤口情况，如果有肿胀加重或异常分泌物请及时告诉我们。',
    useCount: 115,
    createdAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 't3',
    name: '术后第7天提醒',
    category: '常规随访',
    content: '亲爱的{name}您好，今天是您{project}术后第7天。恢复情况如何？请记得按时复查，继续保持健康饮食和规律作息。祝您早日恢复美丽！',
    useCount: 98,
    createdAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 't4',
    name: '节假日聚餐提醒',
    category: '特殊提醒',
    content: '亲爱的{name}您好，节日将至，聚餐较多，温馨提醒您：术后恢复期间请尽量避免辛辣刺激食物和酒精，管住嘴才能更快恢复美丽哦！',
    useCount: 56,
    createdAt: '2024-02-01T00:00:00.000Z'
  },
  {
    id: 't5',
    name: '异常关怀回访',
    category: '异常回访',
    content: '亲爱的{name}您好，了解到您术后有些小状况，我们非常关心。请不必担心，{doctor}医生已经了解您的情况，建议如下：{advice}。如有任何疑问随时联系我们。',
    useCount: 34,
    createdAt: '2024-01-20T00:00:00.000Z'
  },
  {
    id: 't6',
    name: '满意度调查',
    category: '回访调查',
    content: '亲爱的{name}您好，您的{project}已经恢复一段时间了，请问您对效果满意吗？我们非常重视您的反馈，如有任何建议欢迎告诉我们。',
    useCount: 87,
    createdAt: '2024-01-10T00:00:00.000Z'
  }
];

export const mockStaff: Staff[] = [
  { id: 's1', name: '李小护', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=n1', role: 'nurse', followUpCount: 156, completionRate: 95.2 },
  { id: 's2', name: '王小护', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=n2', role: 'nurse', followUpCount: 142, completionRate: 92.8 },
  { id: 's3', name: '张前台', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=r1', role: 'reception', followUpCount: 0, completionRate: 0 },
  { id: 's4', name: '李医生', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=d1', role: 'doctor', followUpCount: 0, completionRate: 0 },
  { id: 's5', name: '王医生', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=d2', role: 'doctor', followUpCount: 0, completionRate: 0 },
  { id: 's6', name: '张医生', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=d3', role: 'doctor', followUpCount: 0, completionRate: 0 },
  { id: 's7', name: '刘主管', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=m1', role: 'manager', followUpCount: 45, completionRate: 100 },
];

export const mockOperationLogs: OperationLog[] = [
  { id: 'l1', staffId: 's3', staffName: '张前台', action: '新建顾客档案', target: '张美丽', timestamp: getDateTimeBefore(0, 9), details: '新建顾客档案，项目：双眼皮手术' },
  { id: 'l2', staffId: 's1', staffName: '李小护', action: '发送随访提醒', target: '王婷婷', timestamp: getDateTimeBefore(0, 10), details: '通过微信发送术后第1天提醒' },
  { id: 'l3', staffId: 's2', staffName: '王小护', action: '标记异常', target: '李思琪', timestamp: getDateTimeBefore(1, 16), details: '标记饮食违规异常，风险等级：低' },
  { id: 'l4', staffId: 's4', staffName: '李医生', action: '处理异常', target: '李思琪', timestamp: getDateTimeBefore(1, 17), details: '回复处理建议，已解决' },
  { id: 'l5', staffId: 's1', staffName: '李小护', action: '电话随访', target: '刘芳芳', timestamp: getDateTimeBefore(1, 11), details: '术后第3天电话随访' },
  { id: 'l6', staffId: 's2', staffName: '王小护', action: '发送提醒', target: '陈美丽', timestamp: getDateTimeBefore(0, 10), details: '通过微信发送术后第3天提醒' },
  { id: 'l7', staffId: 's1', staffName: '李小护', action: '标记异常', target: '刘芳芳', timestamp: getDateTimeBefore(0, 9), details: '标记伤口渗液异常，风险等级：高，已转张医生' },
  { id: 'l8', staffId: 's2', staffName: '王小护', action: '标记异常', target: '陈美丽', timestamp: getDateTimeBefore(0, 14), details: '标记饮酒异常，风险等级：中' },
];
