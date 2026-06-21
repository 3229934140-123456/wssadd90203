import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { getDietConfig, projectDietConfigs, formatDate } from '@/utils';
import type { Gender, AnesthesiaType } from '@/types';

export default function NewCustomer() {
  const navigate = useNavigate();
  const { addCustomer } = useAppStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'female' as Gender,
    projectType: '双眼皮手术',
    surgeryDate: formatDate(new Date()),
    anesthesiaType: 'local' as AnesthesiaType,
    doctorName: '李医生',
    specialInstructions: '',
    allergyHistory: ''
  });

  const dietConfig = getDietConfig(formData.projectType);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const dietConfig = getDietConfig(formData.projectType);
    addCustomer({
      name: formData.name,
      phone: formData.phone,
      age: parseInt(formData.age) || 0,
      gender: formData.gender,
      projectType: formData.projectType,
      surgeryDate: formData.surgeryDate,
      anesthesiaType: formData.anesthesiaType,
      doctorName: formData.doctorName,
      specialInstructions: formData.specialInstructions,
      dietPeriodDays: dietConfig?.periodDays || 7,
      allergyHistory: formData.allergyHistory,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`
    });
    navigate('/customers');
  };

  const anesthesiaOptions = [
    { value: 'local', label: '局部麻醉', desc: '术后即可进食' },
    { value: 'sedation', label: '镇静麻醉', desc: '术后2小时可进食' },
    { value: 'general', label: '全身麻醉', desc: '术后6小时禁食' },
  ];

  const doctorOptions = ['李医生', '王医生', '张医生'];

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">新建顾客档案</h1>
            <p className="text-sm text-gray-500 mt-0.5">录入顾客信息，一键生成忌口周期</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="flex gap-8">
          <div className="flex-1 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                </div>
                <h2 className="font-semibold text-gray-900">基本信息</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">姓名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="请输入顾客姓名"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">手机号 <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="请输入手机号"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">年龄</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder="请输入年龄"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">性别</label>
                  <div className="flex gap-2">
                    {['female', 'male'].map((g) => (
                      <button
                        key={g}
                        onClick={() => handleInputChange('gender', g)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                          formData.gender === g
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-300 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {g === 'female' ? '女' : '男'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">过敏史</label>
                  <input
                    type="text"
                    value={formData.allergyHistory}
                    onChange={(e) => handleInputChange('allergyHistory', e.target.value)}
                    placeholder="如：青霉素过敏、海鲜过敏等，无则填无"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                </div>
                <h2 className="font-semibold text-gray-900">项目信息</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">项目类型 <span className="text-red-500">*</span></label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => handleInputChange('projectType', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {projectDietConfigs.map(p => (
                      <option key={p.projectType} value={p.projectType}>
                        {p.projectType}（{p.periodDays}天忌口）
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      手术日期
                    </label>
                    <input
                      type="date"
                      value={formData.surgeryDate}
                      onChange={(e) => handleInputChange('surgeryDate', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">主治医生</label>
                    <select
                      value={formData.doctorName}
                      onChange={(e) => handleInputChange('doctorName', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      {doctorOptions.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">麻醉方式</label>
                  <div className="grid grid-cols-3 gap-3">
                    {anesthesiaOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleInputChange('anesthesiaType', opt.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          formData.anesthesiaType === opt.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">医生特殊叮嘱</label>
                  <textarea
                    value={formData.specialInstructions}
                    onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                    placeholder="如：术后第二天换药、一周后拆线、避免剧烈运动等"
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="w-96">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-gray-900">忌口周期预览</h3>
              </div>

              {dietConfig ? (
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-pink-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{formData.projectType}</p>
                    <p className="text-xs text-gray-500">总周期：{dietConfig.periodDays}天</p>
                  </div>

                  <div className="relative">
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />
                    <div className="space-y-4">
                      {dietConfig.phases.map((phase, idx) => (
                        <div key={idx} className="relative pl-8">
                          <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100" />
                          <p className="text-xs font-medium text-blue-600">{phase.dayRange}</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">{phase.title}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-gray-500">
                              <span className="text-red-500 font-medium">✕ 禁食：</span>
                              {phase.forbidden.slice(0, 2).join('、')}
                            </p>
                            <p className="text-xs text-gray-500">
                              <span className="text-green-500 font-medium">✓ 宜食：</span>
                              {phase.recommended.slice(0, 2).join('、')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {formData.specialInstructions && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-amber-800">医生特殊叮嘱</p>
                          <p className="text-xs text-amber-700 mt-0.5">{formData.specialInstructions}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.allergyHistory && formData.allergyHistory !== '无' && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-red-800">过敏史提醒</p>
                          <p className="text-xs text-red-700 mt-0.5">{formData.allergyHistory}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">请选择项目类型以查看忌口周期</p>
              )}

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.phone}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  生成档案并开始随访
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="w-full py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
