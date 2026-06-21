import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  User, 
  Calendar, 
  MessageSquare, 
  Filter,
  Stethoscope,
  Users,
  History,
  History as ClockIcon,
  BellRing,
  ChevronDown,
  ChevronUp,
  FolderClock,
  Utensils,
  Pill,
  CalendarDays,
  StickyNote
} from 'lucide-react';
import PageHeader from '@/components/Layout/PageHeader';
import { useAppStore } from '@/store/appStore';
import { formatDateTime, getDaysAfterSurgery } from '@/utils';
import type { RiskLevel, ExceptionStatus, Customer, DoctorAdvice } from '@/types';
import CustomerTimelineModal from '@/components/FollowUp/CustomerTimelineModal';

type ViewMode = 'all' | 'mine';

export default function Exceptions() {
  const { 
    exceptions, 
    customers, 
    staff, 
    assignException, 
    resolveException,
    getAssignedExceptions,
    currentUser,
    getOverdueHighRiskExceptions
  } = useAppStore();
  
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedException, setSelectedException] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [sortBy, setSortBy] = useState<'level' | 'time'>('level');
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineCustomer, setTimelineCustomer] = useState<Customer | null>(null);
  const [overdueCount, setOverdueCount] = useState(0);

  // 医生建议结构化表单状态
  const [dietAdvice, setDietAdvice] = useState('');
  const [medicationAdvice, setMedicationAdvice] = useState('');
  const [reviewTime, setReviewTime] = useState('');
  const [additionalAdvice, setAdditionalAdvice] = useState('');

  // 如果是医生身份，默认显示我的任务
  useEffect(() => {
    if (currentUser.role === 'doctor') {
      setViewMode('mine');
    }
  }, [currentUser.role, currentUser.id]);

  // 切换选中的异常时，重置表单
  useEffect(() => {
    setResolution('');
    setDietAdvice('');
    setMedicationAdvice('');
    setReviewTime('');
    setAdditionalAdvice('');
  }, [selectedException]);

  useEffect(() => {
    const timer = setInterval(() => {
      setOverdueCount(getOverdueHighRiskExceptions().length);
    }, 10000);
    setOverdueCount(getOverdueHighRiskExceptions().length);
    return () => clearInterval(timer);
  }, [getOverdueHighRiskExceptions]);

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

  const getWaitTime = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}小时${minutes}分`;
    return `${minutes}分钟`;
  };

  const isOverdueHighRisk = (exception: any) => {
    const diff = Date.now() - new Date(exception.createdAt).getTime();
    return exception.level === 'high' && diff > 30 * 60 * 1000; // 30分钟
  };

  const displayExceptions = viewMode === 'mine' 
    ? getAssignedExceptions()
    : exceptions.filter(e => {
        const matchLevel = filterLevel === 'all' || e.level === filterLevel;
        const matchStatus = filterStatus === 'all' || e.status === filterStatus;
        return matchLevel && matchStatus;
      });

  const sortedExceptions = [...displayExceptions].sort((a, b) => {
    if (sortBy === 'level') {
      const levelOrder = { high: 0, medium: 1, low: 2 };
      return levelOrder[a.level] - levelOrder[b.level];
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const getCustomer = (customerId: string) => customers.find(c => c.id === customerId);
  const doctors = staff.filter(s => s.role === 'doctor');

  const handleAssign = (exceptionId: string, doctorId: string) => {
    assignException(exceptionId, doctorId);
  };

  const handleResolve = (exceptionId: string) => {
    if (resolution.trim() || dietAdvice.trim() || medicationAdvice.trim() || reviewTime.trim()) {
      const hasStructured = dietAdvice.trim() || medicationAdvice.trim() || reviewTime.trim() || additionalAdvice.trim();
      const advice: DoctorAdvice = {
        dietAdvice: dietAdvice.trim(),
        medicationAdvice: medicationAdvice.trim(),
        reviewTime: reviewTime.trim(),
        additionalAdvice: additionalAdvice.trim()
      };
      resolveException(exceptionId, resolution, hasStructured ? advice : undefined);
      setSelectedException(null);
      setResolution('');
      setDietAdvice('');
      setMedicationAdvice('');
      setReviewTime('');
      setAdditionalAdvice('');
    }
  };

  const openTimeline = (customer: Customer) => {
    setTimelineCustomer(customer);
    setShowTimeline(true);
  };

  const selectedExceptionData = exceptions.find(e => e.id === selectedException);
  const selectedCustomer = selectedExceptionData ? getCustomer(selectedExceptionData.customerId) : null;

  const isDoctor = currentUser.role === 'doctor';

  const mineCount = getAssignedExceptions().length;

  return (
    <div className="min-h-screen">
      <PageHeader
        title="异常处理"
        subtitle="管理顾客异常反馈，跟踪处理进度"
      />

      {overdueCount > 0 && (
        <div className="mx-8 -mt-4 mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-xl flex items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
            <BellRing className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-red-700 text-lg">⚠️ 有 {overdueCount} 条高风险异常超时未处理！</p>
            <p className="text-sm text-red-600">高风险异常超过30分钟未处理，请立即跟进</p>
          </div>
          <button
            onClick={() => { setViewMode('all'); setFilterLevel('high'); setFilterStatus('all'); }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            立即查看
          </button>
        </div>
      )}

      <div className="p-8 pt-4">
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        viewMode === 'all'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      全部异常
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/20">
                        {exceptions.length}
                      </span>
                    </button>
                    {isDoctor && (
                      <button
                        onClick={() => setViewMode('mine')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                          viewMode === 'mine'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Stethoscope className="w-4 h-4" />
                        我的任务
                        {mineCount > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                            {mineCount}
                          </span>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">排序：</span>
                    <button
                      onClick={() => setSortBy(sortBy === 'level' ? 'time' : 'level')}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                    >
                      {sortBy === 'level' ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                          按风险等级
                          <ChevronDown className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          <ClockIcon className="w-3.5 h-3.5 text-blue-500" />
                          按等待时长
                          <ChevronUp className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {viewMode === 'all' && (
                  <div className="flex items-center gap-4 flex-wrap">
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
                        <option value="high">🔴 高风险</option>
                        <option value="medium">🟠 中风险</option>
                        <option value="low">🟢 低风险</option>
                      </select>
                    </div>
                  </div>
                )}

                {viewMode === 'mine' && mineCount > 0 && (
                  <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-sm text-purple-700 font-medium">
                      👨‍⚕️ {currentUser.name} 医生，您有 {mineCount} 条待处理的异常，请优先处理高风险
                    </p>
                  </div>
                )}
              </div>

              <div className="divide-y divide-gray-100">
                {sortedExceptions.map(exception => {
                  const customer = getCustomer(exception.customerId);
                  const level = levelConfig[exception.level];
                  const status = statusConfig[exception.status];
                  const StatusIcon = status.icon;
                  const waitTime = getWaitTime(exception.createdAt);
                  const overdue = isOverdueHighRisk(exception);

                  return (
                    <div
                      key={exception.id}
                      onClick={() => setSelectedException(exception.id)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedException === exception.id ? 'bg-blue-50' : ''
                      } ${overdue ? 'bg-red-50/50' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full ${level.bgColor} flex items-center justify-center flex-shrink-0 ${overdue ? 'animate-pulse ring-4 ring-red-200' : ''}`}>
                          <AlertTriangle className={`w-5 h-5 ${level.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-gray-900">{customer?.name || '未知顾客'}</h4>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${level.bgColor} ${level.color}`}>
                              {level.label}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 ${status.color}`}>
                              <StatusIcon className="w-3 h-3 inline mr-1" />
                              {status.label}
                            </span>
                            {overdue && (
                              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white animate-pulse">
                                已超时
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{exception.type}</p>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{exception.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDateTime(exception.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FolderClock className="w-3.5 h-3.5" />
                              等待 {waitTime}
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

              {sortedExceptions.length === 0 && (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {viewMode === 'mine' ? '暂无待您处理的异常' : '暂无异常记录'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {viewMode === 'mine' ? '您当前没有需要处理的异常任务' : '所有顾客恢复情况良好'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {selectedExceptionData && selectedCustomer && (
            <div className="w-96">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">异常详情</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openTimeline(selectedCustomer);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50"
                  >
                    <Clock className="w-3 h-3" />
                    查看时间线
                  </button>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                  <img
                    src={selectedCustomer.avatar}
                    alt={selectedCustomer.name}
                    className="w-12 h-12 rounded-full bg-white"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                    <p className="text-sm text-gray-500">{selectedCustomer.projectType}</p>
                    <p className="text-xs text-gray-400">术后第{getDaysAfterSurgery(selectedCustomer.surgeryDate)}天</p>
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">等待时长</span>
                    <span className="text-sm font-medium text-orange-600">
                      {getWaitTime(selectedExceptionData.createdAt)}
                    </span>
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
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-purple-600" />
                      医生处置建议
                    </p>

                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                          <Utensils className="w-3 h-3" /> 饮食建议
                        </label>
                        <textarea
                          value={dietAdvice}
                          onChange={(e) => setDietAdvice(e.target.value)}
                          placeholder="如：继续流质饮食7天，避免辛辣、海鲜等发物，多吃高蛋白..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                          <Pill className="w-3 h-3" /> 用药建议
                        </label>
                        <textarea
                          value={medicationAdvice}
                          onChange={(e) => setMedicationAdvice(e.target.value)}
                          placeholder="如：口服头孢3天，早晚各1粒，外用莫匹罗星软膏..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" /> 复查时间
                        </label>
                        <input
                          type="text"
                          value={reviewTime}
                          onChange={(e) => setReviewTime(e.target.value)}
                          placeholder="如：术后第7天上午9点 或 一周后（6月29日）"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                          <StickyNote className="w-3 h-3" /> 其他说明（可选）
                        </label>
                        <textarea
                          value={additionalAdvice}
                          onChange={(e) => setAdditionalAdvice(e.target.value)}
                          placeholder="其他需要补充的叮嘱..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> 整体处理总结
                      </p>
                      <textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="简单描述整体处理结论..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <button
                      onClick={() => handleResolve(selectedExceptionData.id)}
                      disabled={!resolution.trim() && !dietAdvice.trim() && !medicationAdvice.trim() && !reviewTime.trim()}
                      className="w-full mt-3 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      提交处置建议并标记已解决
                    </button>
                  </div>
                )}

                {selectedExceptionData.status === 'resolved' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {selectedExceptionData.doctorAdvice ? (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-purple-600" />
                          医生处置建议
                        </p>

                        {selectedExceptionData.doctorAdvice.dietAdvice && (
                          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                            <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                              <Utensils className="w-3 h-3" /> 饮食建议
                            </p>
                            <p className="text-sm text-gray-700">{selectedExceptionData.doctorAdvice.dietAdvice}</p>
                          </div>
                        )}

                        {selectedExceptionData.doctorAdvice.medicationAdvice && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-xs font-medium text-blue-700 mb-1 flex items-center gap-1">
                              <Pill className="w-3 h-3" /> 用药建议
                            </p>
                            <p className="text-sm text-gray-700">{selectedExceptionData.doctorAdvice.medicationAdvice}</p>
                          </div>
                        )}

                        {selectedExceptionData.doctorAdvice.reviewTime && (
                          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                            <p className="text-xs font-medium text-amber-700 mb-1 flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" /> 复查时间
                            </p>
                            <p className="text-sm text-gray-700">{selectedExceptionData.doctorAdvice.reviewTime}</p>
                          </div>
                        )}

                        {selectedExceptionData.doctorAdvice.additionalAdvice && (
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                              <StickyNote className="w-3 h-3" /> 其他说明
                            </p>
                            <p className="text-sm text-gray-700">{selectedExceptionData.doctorAdvice.additionalAdvice}</p>
                          </div>
                        )}

                        {selectedExceptionData.resolution && (
                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <p className="text-xs font-medium text-purple-700 mb-1 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> 处理结论
                            </p>
                            <p className="text-sm text-gray-700">{selectedExceptionData.resolution}</p>
                          </div>
                        )}

                        <p className="text-xs text-gray-400 pt-2">
                          解决时间：{formatDateTime(selectedExceptionData.resolvedAt!)}
                        </p>
                      </div>
                    ) : (
                      selectedExceptionData.resolution && (
                        <>
                          <p className="text-sm text-gray-500 mb-2">处理结果</p>
                          <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg border border-green-200">
                            {selectedExceptionData.resolution}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            解决时间：{formatDateTime(selectedExceptionData.resolvedAt!)}
                          </p>
                        </>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showTimeline && timelineCustomer && (
        <CustomerTimelineModal
          isOpen={showTimeline}
          onClose={() => { setShowTimeline(false); setTimelineCustomer(null); }}
          customer={timelineCustomer}
        />
      )}
    </div>
  );
}
