import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Users, AlertTriangle, Smile, Clock, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/Layout/PageHeader';
import { useAppStore } from '@/store/appStore';

export default function Statistics() {
  const { followUps, customers, exceptions, staff } = useAppStore();
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  const totalFollowUps = followUps.filter(f => f.status !== 'pending').length;
  const completedCount = followUps.filter(f => f.status === 'completed').length;
  const completionRate = totalFollowUps > 0 ? Math.round((completedCount / totalFollowUps) * 100) : 0;
  const exceptionCount = exceptions.length;
  const resolvedExceptionCount = exceptions.filter(e => e.status === 'resolved').length;
  const avgHandleTime = 2.5;
  const satisfactionScore = 4.8;

  const stats = [
    { label: '随访完成率', value: `${completionRate}%`, icon: CheckCircle2, color: 'from-blue-500 to-blue-600', trend: '+5.2%' },
    { label: '在管顾客数', value: customers.length, icon: Users, color: 'from-purple-500 to-purple-600', trend: '+12' },
    { label: '异常处理数', value: exceptionCount, icon: AlertTriangle, color: 'from-orange-500 to-orange-600', trend: '-3' },
    { label: '顾客满意度', value: satisfactionScore, icon: Smile, color: 'from-green-500 to-green-600', trend: '+0.2' },
  ];

  const trendData = [
    { date: '周一', followUps: 12, completed: 10 },
    { date: '周二', followUps: 15, completed: 14 },
    { date: '周三', followUps: 18, completed: 16 },
    { date: '周四', followUps: 14, completed: 13 },
    { date: '周五', followUps: 20, completed: 18 },
    { date: '周六', followUps: 8, completed: 7 },
    { date: '周日', followUps: 6, completed: 5 },
  ];

  const projectDistribution = [
    { name: '双眼皮手术', value: 35, color: '#3B82F6' },
    { name: '隆鼻手术', value: 25, color: '#8B5CF6' },
    { name: '吸脂手术', value: 15, color: '#F59E0B' },
    { name: '颌面手术', value: 10, color: '#EF4444' },
    { name: '玻尿酸填充', value: 10, color: '#10B981' },
    { name: '肉毒素注射', value: 5, color: '#EC4899' },
  ];

  const exceptionTypeData = [
    { type: '饮食违规', count: 8 },
    { type: '饮酒', count: 5 },
    { type: '伤口渗液', count: 3 },
    { type: '肿胀加重', count: 4 },
    { type: '疼痛', count: 2 },
    { type: '其他', count: 1 },
  ];

  const topStaff = staff
    .filter(s => s.followUpCount > 0)
    .sort((a, b) => b.followUpCount - a.followUpCount)
    .slice(0, 5);

  return (
    <div className="min-h-screen">
      <PageHeader
        title="数据统计"
        subtitle="查看随访数据、异常趋势和员工绩效"
        actions={
          <div className="flex items-center gap-2">
            {(['week', 'month'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {range === 'week' ? '本周' : '本月'}
              </button>
            ))}
          </div>
        }
      />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">{stat.trend}</span>
                      <span className="text-xs text-gray-400">较上周</span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">随访趋势</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="followUps"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    name="应随访"
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    name="已完成"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-600">应随访</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">已完成</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">项目分布</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {projectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {projectDistribution.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-medium text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">异常类型分布</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={exceptionTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                  <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                  <YAxis dataKey="type" type="category" stroke="#9CA3AF" fontSize={12} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">异常处理时长</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">高风险</p>
                    <p className="text-xs text-gray-500">平均处理时间</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-red-600">1.2h</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">中风险</p>
                    <p className="text-xs text-gray-500">平均处理时间</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-orange-600">3.5h</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">低风险</p>
                    <p className="text-xs text-gray-500">平均处理时间</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-green-600">8.0h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">员工绩效排行</h3>
            <div className="space-y-3">
              {topStaff.map((member, idx) => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-amber-400 text-white' :
                    idx === 1 ? 'bg-gray-300 text-white' :
                    idx === 2 ? 'bg-amber-700 text-white' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.followUpCount}次随访</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{member.completionRate}%</p>
                    <p className="text-xs text-gray-400">完成率</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
