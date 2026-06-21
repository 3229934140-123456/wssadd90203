import { useState } from 'react';
import { X, MessageCircle, Phone, Mail, Send, Check } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { Customer, FollowUpRecord } from '@/types';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  followUp: FollowUpRecord | null;
}

export default function SendMessageModal({ isOpen, onClose, customer, followUp }: SendMessageModalProps) {
  const [selectedChannel, setSelectedChannel] = useState<'sms' | 'wechat' | 'phone'>('wechat');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSent, setIsSent] = useState(false);
  const { templates, sendFollowUp } = useAppStore();

  if (!isOpen || !customer || !followUp) return null;

  const channelOptions = [
    { id: 'wechat' as const, label: '微信小程序', icon: MessageCircle, color: 'bg-green-500' },
    { id: 'sms' as const, label: '短信', icon: Mail, color: 'bg-blue-500' },
    { id: 'phone' as const, label: '电话记录', icon: Phone, color: 'bg-purple-500' },
  ];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      let content = template.content;
      content = content.replace('{name}', customer.name);
      content = content.replace('{project}', customer.projectType);
      content = content.replace('{doctor}', customer.doctorName);
      setMessageContent(content);
    }
  };

  const handleSend = () => {
    const phoneContent = selectedChannel === 'phone' ? messageContent : undefined;
    sendFollowUp(followUp.id, selectedChannel, selectedTemplate || undefined, phoneContent);
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      onClose();
      setSelectedTemplate('');
      setMessageContent('');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">发送随访提醒</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSent ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">发送成功</h3>
            <p className="text-sm text-gray-500">已通过{channelOptions.find(c => c.id === selectedChannel)?.label}发送提醒</p>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <img src={customer.avatar} alt={customer.name} className="w-10 h-10 rounded-full bg-white" />
                <div>
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-xs text-gray-500">术后第{followUp.dayNumber}天 · {customer.projectType}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">选择发送方式</label>
                <div className="grid grid-cols-3 gap-3">
                  {channelOptions.map((channel) => {
                    const Icon = channel.icon;
                    return (
                      <button
                        key={channel.id}
                        onClick={() => {
                          setSelectedChannel(channel.id);
                          if (channel.id === 'phone') {
                            setSelectedTemplate('');
                            setMessageContent('');
                          }
                        }}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${
                          selectedChannel === channel.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-8 h-8 mx-auto rounded-lg ${channel.color} flex items-center justify-center mb-2`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-xs font-medium text-gray-700">{channel.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">选择话术模板</label>
                <div className="space-y-2">
                  {templates.filter(t => t.category === '常规随访').map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        selectedTemplate === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{template.name}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.content}</p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedChannel !== 'phone' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">消息内容</label>
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="请输入消息内容或选择模板..."
                  />
                </div>
              )}

              {selectedChannel === 'phone' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    <Phone className="w-4 h-4 inline mr-1.5 text-purple-500" />
                    通话记录（必填，保存后其他员工可查看）
                  </label>
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="请详细记录通话内容：&#10;1. 顾客恢复情况反馈&#10;2. 忌口注意事项提醒&#10;3. 顾客疑问及解答&#10;4. 后续需要跟进的事项"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">💡 记录越详细，后续同事接班时越能了解情况</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSend}
                disabled={!messageContent}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {selectedChannel === 'phone' ? '保存记录' : '发送'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
