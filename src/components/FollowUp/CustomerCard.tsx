import {
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Phone,
  Mail,
  MoreVertical
} from 'lucide-react';
import type { Customer, FollowUpRecord } from '@/types';
import { getCurrentPhase, formatDateTime } from '@/utils';

interface CustomerCardProps {
  customer: Customer;
  followUp: FollowUpRecord;
  onSendMessage: (followUpId: string) => void;
  onMarkException: (customerId: string) => void;
}

export default function CustomerCard({ customer, followUp, onSendMessage, onMarkException }: CustomerCardProps) {
  const currentPhase = getCurrentPhase(customer.surgeryDate, customer.projectType);
  
  const statusConfig = {
    pending: { label: '待发送', color: 'bg-gray-100 text-gray-600', icon: Clock },
    sent: { label: '已发送', color: 'bg-blue-100 text-blue-600', icon: MessageSquare },
    read: { label: '已读', color: 'bg-green-100 text-green-600', icon: CheckCircle2 },
    completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 }
  };

  const status = statusConfig[followUp.status];
  const StatusIcon = status.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-200 hover:border-blue-200">
      <div className="flex items-start gap-4">
        <img
          src={customer.avatar}
          alt={customer.name}
          className="w-12 h-12 rounded-full bg-gray-100"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{customer.name}</h3>
            <span className="px-2 py-0.5 text-xs font-medium bg-pink-50 text-pink-600 rounded-full">
              术后第{followUp.dayNumber}天
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{customer.projectType} · {customer.doctorName}</p>
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {status.label}
        </div>
      </div>

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
          {followUp.sentAt && (
            <span>发送：{formatDateTime(followUp.sentAt).split(' ')[1]}</span>
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
            onClick={() => onMarkException(customer.id)}
            className="py-2 px-3 border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-600 hover:text-red-600 text-sm font-medium rounded-lg transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {followUp.status !== 'pending' && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
          <button className="flex-1 py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4" />
            查看详情
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
