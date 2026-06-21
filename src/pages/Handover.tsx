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
  ArrowLeftRight
} from 'lucide-react';
import PageHeader from '@/components/Layout/PageHeader';
import CustomerTimelineModal from '@/components/FollowUp/CustomerTimelineModal';
import { useAppStore } from '@/store/appStore';
import { formatDateTime, getDaysAfterSurgery } from '@/utils';
import type { HandoverTask, Customer } from '@/types';

type TabType = 'current' | 'create' | 'history';

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
    getPendingHandovers
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [handoverNote, setHandoverNote] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Map<string, Omit<HandoverTask, 'id' | 'fromStaffId' | 'fromStaffName' | 'createdAt' | 'isCompleted'>>>(new Map());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

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
              { id: 'current', label: '待办清单', icon: FileText, badge: myActiveTasks.length + pendingHandovers.length },
              { id: 'create', label: '创建交接', icon: Plus, badge: selectedTasks.size },
              { id: 'history', label: '历史记录', icon: History, badge: 0 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 relative ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 -mb-px bg-blue-50/30'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

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
                          className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <CheckCheck className="w-4 h-4" />
                          接交
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
                                  className="mt-0.5 text-gray-400 hover:text-green-600 transition-colors"
                                  title="标记完成"
                                >
                                  <Circle className="w-5 h-5" />
                                </button>
                                <div className={`w-1.5 h-full rounded-full ${priorityColors[task.priority]} flex-shrink-0`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 text-xs rounded ${typeInfo.color}`}>
                                      <TypeIcon className="w-3 h-3 inline mr-1" />
                                      {typeInfo.label}
                                    </span>
                                    <span className="text-xs text-gray-400">{task.fromStaffName} 交接</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{task.content}</p>
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
    </div>
  );
}
