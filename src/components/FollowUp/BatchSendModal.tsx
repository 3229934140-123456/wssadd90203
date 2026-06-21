import { useState, useEffect } from 'react';
import { 
  X, Send, CheckCircle2, Users, MessageCircle, Mail, Layers,
  AlertCircle, CheckCircle, XCircle, ChevronRight, ArrowLeft,
  FileText, Smile
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { getDaysAfterSurgery } from '@/utils';
import type { Customer, BatchSendResponse } from '@/types';

interface BatchSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCustomerIds?: string[];
}

type Step = 'select' | 'confirm' | 'result';

export default function BatchSendModal({ isOpen, onClose, preselectedCustomerIds = [] }: BatchSendModalProps) {
  const { customers, templates, batchSendFollowUps, preselectedBatchCustomerIds } = useAppStore();
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [selectedChannel, setSelectedChannel] = useState<'sms' | 'wechat'>('wechat');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [sendResult, setSendResult] = useState<BatchSendResponse | null>(null);
  const [step, setStep] = useState<Step>('select');

  useEffect(() => {
    if (isOpen) {
      const idsToUse = preselectedCustomerIds.length > 0 
        ? preselectedCustomerIds 
        : preselectedBatchCustomerIds;
      setSelectedCustomerIds(new Set(idsToUse));
      setStep('select');
      setSendResult(null);
    }
  }, [isOpen, preselectedCustomerIds, preselectedBatchCustomerIds]);

  if (!isOpen) return null;

  const recoveryCustomers = customers.filter(c => {
    const days = getDaysAfterSurgery(c.surgeryDate);
    return days > 0 && days <= c.dietPeriodDays;
  });

  const selectedCustomers = recoveryCustomers.filter(c => selectedCustomerIds.has(c.id));

  const holidayTemplates = templates.filter(t =>
    t.category === '特殊提醒' || t.name.includes('节假日') || t.name.includes('聚餐')
  );
  const otherTemplates = templates.filter(t => !holidayTemplates.includes(t));
  const templateList = holidayTemplates.length > 0 ? holidayTemplates : otherTemplates;

  if (templateList.length > 0 && !selectedTemplateId && step === 'select') {
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

  const handleCheckboxClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleCustomer(id);
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
    const result = batchSendFollowUps(Array.from(selectedCustomerIds), selectedChannel, selectedTemplateId);
    setSendResult(result);
    setStep('result');
  };

  const handleClose = () => {
    setStep('select');
    setSendResult(null);
    setSelectedCustomerIds(new Set());
    onClose();
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const getPreviewContent = (customer: Customer) => {
    if (!selectedTemplate) return '';
    return selectedTemplate.content
      .replace('{name}', customer.name)
      .replace('{project}', customer.projectType)
      .replace('{doctor}', customer.doctorName);
  };

  const channelName = selectedChannel === 'wechat' ? '微信小程序' : '短信';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">批量发送节假日提醒</h2>
              <p className="text-xs text-gray-500">
                {step === 'select' && '选择顾客、发送方式和模板'}
                {step === 'confirm' && '确认发送信息无误'}
                {step === 'result' && '发送结果'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/60 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step !== 'result' && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-center gap-4">
            {['选择', '确认', '结果'].map((label, idx) => {
              const stepArr: Step[] = ['select', 'confirm', 'result'];
              const s = stepArr[idx];
              const num = idx + 1;
              const isActive = step === s;
              const currentIdx = stepArr.indexOf(step);
              const isDone = idx < currentIdx;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                    isActive
                      ? 'bg-amber-500 text-white'
                      : isDone
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isDone ? <CheckCircle className="w-4 h-4" /> : num}
                  </div>
                  <span className={`text-sm ${isActive ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                    {label}
                  </span>
                  {idx < 2 && (
                    <ChevronRight className="w-4 h-4 text-gray-300 ml-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {step === 'select' && (
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
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  {recoveryCustomers.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {recoveryCustomers.map(customer => {
                        const days = getDaysAfterSurgery(customer.surgeryDate);
                        const isChecked = selectedCustomerIds.has(customer.id);
                        return (
                          <div
                            key={customer.id}
                            onClick={() => toggleCustomer(customer.id)}
                            className={`p-3 flex items-center gap-3 cursor-pointer transition-colors select-none ${
                              isChecked ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onClick={(e) => handleCheckboxClick(e, customer.id)}
                              onChange={() => {}}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <img
                              src={customer.avatar}
                              alt={customer.name}
                              className="w-9 h-9 rounded-full bg-gray-100 pointer-events-none"
                            />
                            <div className="flex-1 min-w-0 pointer-events-none">
                              <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                              <p className="text-xs text-gray-500">
                                {customer.projectType} · 术后第{days}天 · 忌口{customer.dietPeriodDays}天
                              </p>
                            </div>
                            <div className="text-right w-40 flex-shrink-0 pointer-events-none">
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
                  onClick={handleClose}
                  className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-white rounded-lg transition-colors border border-gray-300"
                >
                  取消
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={selectedCustomerIds.size === 0 || !selectedTemplateId}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 shadow-sm"
                >
                  下一步
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <div className="p-6 overflow-y-auto flex-1">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                发送确认摘要
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/60 rounded-lg px-4 py-3">
                  <span className="text-sm text-gray-600">发送方式</span>
                  <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                    {selectedChannel === 'wechat' ? <MessageCircle className="w-4 h-4 text-green-600" /> : <Mail className="w-4 h-4 text-blue-600" />}
                    {channelName}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white/60 rounded-lg px-4 py-3">
                  <span className="text-sm text-gray-600">使用模板</span>
                  <span className="text-sm font-medium text-gray-900">{selectedTemplate?.name}</span>
                </div>
                <div className="flex items-center justify-between bg-white/60 rounded-lg px-4 py-3">
                  <span className="text-sm text-gray-600">发送人数</span>
                  <span className="text-lg font-bold text-amber-600">{selectedCustomers.length} 人</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">收件人列表：</h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                {selectedCustomers.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {selectedCustomers.map(customer => {
                      const days = getDaysAfterSurgery(customer.surgeryDate);
                      return (
                        <div key={customer.id} className="p-3 flex items-center gap-3 bg-white">
                          <img src={customer.avatar} alt={customer.name} className="w-9 h-9 rounded-full" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                            <p className="text-xs text-gray-500">
                              {customer.projectType} · 术后第{days}天
                            </p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-gray-500">暂无选中顾客</div>
                )}
              </div>
            </div>

            {selectedTemplate && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">消息预览：</h4>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {getPreviewContent(selectedCustomers[0] || customers[0])}
                  </p>
                  <p className="text-xs text-gray-400 mt-3 text-right">—— 以上为示例内容，实际发送时会替换为对应顾客信息</p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'confirm' && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <button
              onClick={() => setStep('select')}
              className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-white rounded-lg transition-colors border border-gray-300 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              上一步
            </button>
            <button
              onClick={handleSend}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 shadow-sm"
            >
              <Send className="w-4 h-4" />
              确认发送
            </button>
          </div>
        )}

        {step === 'result' && sendResult && (
          <div className="p-10 text-center overflow-y-auto flex-1">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 ${
              sendResult.failCount === 0 
                ? 'bg-green-100' 
                : sendResult.successCount === 0 
                  ? 'bg-red-100' 
                  : 'bg-amber-100'
            }`}>
              {sendResult.failCount === 0 ? (
                <Smile className="w-10 h-10 text-green-600" />
              ) : sendResult.successCount === 0 ? (
                <AlertCircle className="w-10 h-10 text-red-600" />
              ) : (
                <CheckCircle2 className="w-10 h-10 text-amber-600" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {sendResult.failCount === 0 
                ? '全部发送成功 🎉' 
                : sendResult.successCount === 0 
                  ? '发送失败' 
                  : '部分发送成功'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              已尝试向 {sendResult.results.length} 位顾客发送{channelName}提醒
            </p>

            <div className="flex justify-center gap-12 mb-8">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle className="w-9 h-9 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">{sendResult.successCount}</p>
                <p className="text-sm text-gray-500 mt-1">发送成功</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-2">
                  <XCircle className="w-9 h-9 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-red-600">{sendResult.failCount}</p>
                <p className="text-sm text-gray-500 mt-1">发送失败</p>
              </div>
            </div>

            {sendResult.successCount > 0 && (
              <div className="text-left mb-5">
                <p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  发送成功 ({sendResult.successCount}人)
                </p>
                <div className="max-h-32 overflow-y-auto border border-green-200 rounded-xl bg-green-50/50">
                  {sendResult.results.filter(r => r.success).map((result, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between px-4 py-2 border-b border-green-100 last:border-0"
                    >
                      <span className="text-sm text-gray-700">{result.customerName}</span>
                      <span className="text-xs text-green-600 font-medium">✓ 已送达</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sendResult.failCount > 0 && (
              <div className="text-left">
                <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  发送失败 ({sendResult.failCount}人)
                </p>
                <div className="max-h-32 overflow-y-auto border border-red-200 rounded-xl bg-red-50/50">
                  {sendResult.results.filter(r => !r.success).map((result, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between px-4 py-2 border-b border-red-100 last:border-0"
                    >
                      <div>
                        <span className="text-sm text-gray-700">{result.customerName}</span>
                        {result.error && (
                          <p className="text-xs text-red-500">{result.error}</p>
                        )}
                      </div>
                      <span className="text-xs text-red-600 font-medium">✗ 失败</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-center gap-3">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                关闭
              </button>
              <button
                onClick={() => setStep('select')}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                继续发送
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
