import { useState, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Phone,
  Plus,
  Minus,
  Send,
  CheckCheck,
  History,
  User,
  ArrowLeftRight,
  MessageSquare,
  RefreshCcw,
  Stethoscope,
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import PageHeader from '@/components/Layout/PageHeader';
import CustomerTimelineModal from '@/components/FollowUp/CustomerTimelineModal';
import { useAppStore } from '@/store/appStore';
import { formatDateTime, getDaysAfterSurgery } from '@/utils';
import type { HandoverTask, Customer, FollowUpRecord, ExceptionRecord } from '@/types';

type TabType = 'overview' | 'current' | 'create' | 'history';

interface ProcessTaskModalState {
  isOpen: boolean;
  task: HandoverTask | null;
  customer: Customer | null;
  actionType: string;
  note: string;
  andMarkComplete: boolean;
}

export default function Handover() {
  const {
    currentUser,
    customers,
    followUps,
    exceptions,
    handoverRecords,
    createHandover,
    acceptHandover,
    completeHandoverTask,
    processHandoverTask,
    getPendingHandovers,
    canAcceptHandover,
    getOverdueHighRiskExceptions
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [handoverNote, setHandoverNote] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Map<string, Omit<HandoverTask, 'id' | 'fromStaffId' | 'fromStaffName' | 'createdAt' | 'isCompleted'>>>(new Map());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  // 接班处理弹窗
  const [processModal, setProcessModal] = useState<ProcessTaskModalState>({
    isOpen: false,
    task: null,
    customer: null,
    actionType: 'phone_confirmed',
    note: '',
    andMarkComplete: true
  });

  // 今天未完成的随访
  const pendingFollowUps = useMemo(() => {
    return followUps.filter(f => f.status === 'pending').map(f => {
      const customer = customers.find(c => c.id === f.customerId);
      return { followUp: f, customer };
    }).filter(item => item.customer);
  }, [followUps, customers]);

  // 高风险异常
  const highRiskExceptions = useMemo(() => {
    return exceptions
      .filter(e => e.level === 'high' && e.status !== 'resolved')
      .map(e => {
        const customer = customers.find(c => c.id === e.customerId);
        return { exception: e, customer };
      })
      .filter(item => item.customer);
  }, [exceptions, customers]);

  // 已电话沟通但需要复查的人（这里模拟：电话随访后状态为sent且有内容的，需要复查）
  const needCallback = useMemo(() => {
    return followUps
      .filter(f => f.channel === 'phone' && f.status === 'sent' && f.phoneCallContent)
      .map(f => {
        const customer = customers.find(c => c.id === f.customerId);
        return { followUp: f, customer };
      })
      .filter(item => item.customer)
      .slice(0, 5);
  }, [followUps, customers]);

  const pendingHandovers = getPendingHandovers();

  const toggleTask = (type: 'pending_followup' | 'high_risk' | 'callback', customerId: string, customerName: string, content: string, priority: 'high' | 'medium' | 'low') => {
    const key = `${type}-${customerId}`;
    setSelectedTasks(prev => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, {
          customerId,
          customerName,
          type,
          content,
          priority
        });
      }
      return next;
    });
  };

  const isTaskSelected = (type: string, customerId: string) => {
    return selectedTasks.has(`${type}-${customerId}`);
  };

  const handleCreateHandover = () => {
    if (selectedTasks.size === 0) return;
    const tasks = Array.from(selectedTasks.values());
    createHandover(tasks, handoverNote);
    setSelectedTasks(new Map());
    setHandoverNote('');
    setActiveTab('current');
  };

  const handleAcceptHandover = (handoverId: string) => {
    acceptHandover(handoverId);
  };

  const handleCompleteTask = (taskId: string) => {
    completeHandoverTask(taskId);
  };

  const openProcessTask = (task: HandoverTask, customer: Customer) => {
    setProcessModal({
      isOpen: true,
      task,
      customer,
      actionType: 'phone_confirmed',
      note: '',
      andMarkComplete: true
    });
  };

  const closeProcessTask = () => {
    setProcessModal({
      isOpen: false,
      task: null,
      customer: null,
      actionType: 'phone_confirmed',
      note: '',
      andMarkComplete: true
    });
  };

  const submitProcessTask = () => {
    if (!processModal.task) return;
    if (!processModal.note.trim()) return;
    if (processModal.andMarkComplete) {
      completeHandoverTask(processModal.task.id, processModal.actionType, processModal.note);
    } else {
      processHandoverTask(processModal.task.id, processModal.actionType, processModal.note);
    }
    closeProcessTask();
  };

  // 概览统计
  const overviewStats = useMemo(() => {
    const highRiskUnresolved = exceptions.filter(e => e.level === 'high' && e.status !== 'resolved');
    const todayPending = followUps.filter(f => {
      const customer = customers.find(c => c.id === f.customerId);
      if (!customer) return false;
      const days = getDaysAfterSurgery(customer.surgeryDate);
      return (days === 1 || days === 3 || days === 7) && f.status === 'pending';
    });
    const callbackTasks = [...handoverRecords]
      .flatMap(h => h.tasks)
      .filter(t => t.type === 'callback' && !t.isCompleted);
    const overdue = getOverdueHighRiskExceptions();
    return {
      highRiskUnresolved,
      todayPending,
      callbackTasks,
      overdue
    };
  }, [exceptions, followUps, customers, handoverRecords, getOverdueHighRiskExceptions]);

  const processTypeOptions = [
    { id: 'phone_confirmed', label: '已电话确认', icon: Phone, color: 'bg-blue-100 text-blue-700' },
    { id: 'review_reminded', label: '已提醒复查', icon: CheckCheck, color: 'bg-green-100 text-green-700' },
    { id: 'reassigned_doctor', label: '已再次转医生', icon: Stethoscope, color: 'bg-purple-100 text-purple-700' },
    { id: 'followup_done', label: '随访已完成', icon: MessageSquare, color: 'bg-amber-100 text-amber-700' },
    { id: 'other', label: '其他处理', icon: RefreshCcw, color: 'bg-gray-100 text-gray-700' }
  ];

  const openTimeline = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowTimeline(true);
  };

  // 当前用户需要处理的任务
  const myActiveTasks = useMemo(() => {
    const tasks: HandoverTask[] = [];
    handoverRecords.forEach(h => {
      if (h.isAccepted && h.toStaffId === currentUser.id) {
        h.tasks.forEach(t => {
          if (!t.isCompleted) {
            tasks.push(t);
          }
        });
      }
    });
    return tasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [handoverRecords, currentUser.id]);

  const taskTypeLabels: Record<string, { label: string; color: string; icon: any }> = {
    pending_followup: { label: '待随访', color: 'text-blue-600 bg-blue-100', icon: Clock },
    high_risk: { label: '高风险', color: 'text-red-600 bg-red-100', icon: AlertTriangle },
    callback: { label: '需复查', color: 'text-purple-600 bg-purple-100', icon: Phone },
    other: { label: '其他', color: 'text-gray-600 bg-gray-100', icon: FileText }
  };

  const priorityColors: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-green-500'
  };

  const groupedTasks = useMemo(() => {
    const groups = new Map<string, { customer: Customer; tasks: HandoverTask[] }>();
    myActiveTasks.forEach(task => {
      const customer = customers.find(c => c.id === task.customerId);
      if (customer) {
        if (!groups.has(task.customerId)) {
          groups.set(task.customerId, { customer, tasks: [] });
        }
        groups.get(task.customerId)!.tasks.push(task);
      }
    });
    return groups;
  }, [myActiveTasks, customers]);

  return (
    <div className="min-h-screen">
      <PageHeader
        title="值班交接班"
        subtitle="下班前整理待办，接班时查看清单"
      />

      <div className="p-8 pt-4">
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'overview', label: '接班概览', icon: Sparkles, badge: overviewStats.highRiskUnresolved.length + overviewStats.todayPending.length + overviewStats.callbackTasks.length },
              { id: 'current', label: '待办清单', icon: FileText, badge: myActiveTasks.length + pendingHandovers.length },
              { id: 'create', label: '创建交接', icon: Plus, badge: selectedTasks.size },
              { id: 'history', label: '历史记录', icon: History, badge: 0 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 px-4 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 relative ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 -mb-px bg-blue-50/30'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.badge > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                    tab.id === 'overview' && overviewStats.overdue.length > 0
                      ? 'bg-red-100 text-red-700 animate-pulse'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* =============== 概览Tab =============== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {overviewStats.overdue.length > 0 && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-700">
                      ⚠️ 有 {overviewStats.overdue.length} 条高风险异常超时未处理
                    </p>
                    <p className="text-sm text-red-600">高风险异常超过30分钟未处理，请优先跟进</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {overviewStats.overdue.map(exc => {
                    const c = customers.find(cu => cu.id === exc.customerId);
                    return (
                      <div key={exc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                        <div className="flex items-center gap-3">
                          {c && <img src={c.avatar} alt={c.name} className="w-9 h-9 rounded-full" />}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{c?.name} — {exc.type}</p>
                            <p className="text-xs text-red-600">已等待超过30分钟</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full font-bold">超时</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-5">
              {/* 高风险未处理 */}
              <div className="bg-white rounded-xl border border-red-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5 border-b border-red-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">高风险未处理</p>
                      <p className="text-3xl font-bold text-red-600">{overviewStats.highRiskUnresolved.length}</p>
                    </div>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {overviewStats.highRiskUnresolved.length > 0 ? (
                    overviewStats.highRiskUnresolved.map(exc => {
                      const c = customers.find(cu => cu.id === exc.customerId);
                      const overdue = getOverdueHighRiskExceptions().some(o => o.id === exc.id);
                      return (
                        <div key={exc.id} className={`p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 flex items-center justify-between gap-2 ${overdue ? 'bg-red-50' : ''}`}>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {c && <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full flex-shrink-0" />}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{c?.name || '未知顾客'}</p>
                              <p className="text-xs text-gray-500 truncate">{exc.type}</p>
                            </div>
                          </div>
                          {overdue && <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded flex-shrink-0">超时</span>}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-400">🎉 暂无高风险</div>
                  )}
                </div>
                {overviewStats.highRiskUnresolved.length > 0 && (
                  <div className="p-3 border-t border-gray-100">
                    <button
                      onClick={() => window.location.href = '/exceptions'}
                      className="w-full text-xs text-red-600 hover:text-red-700 font-medium flex items-center justify-center gap-1"
                    >
                      全部查看并处理
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* 今日未发提醒 */}
              <div className="bg-white rounded-xl border border-blue-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5 border-b border-blue-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">今日未发提醒</p>
                      <p className="text-3xl font-bold text-blue-600">{overviewStats.todayPending.length}</p>
                    </div>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {overviewStats.todayPending.length > 0 ? (
                    overviewStats.todayPending.map(fu => {
                      const c = customers.find(cu => cu.id === fu.customerId);
                      const days = c ? getDaysAfterSurgery(c.surgeryDate) : 0;
                      return (
                        <div key={fu.id} className="p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                          <div className="flex items-center gap-2 mb-1">
                            {c && <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{c?.name}</p>
                              <p className="text-xs text-gray-500 truncate">{c?.projectType}</p>
                            </div>
                          </div>
                          <div className="pl-10">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              days === 1 ? 'bg-green-100 text-green-700'
                                : days === 3 ? 'bg-amber-100 text-amber-700'
                                  : 'bg-pink-100 text-pink-700'
                            }`}>
                              术后第{days}天
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-400">🎉 今日提醒已全部发送</div>
                  )}
                </div>
                {overviewStats.todayPending.length > 0 && (
                  <div className="p-3 border-t border-gray-100">
                    <button
                      onClick={() => window.location.href = '/dashboard'}
                      className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
                    >
                      去随访看板处理
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* 电话复查待办 */}
              <div className="bg-white rounded-xl border border-purple-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5 border-b border-purple-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">电话复查待办</p>
                      <p className="text-3xl font-bold text-purple-600">{overviewStats.callbackTasks.length}</p>
                    </div>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {overviewStats.callbackTasks.length > 0 ? (
                    overviewStats.callbackTasks.map(task => {
                      const c = customers.find(cu => cu.id === task.customerId);
                      return (
                        <div key={task.id} className="p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                          <div className="flex items-center gap-2 mb-1">
                            {c && <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{c?.name || task.customerName}</p>
                              <p className="text-xs text-gray-500 truncate">{task.content}</p>
                            </div>
                          </div>
                          <div className="pl-10 flex items-center gap-2">
                            <span className="text-xs text-gray-400">来自 {task.fromStaffName}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-400">🎉 暂无复查待办</div>
                  )}
                </div>
                {overviewStats.callbackTasks.length > 0 && (
                  <div className="p-3 border-t border-gray-100">
                    <button
                      onClick={() => setActiveTab('current')}
                      className="w-full text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center gap-1"
                    >
                      去待办清单处理
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 待接交的交班也显示在概览下面提示 */}
            {pendingHandovers.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
                <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5" />
                  有 {pendingHandovers.length} 份交班等待您接交
                </h3>
                <div className="flex gap-3 flex-wrap">
                  {pendingHandovers.map(h => (
                    <div key={h.id} className="bg-white rounded-lg border border-amber-200 p-3 min-w-[220px]">
                      <div className="flex items-center gap-2 mb-2">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${h.fromStaffId}`} alt={h.fromStaffName} className="w-7 h-7 rounded-full" />
                        <div>
                          <p className="text-sm font-medium">{h.fromStaffName}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(h.createdAt)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{h.tasks.length} 项待办</p>
                      <button
                        onClick={() => { handleAcceptHandover(h.id); }}
                        disabled={!canAcceptHandover(h)}
                        className="mt-2 w-full py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-medium rounded"
                      >
                        一键接交
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'current' && (
          <div className="space-y-6">
            {pendingHandovers.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
                <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5" />
                  待您接交的交班 ({pendingHandovers.length}份)
                </h3>
                <div className="space-y-3">
                  {pendingHandovers.map(handover => (
                    <div key={handover.id} className="bg-white rounded-lg p-4 border border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${handover.fromStaffId}`} alt={handover.fromStaffName} className="w-8 h-8 rounded-full" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{handover.fromStaffName} 的交班</p>
                            <p className="text-xs text-gray-500">{formatDateTime(handover.createdAt)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAcceptHandover(handover.id)}
                          disabled={!canAcceptHandover(handover)}
                          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                            canAcceptHandover(handover)
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <CheckCheck className="w-4 h-4" />
                          {handover.fromStaffId === currentUser.id
                            ? '不能接自己的'
                            : currentUser.role !== 'nurse'
                              ? '仅护士可接'
                              : '接交'}
                        </button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                          {handover.tasks.length} 项待办
                        </span>
                        {handover.note && (
                          <span className="text-xs text-gray-500">备注：{handover.note}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {groupedTasks.size > 0 ? (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  我的待办任务（按顾客分组）
                </h3>
                <div className="grid gap-4">
                  {Array.from(groupedTasks.values()).map(({ customer, tasks }) => {
                    const days = getDaysAfterSurgery(customer.surgeryDate);
                    return (
                      <div key={customer.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <img src={customer.avatar} alt={customer.name} className="w-12 h-12 rounded-full bg-gray-100" />
                            <div>
                              <h4 className="font-semibold text-gray-900">{customer.name}</h4>
                              <p className="text-sm text-gray-500">{customer.projectType} · 术后第{days}天 · {customer.doctorName}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => openTimeline(customer)}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50"
                          >
                            <History className="w-3.5 h-3.5" />
                            查看时间线
                          </button>
                        </div>
                        <div className="space-y-2">
                          {tasks.map(task => {
                            const typeInfo = taskTypeLabels[task.type];
                            const TypeIcon = typeInfo.icon;
                            return (
                              <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                                <button
                                  onClick={() => handleCompleteTask(task.id)}
                                  className="mt-0.5 text-gray-400 hover:text-green-600 transition-colors flex-shrink-0"
                                  title="直接标记完成"
                                >
                                  <Circle className="w-5 h-5" />
                                </button>
                                <div className={`w-1.5 h-full rounded-full ${priorityColors[task.priority]} flex-shrink-0`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className={`px-2 py-0.5 text-xs rounded ${typeInfo.color}`}>
                                      <TypeIcon className="w-3 h-3 inline mr-1" />
                                      {typeInfo.label}
                                    </span>
                                    <span className="text-xs text-gray-400">{task.fromStaffName} 交接</span>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-2">{task.content}</p>
                                  {task.processingNote && (
                                    <div className="p-2 bg-violet-50 rounded border border-violet-100 mb-2">
                                      <p className="text-xs text-violet-700 mb-0.5">📝 已记录处理：
                                        <span className="font-medium ml-1">
                                          {processTypeOptions.find(o => o.id === task.processingType)?.label || '处理中'}
                                        </span>
                                      </p>
                                      <p className="text-xs text-gray-600">{task.processingNote}</p>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => openProcessTask(task, customer)}
                                      className="text-xs px-2.5 py-1 bg-white border border-gray-300 rounded hover:border-violet-400 hover:text-violet-600 transition-colors flex items-center gap-1"
                                    >
                                      <RefreshCcw className="w-3 h-3" />
                                      记录处理并完成
                                    </button>
                                    <button
                                      onClick={() => openTimeline(customer)}
                                      className="text-xs px-2.5 py-1 bg-white border border-gray-300 rounded hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center gap-1"
                                    >
                                      <History className="w-3 h-3" />
                                      看时间线
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center bg-white rounded-xl border border-gray-200">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">暂无待办任务</h3>
                <p className="text-sm text-gray-500 mb-4">当前没有需要处理的交接班任务</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  创建交接班 →
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  待随访顾客
                  <span className="text-sm font-normal text-gray-500">（今天未完成的）</span>
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {pendingFollowUps.length > 0 ? (
                    pendingFollowUps.map(({ followUp, customer }) => (
                      <div
                        key={followUp.id}
                        onClick={() => toggleTask(
                          'pending_followup',
                          customer!.id,
                          customer!.name,
                          `术后第${followUp.dayNumber}天随访提醒待发送`,
                          'medium'
                        )}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          isTaskSelected('pending_followup', customer!.id)
                            ? 'bg-blue-50 border-2 border-blue-300'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${
                          isTaskSelected('pending_followup', customer!.id)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200'
                        }`}>
                          {isTaskSelected('pending_followup', customer!.id) && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <img src={customer!.avatar} alt={customer!.name} className="w-8 h-8 rounded-full" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{customer!.name}</p>
                          <p className="text-xs text-gray-500">术后第{followUp.dayNumber}天 · {customer!.projectType}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">今日随访全部完成 ✨</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  高风险异常
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {highRiskExceptions.length > 0 ? (
                    highRiskExceptions.map(({ exception, customer }) => (
                      <div
                        key={exception.id}
                        onClick={() => toggleTask(
                          'high_risk',
                          customer!.id,
                          customer!.name,
                          `${exception.type}：${exception.description}`,
                          'high'
                        )}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          isTaskSelected('high_risk', customer!.id)
                            ? 'bg-red-50 border-2 border-red-300'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${
                          isTaskSelected('high_risk', customer!.id)
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200'
                        }`}>
                          {isTaskSelected('high_risk', customer!.id) && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <img src={customer!.avatar} alt={customer!.name} className="w-8 h-8 rounded-full" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{customer!.name}</p>
                          <p className="text-xs text-red-600">{exception.type}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">暂无高风险异常</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-purple-600" />
                  需电话复查
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {needCallback.length > 0 ? (
                    needCallback.map(({ followUp, customer }) => (
                      <div
                        key={followUp.id}
                        onClick={() => toggleTask(
                          'callback',
                          customer!.id,
                          customer!.name,
                          '需要电话随访确认恢复情况',
                          'low'
                        )}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          isTaskSelected('callback', customer!.id)
                            ? 'bg-purple-50 border-2 border-purple-300'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${
                          isTaskSelected('callback', customer!.id)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200'
                        }`}>
                          {isTaskSelected('callback', customer!.id) && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <img src={customer!.avatar} alt={customer!.name} className="w-8 h-8 rounded-full" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{customer!.name}</p>
                          <p className="text-xs text-gray-500">{customer!.projectType}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">暂无需要复查的顾客</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-8">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  交接班预览
                </h3>

                {selectedTasks.size > 0 ? (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-3">
                      已选择 <span className="font-bold text-blue-600">{selectedTasks.size}</span> 项任务
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {Array.from(selectedTasks.entries()).map(([key, task]) => {
                        const typeInfo = taskTypeLabels[task.type];
                        const TypeIcon = typeInfo.icon;
                        return (
                          <div key={key} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                            <div className={`w-2 h-8 rounded ${priorityColors[task.priority]}`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-1.5 py-0.5 rounded ${typeInfo.color}`}>
                                  <TypeIcon className="w-3 h-3 inline mr-0.5" />
                                  {typeInfo.label}
                                </span>
                                <span className="text-sm font-medium text-gray-900">{task.customerName}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.content}</p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedTasks(prev => {
                                  const next = new Map(prev);
                                  next.delete(key);
                                  return next;
                                });
                              }}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center mb-4">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">从左侧选择需要交接的任务</p>
                  </div>
                )}

                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">交接备注</label>
                  <textarea
                    value={handoverNote}
                    onChange={(e) => setHandoverNote(e.target.value)}
                    placeholder="如有特殊情况请备注说明..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <button
                  onClick={handleCreateHandover}
                  disabled={selectedTasks.size === 0}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  创建交接班
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-xl border border-gray-200">
            {handoverRecords.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {handoverRecords.map(handover => (
                  <div key={handover.id} className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${handover.fromStaffId}`} alt={handover.fromStaffName} className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {handover.fromStaffName} → {handover.toStaffName || '待接交'}
                          </p>
                          <p className="text-xs text-gray-500">{formatDateTime(handover.createdAt)}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        handover.isAccepted
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {handover.isAccepted ? '已接交' : '待接交'}
                      </span>
                    </div>
                    <div className="ml-13 pl-4 border-l-2 border-gray-100">
                      <div className="space-y-2">
                        {handover.tasks.map(task => {
                          const typeInfo = taskTypeLabels[task.type];
                          const TypeIcon = typeInfo.icon;
                          return (
                            <div key={task.id} className="flex items-center gap-2 text-sm">
                              {task.isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-300" />
                              )}
                              <span className={`px-1.5 py-0.5 text-xs rounded ${typeInfo.color}`}>
                                <TypeIcon className="w-3 h-3 inline mr-0.5" />
                                {typeInfo.label}
                              </span>
                              <span className="text-gray-500">{task.customerName}：</span>
                              <span className={task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}>
                                {task.content}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {handover.note && (
                        <p className="text-xs text-gray-500 mt-2">📝 备注：{handover.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">暂无历史记录</h3>
                <p className="text-sm text-gray-500">还没有交接班记录</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showTimeline && selectedCustomer && (
        <CustomerTimelineModal
          isOpen={showTimeline}
          onClose={() => { setShowTimeline(false); setSelectedCustomer(null); }}
          customer={selectedCustomer}
        />
      )}

      {/* 接班处理弹窗 */}
      {processModal.isOpen && processModal.task && processModal.customer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeProcessTask} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-violet-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <img src={processModal.customer.avatar} alt={processModal.customer.name} className="w-10 h-10 rounded-full" />
                <div>
                  <h3 className="font-semibold text-gray-900">{processModal.customer.name} · 接班处理</h3>
                  <p className="text-xs text-gray-500">{processModal.customer.projectType} · 术后第{getDaysAfterSurgery(processModal.customer.surgeryDate)}天</p>
                </div>
              </div>
              <button
                onClick={closeProcessTask}
                className="p-2 hover:bg-white/60 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* 原始任务内容 */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">交接任务来自 {processModal.task.fromStaffName}：</p>
                <p className="text-sm text-gray-800">{processModal.task.content}</p>
              </div>

              {/* 处理类型选择 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">处理方式</label>
                <div className="grid grid-cols-2 gap-2">
                  {processTypeOptions.map(opt => {
                    const OptIcon = opt.icon;
                    const selected = processModal.actionType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setProcessModal({ ...processModal, actionType: opt.id })}
                        className={`p-2.5 rounded-lg border-2 text-left transition-all flex items-center gap-2 ${
                          selected
                            ? 'border-violet-500 bg-violet-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${selected ? opt.color : 'bg-gray-100 text-gray-500'}`}>
                          <OptIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-xs font-medium ${selected ? 'text-violet-700' : 'text-gray-700'}`}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 处理说明 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">处理说明（必填）</label>
                <textarea
                  value={processModal.note}
                  onChange={(e) => setProcessModal({ ...processModal, note: e.target.value })}
                  placeholder="请详细描述处理情况、顾客反馈、后续安排等..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                />
              </div>

              {/* 同时标记完成 */}
              <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg border border-violet-100">
                <input
                  type="checkbox"
                  id="markComplete"
                  checked={processModal.andMarkComplete}
                  onChange={(e) => setProcessModal({ ...processModal, andMarkComplete: e.target.checked })}
                  className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                />
                <label htmlFor="markComplete" className="text-sm text-gray-700 cursor-pointer flex-1">
                  提交后同时将此任务标记为<span className="font-semibold text-violet-700">已完成</span>
                </label>
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeProcessTask}
                  className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={submitProcessTask}
                  disabled={!processModal.note.trim()}
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {processModal.andMarkComplete ? '提交并完成任务' : '仅保存处理记录'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
