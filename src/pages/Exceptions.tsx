import { useState } from 'react';
import { AlertTriangle, Clock, CheckCircle2, User, Calendar, MessageSquare, Filter } from 'lucide-react';
import PageHeader from '@/components/Layout/PageHeader';
import { useAppStore } from '@/store/appStore';
import { formatDateTime } from '@/utils';
import type { RiskLevel, ExceptionStatus } from '@/types';

export default function Exceptions() {
  const { exceptions, customers, staff, assignException, resolveException } = useAppStore();
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedException, setSelectedException] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');

  const levelConfig: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
    low: { label: '低风险', color: 'text-green-600', bgColor: 'bg-green-100' },
    medium: { label: '中风险', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    high: { label: '高风险', color: 'text-red-600', bgColor: 'bg-red-100' }
  };

  const statusConfig: Record<ExceptionStatus, { label: string; color: string; icon: typeof AlertTriangle }> = {
    pending: { label: '待处理', color: 'text-amber-600', icon: Clock },
    processing: { label: '处理中', color: 'text-blue-600', icon: MessageSquare },
    resolved: { label: '已解决', color: 'text-green-600', icon: CheckCircle2 }
  };

  const filteredExceptions = exceptions.filter(e => {
    const matchLevel = filterLevel === 'all' || e.level === filterLevel;
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchLevel && matchStatus;
  });

  const getCustomer = (customerId: string) => customers.find(c => c.id === customerId);
  const doctors = staff.filter(s => s.role === 'doctor');

  const handleAssign = (exceptionId: string, doctorId: string) => {
    assignException(exceptionId, doctorId);
  };

  const handleResolve = (exceptionId: string) => {
    if (resolution.trim()) {
      resolveException(exceptionId, resolution);
      setSelectedException(null);
      setResolution('');
    }
  };

  const selectedExceptionData = exceptions.find(e => e.id === selectedException);
  const selectedCustomer = selectedExceptionData ? getCustomer(selectedExceptionData.customerId) : null;

  return (
    <div className="min-h-screen">
      <PageHeader
        title="异常处理"
        subtitle="管理顾客异常反馈，跟踪处理进度"
      />

      <div className="p-8">
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">全部状态</option>
                    <option value="pending">待处理</option>
                    <option value="processing">处理中</option>
                    <option value="resolved">已解决</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">全部风险</option>
                    <option value="low">低风险</option>
                    <option value="medium">中风险</option>
                    <option value="high">高风险</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {filteredExceptions.map(exception => {
                  const customer = getCustomer(exception.customerId);
                  const level = levelConfig[exception.level];
                  const status = statusConfig[exception.status];
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={exception.id}
                      onClick={() => setSelectedException(exception.id)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedException === exception.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full ${level.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <AlertTriangle className={`w-5 h-5 ${level.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{customer?.name || '未知顾客'}</h4>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${level.bgColor} ${level.color}`}>
                              {level.label}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 ${status.color}`}>
                              <StatusIcon className="w-3 h-3 inline mr-1" />
                              {status.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{exception.type}</p>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{exception.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDateTime(exception.createdAt)}
                            </span>
                            {exception.assignedDoctor && (
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                {exception.assignedDoctor}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredExceptions.length === 0 && (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">暂无异常记录</h3>
                  <p className="text-sm text-gray-500">所有顾客恢复情况良好</p>
                </div>
              )}
            </div>
          </div>

          {selectedExceptionData && selectedCustomer && (
            <div className="w-96">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-8">
                <h3 className="font-semibold text-gray-900 mb-4">异常详情</h3>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                  <img
                    src={selectedCustomer.avatar}
                    alt={selectedCustomer.name}
                    className="w-12 h-12 rounded-full bg-white"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                    <p className="text-sm text-gray-500">{selectedCustomer.projectType}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">异常类型</span>
                    <span className="text-sm font-medium text-gray-900">{selectedExceptionData.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">风险等级</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${levelConfig[selectedExceptionData.level].bgColor} ${levelConfig[selectedExceptionData.level].color}`}>
                      {levelConfig[selectedExceptionData.level].label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">当前状态</span>
                    <span className="text-sm font-medium text-gray-900">
                      {statusConfig[selectedExceptionData.status].label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">上报时间</span>
                    <span className="text-sm text-gray-600">{formatDateTime(selectedExceptionData.createdAt)}</span>
                  </div>
                  {selectedExceptionData.assignedDoctor && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">负责医生</span>
                      <span className="text-sm text-gray-600">{selectedExceptionData.assignedDoctor}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-2">异常描述</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedExceptionData.description}
                  </p>
                </div>

                {selectedExceptionData.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">分配医生</p>
                    <div className="space-y-2">
                      {doctors.map(doctor => (
                        <button
                          key={doctor.id}
                          onClick={() => handleAssign(selectedExceptionData.id, doctor.id)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                          <img src={doctor.avatar} alt={doctor.name} className="w-8 h-8 rounded-full" />
                          <span className="text-sm font-medium text-gray-700">{doctor.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedExceptionData.status === 'processing' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">处理结果</p>
                    <textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="请输入处理意见和建议..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <button
                      onClick={() => handleResolve(selectedExceptionData.id)}
                      disabled={!resolution.trim()}
                      className="w-full mt-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      标记为已解决
                    </button>
                  </div>
                )}

                {selectedExceptionData.status === 'resolved' && selectedExceptionData.resolution && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500 mb-2">处理结果</p>
                    <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg border border-green-200">
                      {selectedExceptionData.resolution}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      解决时间：{formatDateTime(selectedExceptionData.resolvedAt!)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
