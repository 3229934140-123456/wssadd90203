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
  Calendar,
  Stethoscope,
  Clipboard,
  Utensils,
  Pill,
  CalendarDays,
  StickyNote,
  RefreshCcw,
  ArrowLeftRight
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
  batch_sent: { color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-amber-200', icon: Layers },
  doctor_advice: { color: 'text-indigo-600', bgColor: 'bg-indigo-100', borderColor: 'border-indigo-200', icon: Stethoscope },
  handover_note: { color: 'text-slate-600', bgColor: 'bg-slate-100', borderColor: 'border-slate-200', icon: Clipboard },
  handover_action: { color: 'text-violet-600', bgColor: 'bg-violet-100', borderColor: 'border-violet-200', icon: ArrowLeftRight }
};

const processTypeLabels: Record<string, string> = {
  phone_confirmed: '电话确认',
  review_reminded: '提醒复查',
  reassigned_doctor: '再次转医生',
  followup_done: '完成随访',
  other: '其他处理'
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
                              <p className="text-xs font-medium text-purple-700 mb-1 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> 通话详情
                              </p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{event.metadata.content}</p>
                            </div>
                          )}
                          
                          {isSelected && event.type === 'batch_sent' && event.metadata?.templateName && (
                            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                              <p className="text-xs font-medium text-amber-700 mb-1 flex items-center gap-1">
                                <Layers className="w-3 h-3" /> 发送模板
                              </p>
                              <p className="text-sm text-gray-700">{event.metadata.templateName}</p>
                              {event.metadata?.channel && (
                                <p className="text-xs text-gray-500 mt-1">
                                  渠道：{event.metadata.channel === 'sms' ? '短信' : event.metadata.channel === 'wechat' ? '微信' : '电话'}
                                </p>
                              )}
                            </div>
                          )}

                          {isSelected && event.type === 'doctor_advice' && event.doctorAdvice && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                                <Stethoscope className="w-3 h-3" /> 医生后续安排
                              </p>
                              {event.doctorAdvice.dietAdvice && (
                                <div className="p-2.5 bg-green-50 rounded-lg border border-green-100">
                                  <p className="text-xs font-medium text-green-700 mb-0.5 flex items-center gap-1">
                                    <Utensils className="w-3 h-3" /> 饮食建议
                                  </p>
                                  <p className="text-sm text-gray-700">{event.doctorAdvice.dietAdvice}</p>
                                </div>
                              )}
                              {event.doctorAdvice.medicationAdvice && (
                                <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                                  <p className="text-xs font-medium text-blue-700 mb-0.5 flex items-center gap-1">
                                    <Pill className="w-3 h-3" /> 用药建议
                                  </p>
                                  <p className="text-sm text-gray-700">{event.doctorAdvice.medicationAdvice}</p>
                                </div>
                              )}
                              {event.doctorAdvice.reviewTime && (
                                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                                  <p className="text-xs font-medium text-amber-700 mb-0.5 flex items-center gap-1">
                                    <CalendarDays className="w-3 h-3" /> 复查时间
                                  </p>
                                  <p className="text-sm text-gray-700 font-medium">{event.doctorAdvice.reviewTime}</p>
                                </div>
                              )}
                              {event.doctorAdvice.additionalAdvice && (
                                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                                  <p className="text-xs font-medium text-gray-700 mb-0.5 flex items-center gap-1">
                                    <StickyNote className="w-3 h-3" /> 其他说明
                                  </p>
                                  <p className="text-sm text-gray-700">{event.doctorAdvice.additionalAdvice}</p>
                                </div>
                              )}
                              {event.metadata?.doctor && (
                                <p className="text-xs text-gray-400 pt-1 flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  处置医生：{event.metadata.doctor}
                                </p>
                              )}
                            </div>
                          )}

                          {isSelected && event.type === 'handover_action' && event.handoverAction && (
                            <div className="mt-3 p-3 bg-violet-50 rounded-lg border border-violet-100">
                              <p className="text-xs font-medium text-violet-700 mb-1 flex items-center gap-1">
                                <RefreshCcw className="w-3 h-3" /> 
                                接班处理：{processTypeLabels[event.handoverAction.type] || event.handoverAction.type}
                              </p>
                              {event.handoverAction.note && (
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {event.handoverAction.note}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                处理人：{event.handoverAction.operatorName}
                                {event.metadata?.fromStaffName && (
                                  <span className="ml-2">交班来自：{event.metadata.fromStaffName}</span>
                                )}
                              </p>
                            </div>
                          )}

                          {isSelected && event.type === 'handover_note' && event.metadata && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <p className="text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                                <Clipboard className="w-3 h-3" /> 交接班备注
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                交班人：{event.metadata.fromStaffName}
                                {event.metadata.toStaffName ? ` → 接交人：${event.metadata.toStaffName}` : '（待接交）'}
                              </p>
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
