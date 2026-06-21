import { useState } from 'react';
import { X, AlertTriangle, User, Send, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { Customer, RiskLevel } from '@/types';

interface ReportExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const commonExceptionTypes = [
  { type: '饮食违规-吃火锅', level: 'medium' as RiskLevel, desc: '顾客吃了火锅等辛辣食物' },
  { type: '饮酒', level: 'medium' as RiskLevel, desc: '顾客喝酒了' },
  { type: '伤口渗液', level: 'high' as RiskLevel, desc: '伤口有渗液或流脓' },
  { type: '肿胀加重', level: 'medium' as RiskLevel, desc: '术后肿胀比之前严重' },
  { type: '疼痛加剧', level: 'medium' as RiskLevel, desc: '疼痛加剧或持续不缓解' },
  { type: '饮食违规-海鲜', level: 'low' as RiskLevel, desc: '顾客吃了海鲜等易过敏食物' },
  { type: '发烧发热', level: 'high' as RiskLevel, desc: '顾客出现发烧症状' },
  { type: '伤口发红', level: 'medium' as RiskLevel, desc: '伤口周围发红发热' },
  { type: '其他', level: 'low' as RiskLevel, desc: '其他异常情况' },
];

const levelConfig: Record<RiskLevel, { label: string; color: string; bgColor: string; borderColor: string }> = {
  low: { label: '低风险', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-300' },
  medium: { label: '中风险', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-300' },
  high: { label: '高风险', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-300' },
};

export default function ReportExceptionModal({ isOpen, onClose, customer }: ReportExceptionModalProps) {
  const { addException, staff, assignException } = useAppStore();
  const [selectedType, setSelectedType] = useState<string>('');
  const [description, setDescription] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<RiskLevel>('medium');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const doctors = staff.filter(s => s.role === 'doctor');

  if (!isOpen || !customer) return null;

  const handleSelectPreset = (preset: typeof commonExceptionTypes[0]) => {
    setSelectedType(preset.type);
    setSelectedLevel(preset.level);
    if (!description) {
      setDescription(preset.desc);
    }
  };

  const handleSubmit = () => {
    if (!selectedType || !description.trim()) return;

    const exceptionId = `e_${Date.now()}`;
    
    addException({
      customerId: customer.id,
      type: selectedType,
      level: selectedLevel,
      description: description,
      assignedDoctor: selectedDoctor ? (doctors.find(d => d.id === selectedDoctor)?.name || null) : null,
      resolvedAt: null,
      resolution: ''
    });

    if (selectedDoctor) {
      const newException = useAppStore.getState().exceptions.find(e => e.type === selectedType && e.customerId === customer.id);
      if (newException) {
        assignException(newException.id, selectedDoctor);
      }
    }

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setSelectedType('');
      setDescription('');
      setSelectedLevel('medium');
      setSelectedDoctor('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">异常上报</h2>
              <p className="text-xs text-gray-500">快速记录顾客异常情况并分配给医生</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/60 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">上报成功</h3>
            <p className="text-sm text-gray-500">
              {selectedDoctor 
                ? `已分配给${doctors.find(d => d.id === selectedDoctor)?.name}处理`
                : '异常处理页面可查看此记录'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <img
                  src={customer.avatar}
                  alt={customer.name}
                  className="w-11 h-11 rounded-full bg-white"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-xs text-gray-500">
                    {customer.projectType} · {customer.doctorName}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-pink-50 text-pink-600">
                  术后患者
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <span className="text-red-500">*</span>
                  快速选择常见异常类型
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {commonExceptionTypes.map((preset) => {
                    const isSelected = selectedType === preset.type;
                    const lvl = levelConfig[preset.level];
                    return (
                      <button
                        key={preset.type}
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-2.5 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? `${lvl.bgColor} ${lvl.borderColor} shadow-sm`
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <p className={`text-sm font-medium ${isSelected ? lvl.color : 'text-gray-800'}`}>
                          {preset.type.split('-')[0]}
                        </p>
                        <span className={`inline-block mt-1 px-1.5 py-0.5 text-[10px] rounded ${lvl.bgColor} ${lvl.color}`}>
                          {lvl.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <span className="text-red-500">*</span>
                  异常类型
                </label>
                <input
                  type="text"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  placeholder="请输入或上方选择异常类型"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  风险等级
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['low', 'medium', 'high'] as RiskLevel[]).map((level) => {
                    const lvl = levelConfig[level];
                    const isSelected = selectedLevel === level;
                    return (
                      <button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        className={`py-2.5 rounded-lg border-2 transition-all text-center ${
                          isSelected
                            ? `${lvl.bgColor} ${lvl.borderColor} ${lvl.color}`
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 mx-auto mb-1" />
                        <p className="text-sm font-medium">{lvl.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <span className="text-red-500">*</span>
                  情况说明
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请详细描述异常情况，包括发生时间、症状表现等..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  <User className="w-4 h-4 inline mr-1.5 text-gray-400" />
                  分配给医生处理
                </label>
                <div className="space-y-2">
                  {doctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      onClick={() => setSelectedDoctor(selectedDoctor === doctor.id ? '' : doctor.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        selectedDoctor === doctor.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img src={doctor.avatar} alt={doctor.name} className="w-9 h-9 rounded-full" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900">{doctor.name}</p>
                        <p className="text-xs text-gray-500">主治医师</p>
                      </div>
                      {selectedDoctor === doctor.id && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">可不选，稍后在异常处理页面分配</p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedType || !description.trim()}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                提交上报
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
