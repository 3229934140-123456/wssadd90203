import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Copy, Tag, FileText } from 'lucide-react';
import PageHeader from '@/components/Layout/PageHeader';
import { useAppStore } from '@/store/appStore';
import { formatDate } from '@/utils';

export default function Templates() {
  const { templates, addTemplate, deleteTemplate } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: '常规随访',
    content: ''
  });

  const categories = ['全部', ...Array.from(new Set(templates.map(t => t.category)))];

  const filteredTemplates = templates.filter(t => {
    const matchSearch = t.name.includes(searchTerm) || t.content.includes(searchTerm);
    const matchCategory = selectedCategory === '全部' || t.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const handleCreate = () => {
    if (newTemplate.name && newTemplate.content) {
      addTemplate(newTemplate);
      setNewTemplate({ name: '', category: '常规随访', content: '' });
      setIsCreateModalOpen(false);
    }
  };

  const handleCopy = (template: typeof templates[0]) => {
    addTemplate({
      name: template.name + '（副本）',
      category: template.category,
      content: template.content
    });
  };

  const categoryColors: Record<string, string> = {
    '常规随访': 'bg-blue-100 text-blue-700',
    '特殊提醒': 'bg-amber-100 text-amber-700',
    '异常回访': 'bg-red-100 text-red-700',
    '回访调查': 'bg-green-100 text-green-700'
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="提醒模板"
        subtitle="管理标准话术模板，统一服务口径"
        actions={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建模板
          </button>
        }
      />

      <div className="p-8">
        <div className="flex gap-6">
          <div className="w-56 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">模板分类</h3>
              <div className="space-y-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-colors flex items-center justify-between ${
                      selectedCategory === cat
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      {cat}
                    </span>
                    <span className="text-xs text-gray-400">
                      {cat === '全部' ? templates.length : templates.filter(t => t.category === cat).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索模板名称或内容..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {filteredTemplates.map(template => (
                  <div key={template.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[template.category] || 'bg-gray-100 text-gray-600'}`}>
                            {template.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{template.content}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            使用 {template.useCount} 次
                          </span>
                          <span>创建于 {formatDate(template.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={() => handleCopy(template)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="复制模板"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="编辑模板"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除模板"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">暂无模板</h3>
                  <p className="text-sm text-gray-500">点击右上角创建第一个提醒模板</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">新建提醒模板</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">模板名称</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入模板名称"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">模板分类</label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {['常规随访', '特殊提醒', '异常回访', '回访调查'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">模板内容</label>
                <textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="请输入模板内容，可用 {name} {project} {doctor} 等变量占位符"
                  rows={5}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-400 mt-1.5">支持变量：{'{name}'} 顾客姓名、{'{project}'} 项目名称、{'{doctor}'} 主治医生</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTemplate.name || !newTemplate.content}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                创建模板
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
