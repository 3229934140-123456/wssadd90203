import {
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  MessageSquare,
  Phone,
  Mail,
  MoreVertical
} from 'lucide-react';
import type { Customer, FollowUpRecord, ExceptionRecord, RiskLevel } from '@/types';
import { getCurrentPhase, formatDateTime } from '@/utils';

interface CustomerCardProps {
  customer: Customer;
  followUp: FollowUpRecord;
  exceptions: ExceptionRecord[];
  onSendMessage: (followUpId: string) => void;
  onMarkException: (customer: Customer) => void;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const levelConfig: Record<RiskLevel, { label: string; color: string; bgColor: string; borderColor: string }> = {
  low: { label: '低', color: 'text-green-700', bgColor: 'bg-green-100', borderColor: 'border-green-200' },
  medium: { label: '中', color: 'text-orange-700', bgColor: 'bg-orange-100', borderColor: 'border-orange-200' },
  high: { label: '高', color: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-200' },
};

export default function CustomerCard({
  customer,
  followUp,
  exceptions,
  onSendMessage,
  onMarkException,
  showCheckbox,
  isSelected,
  onToggleSelect
}: CustomerCardProps) {
  const currentPhase = getCurrentPhase(customer.surgeryDate, customer.projectType);
  
  const customerExceptions = exceptions.filter(e => e.customerId === customer.id);
  const unresolvedExceptions = customerExceptions.filter(e => e.status !== 'resolved');
  const resolvedExceptions = customerExceptions.filter(e => e.status === 'resolved');
  const hasActiveException = unresolvedExceptions.length > 0;
  
  const statusConfig = {
    pending: { label: '待发送', color: 'bg-gray-100 text-gray-600', icon: Clock },
    sent: { label: '已发送', color: 'bg-blue-100 text-blue-600', icon: MessageSquare },
    read: { label: '已读', color: 'bg-green-100 text-green-600', icon: CheckCircle2 },
    completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 }
  };

  const status = statusConfig[followUp.status];
  const StatusIcon = status.icon;

  return (
    <div className={`bg-white rounded-xl border p-5 hover:shadow-md transition-all duration-200 relative ${
      hasActiveException
        ? 'border-red-300 shadow-sm ring-1 ring-red-100'
        : resolvedExceptions.length > 0
          ? 'border-blue-200'
          : 'border-gray-200 hover:border-blue-200'
    } ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}>
      {showCheckbox && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </div>
      )}
      <div className={`flex items-start gap-4 ${showCheckbox ? 'pl-6' : ''}`}>
        <img
          src={customer.avatar}
          alt={customer.name}
          className="w-12 h-12 rounded-full bg-gray-100"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{customer.name}</h3>
            <span className="px-2 py-0.5 text-xs font-medium bg-pink-50 text-pink-600 rounded-full">
              术后第{followUp.dayNumber}天
            </span>
            {unresolvedExceptions.length > 0 && (
              <div className="flex items-center gap-1.5">
                {unresolvedExceptions.slice(0, 2).map(e => {
                  const lvl = levelConfig[e.level];
                  return (
                    <span
                      key={e.id}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${lvl.bgColor} ${lvl.color} ${lvl.borderColor}`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {e.type.split('-')[0]}
                      <span className={`font-bold ${lvl.color}`}>!</span>
                    </span>
                  );
                })}
                {unresolvedExceptions.length > 2 && (
                  <span className="text-xs text-red-600 font-medium">+{unresolvedExceptions.length - 2}</span>
                )}
              </div>
            )}
            {resolvedExceptions.length > 0 && unresolvedExceptions.length === 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                <CheckCircle2 className="w-3 h-3" />
                已处理异常{resolvedExceptions.length}条
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{customer.projectType} · {customer.doctorName}</p>
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {status.label}
        </div>
      </div>

      {hasActiveException && (
        <div className={`mt-3 p-3 rounded-lg border ${levelConfig[unresolvedExceptions[0].level].bgColor} ${levelConfig[unresolvedExceptions[0].level].borderColor}`}>
          <div className="flex items-start gap-2">
            <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${levelConfig[unresolvedExceptions[0].level].color}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${levelConfig[unresolvedExceptions[0].level].color}`}>
                ⚠️ 有{unresolvedExceptions.length}条未处理异常
              </p>
              <p className="text-xs text-gray-700 mt-0.5 line-clamp-1">
                {unresolvedExceptions.map(e => e.type).join('、')}
              </p>
            </div>
          </div>
        </div>
      )}

      {currentPhase && (
        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <p className="text-xs font-medium text-amber-700 mb-2">禁食重点</p>
          <div className="flex flex-wrap gap-1.5">
            {currentPhase.forbidden.slice(0, 3).map((item, idx) => (
              <span key={idx} className="px-2 py-0.5 text-xs bg-white text-amber-600 rounded border border-amber-200">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          {followUp.lastCheckIn ? (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              打卡：{formatDateTime(followUp.lastCheckIn).split(' ')[1]}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
              未打卡
            </span>
          )}
          {followUp.sentAt && followUp.channel && (
            <span className="flex items-center gap-1">
              {followUp.channel === 'phone' ? <Phone className="w-3.5 h-3.5" /> :
               followUp.channel === 'sms' ? <Mail className="w-3.5 h-3.5" /> :
               <MessageSquare className="w-3.5 h-3.5" />}
              {followUp.channel === 'phone' ? '电话' : followUp.channel === 'sms' ? '短信' : '微信'}：{formatDateTime(followUp.sentAt).split(' ')[1]}
            </span>
          )}
        </div>
      </div>

      {followUp.status === 'pending' && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
          <button
            onClick={() => onSendMessage(followUp.id)}
            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            发送提醒
          </button>
          <button
            onClick={() => onMarkException(customer)}
            className={`py-2 px-3 border text-sm font-medium rounded-lg transition-colors ${
              hasActiveException
                ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                : 'border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-600 hover:text-red-600'
            }`}
            title={hasActiveException ? '已有异常，点击追加上报' : '标记异常'}
          >
            <AlertCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {followUp.status !== 'pending' && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
          <button
            onClick={() => onMarkException(customer)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
              hasActiveException
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            {hasActiveException ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                查看/追加异常
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                操作记录
              </>
            )}
          </button>
          <div className="flex items-center gap-1">
            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
              <Mail className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
