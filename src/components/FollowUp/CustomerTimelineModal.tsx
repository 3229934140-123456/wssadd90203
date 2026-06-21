import { useState } from 'react';
import {
  X,
  UserPlus,
  MessageSquare,
  Phone,
  AlertTriangle,
  User,
  CheckCircle2,
  Clock,
  Layers,
  Calendar
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { formatDateTime } from '@/utils';
import type { TimelineEvent, TimelineEventType, Customer } from '@/types';

interface CustomerTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
}

const eventConfig: Record<TimelineEventType, { color: string; bgColor: string; borderColor: string; icon: typeof UserPlus }> = {
  customer_created: { color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-200', icon: UserPlus },
  followup_sent: { color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-200', icon: MessageSquare },
  phone_call: { color: 'text-purple-600', bgColor: 'bg-purple-100', borderColor: 'border-purple-200', icon: Phone },
  exception_reported: { color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-200', icon: AlertTriangle },
  exception_assigned: { color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-orange-200', icon: User },
  exception_resolved: { color: 'text-emerald-600', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-200', icon: CheckCircle2 },
  checkin: { color: 'text-teal-600', bgColor: 'bg-teal-100', borderColor: 'border-teal-200', icon: CheckCircle2 },
  batch_sent: { color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-amber-200', icon: Layers }
};

export default function CustomerTimelineModal({ isOpen, onClose, customer }: CustomerTimelineModalProps) {
  const { getCustomerTimeline } = useAppStore();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  if (!isOpen) return null;

  const timeline = getCustomerTimeline(customer.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 p-2 bg-white rounded-xl shadow-sm">
              <img src={customer.avatar} alt={customer.name} className="w-10 h-10 rounded-full" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{customer.name} · 随访时间线</h2>
                <p className="text-xs text-gray-500">{customer.projectType} · 主治医生：{customer.doctorName}</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/60 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {timeline.length > 0 ? (
            <div className="relative">
              <div className="absolute left-[22px] top-2 bottom-2 w-0.5 bg-gray-200" />
              
              {timeline.map((event, index) => {
                const config = eventConfig[event.type];
                const EventIcon = config.icon;
                const isSelected = selectedEvent === event.id;
                const isLast = index === timeline.length - 1;

                return (
                  <div key={event.id} className={`relative flex gap-4 ${isLast ? '' : 'mb-6'}`}>
                    <div className={`relative z-10 w-11 h-11 rounded-full ${config.bgColor} ${config.borderColor} border-2 flex items-center justify-center flex-shrink-0 ${
                      event.type === 'exception_reported' && event.metadata?.level === 'high' ? 'animate-pulse' : ''
                    }`}>
                      <EventIcon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    
                    <div 
                      className={`flex-1 rounded-xl border ${config.borderColor} ${isSelected ? config.bgColor : 'bg-white'} p-4 cursor-pointer transition-all hover:shadow-md`}
                      onClick={() => setSelectedEvent(isSelected ? null : event.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`font-semibold ${config.color}`}>{event.title}</h4>
                            {event.type === 'exception_reported' && event.metadata?.level === 'high' && (
                              <span className="px-1.5 py-0.5 text-xs font-bold rounded bg-red-500 text-white animate-pulse">
                                高风险
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{event.description}</p>
                          
                          {isSelected && event.type === 'phone_call' && event.metadata?.content && (
                            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                              <p className="text-xs font-medium text-purple-700 mb-1">📞 通话详情</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{event.metadata.content}</p>
                            </div>
                          )}
                          
                          {isSelected && event.type === 'batch_sent' && event.metadata?.templateName && (
                            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                              <p className="text-xs font-medium text-amber-700 mb-1">🎁 发送模板</p>
                              <p className="text-sm text-gray-700">{event.metadata.templateName}</p>
                            </div>
                          )}
                        </div>
                        
                        <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(event.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">暂无时间线记录</h3>
              <p className="text-sm text-gray-500">该顾客还没有随访操作记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
