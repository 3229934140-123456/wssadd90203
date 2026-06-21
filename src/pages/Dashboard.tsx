import { useState } from 'react';
import { Calendar, Clock, Users, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/Layout/PageHeader';
import CustomerCard from '@/components/FollowUp/CustomerCard';
import SendMessageModal from '@/components/FollowUp/SendMessageModal';
import { useAppStore } from '@/store/appStore';
import { getDaysAfterSurgery } from '@/utils';
import type { Customer, FollowUpRecord } from '@/types';

type TabType = 'day1' | 'day3' | 'day7' | 'all';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('day1');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpRecord | null>(null);
  
  const { customers, followUps, exceptions } = useAppStore();

  const getFollowUpsByDay = (day: number | 'all') => {
    if (day === 'all') {
      return followUps.filter(f => f.status === 'pending').map(f => {
        const customer = customers.find(c => c.id === f.customerId);
        return { followUp: f, customer };
      }).filter(item => item.customer !== undefined) as { followUp: FollowUpRecord; customer: Customer }[];
    }
    return followUps
      .filter(f => {
        const customer = customers.find(c => c.id === f.customerId);
        if (!customer) return false;
        const days = getDaysAfterSurgery(customer.surgeryDate);
        return days === day && f.status === 'pending';
      })
      .map(f => {
        const customer = customers.find(c => c.id === f.customerId)!;
        return { followUp: f, customer };
      });
  };

  const day1List = getFollowUpsByDay(1);
  const day3List = getFollowUpsByDay(3);
  const day7List = getFollowUpsByDay(7);
  const allList = getFollowUpsByDay('all');

  const tabs = [
    { id: 'day1' as TabType, label: '术后第1天', count: day1List.length, color: 'text-blue-600 bg-blue-50' },
    { id: 'day3' as TabType, label: '术后第3天', count: day3List.length, color: 'text-purple-600 bg-purple-50' },
    { id: 'day7' as TabType, label: '术后第7天', count: day7List.length, color: 'text-green-600 bg-green-50' },
    { id: 'all' as TabType, label: '全部待随访', count: allList.length, color: 'text-gray-600 bg-gray-100' },
  ];

  const currentList = activeTab === 'day1' ? day1List : activeTab === 'day3' ? day3List : activeTab === 'day7' ? day7List : allList;

  const handleSendMessage = (followUpId: string) => {
    const followUp = followUps.find(f => f.id === followUpId);
    const customer = customers.find(c => c.id === followUp?.customerId);
    if (followUp && customer) {
      setSelectedFollowUp(followUp);
      setSelectedCustomer(customer);
      setIsModalOpen(true);
    }
  };

  const handleMarkException = (customerId: string) => {
    // 跳转到异常处理页面并预填信息
    window.location.href = `/exceptions?customerId=${customerId}`;
  };

  const pendingCount = followUps.filter(f => f.status === 'pending').length;
  const todayCompleted = followUps.filter(f => {
    const today = new Date().toDateString();
    return f.sentAt && new Date(f.sentAt).toDateString() === today;
  }).length;
  const exceptionCount = exceptions.filter(e => e.status !== 'resolved').length;

  const stats = [
    { label: '今日待随访', value: pendingCount, icon: Clock, color: 'from-blue-500 to-blue-600' },
    { label: '今日已完成', value: todayCompleted, icon: Calendar, color: 'from-green-500 to-green-600' },
    { label: '在管顾客', value: customers.length, icon: Users, color: 'from-purple-500 to-purple-600' },
    { label: '待处理异常', value: exceptionCount, icon: AlertTriangle, color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <div className="min-h-screen">
      <PageHeader
        title="随访看板"
        subtitle="查看今日待随访顾客，按术后天数分组管理"
      />

      <div className="p-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id ? tab.color : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {currentList.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {currentList.map(({ customer, followUp }) => (
                  <CustomerCard
                    key={followUp.id}
                    customer={customer}
                    followUp={followUp}
                    onSendMessage={handleSendMessage}
                    onMarkException={handleMarkException}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">暂无待随访顾客</h3>
                <p className="text-sm text-gray-500">该分组下没有需要随访的顾客</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <SendMessageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        followUp={selectedFollowUp}
      />
    </div>
  );
}
