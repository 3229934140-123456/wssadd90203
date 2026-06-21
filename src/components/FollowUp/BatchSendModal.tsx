import { useState } from 'react';
import { X, Send, CheckCircle2, Users, MessageCircle, Mail, Layers } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { getDaysAfterSurgery } from '@/utils';
import type { Customer } from '@/types';

interface BatchSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCustomerIds?: string[];
}

export default function BatchSendModal({ isOpen, onClose, preselectedCustomerIds = [] }: BatchSendModalProps) {
  const { customers, templates, batchSendFollowUps } = useAppStore();
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set(preselectedCustomerIds));
  const [selectedChannel, setSelectedChannel] = useState<'sms' | 'wechat'>('wechat');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const recoveryCustomers = customers.filter(c => {
    const days = getDaysAfterSurgery(c.surgeryDate);
    return days > 0 && days <= c.dietPeriodDays;
  });

  const holidayTemplates = templates.filter(t =>
    t.category === '特殊提醒' || t.name.includes('节假日') || t.name.includes('聚餐')
  );
  const otherTemplates = templates.filter(t => !holidayTemplates.includes(t));
  const templateList = holidayTemplates.length > 0 ? holidayTemplates : otherTemplates;

  if (templateList.length > 0 && !selectedTemplateId) {
    // 默认选中第一个节假日模板
    setSelectedTemplateId(templateList[0].id);
  }

  const toggleCustomer = (id: string) => {
    setSelectedCustomerIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedCustomerIds.size === recoveryCustomers.length) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(recoveryCustomers.map(c => c.id)));
    }
  };

  const handleSend = () => {
    if (selectedCustomerIds.size === 0 || !selectedTemplateId) return;
    batchSendFollowUps(Array.from(selectedCustomerIds), selectedChannel, selectedTemplateId);
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      setSelectedCustomerIds(new Set());
      onClose();
    }, 2000);
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const getPreviewContent = (customer: Customer) => {
    if (!selectedTemplate) return '';
    return selectedTemplate.content
      .replace('{name}', customer.name)
      .replace('{project}', customer.projectType)
      .replace('{doctor}', customer.doctorName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">批量发送节假日提醒</h2>
              <p className="text-xs text-gray-500">选择恢复期顾客，使用节假日模板统一发送</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/60 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSent ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-5">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">批量发送成功</h3>
            <p className="text-sm text-gray-500">
              已向 {selectedCustomerIds.size} 位顾客发送{selectedChannel === 'wechat' ? '微信小程序' : '短信'}提醒
            </p>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-red-500">*</span>
                  选择发送方式
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedChannel('wechat')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                      selectedChannel === 'wechat'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">微信小程序消息</span>
                  </button>
                  <button
                    onClick={() => setSelectedChannel('sms')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                      selectedChannel === 'sms'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Mail className="w-5 h-5" />
                    <span className="font-medium">短信发送</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-red-500">*</span>
                  选择话术模板
                </label>
                <div className="space-y-2">
                  {templateList.map(template => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplateId(template.id)}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                        selectedTemplateId === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-900">{template.name}</span>
                        <span className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-700 font-medium">
                          使用{template.useCount}次
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{template.content}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    选择恢复期顾客
                    <span className={`ml-1 px-2 py-0.5 text-xs rounded ${
                      selectedCustomerIds.size > 0
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      已选 {selectedCustomerIds.size}/{recoveryCustomers.length}
                    </span>
                  </label>
                  <button
                    onClick={toggleAll}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedCustomerIds.size === recoveryCustomers.length ? '取消全选' : '全选'}
                  </button>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  {recoveryCustomers.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {recoveryCustomers.map(customer => {
                        const days = getDaysAfterSurgery(customer.surgeryDate);
                        const isChecked = selectedCustomerIds.has(customer.id);
                        return (
                          <div
                            key={customer.id}
                            onClick={() => toggleCustomer(customer.id)}
                            className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                              isChecked ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCustomer(customer.id)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <img
                              src={customer.avatar}
                              alt={customer.name}
                              className="w-9 h-9 rounded-full bg-gray-100"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                              <p className="text-xs text-gray-500">
                                {customer.projectType} · 术后第{days}天 · 忌口{customer.dietPeriodDays}天
                              </p>
                            </div>
                            <div className="text-right w-40 flex-shrink-0">
                              <p className="text-xs text-gray-500">消息预览：</p>
                              <p className="text-xs text-gray-700 truncate">
                                {getPreviewContent(customer).slice(0, 20)}...
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-gray-500">
                      暂无恢复期顾客
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {selectedCustomerIds.size > 0 && (
                  <span>
                    将向 <span className="font-bold text-blue-600">{selectedCustomerIds.size}</span> 位顾客发送提醒
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-white rounded-lg transition-colors border border-gray-300"
                >
                  取消
                </button>
                <button
                  onClick={handleSend}
                  disabled={selectedCustomerIds.size === 0 || !selectedTemplateId}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  立即发送
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
