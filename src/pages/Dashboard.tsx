import { useState, useMemo } from 'react';
import { Calendar, Clock, Users, AlertTriangle, CheckSquare, Send, Layers } from 'lucide-react';
import PageHeader from '@/components/Layout/PageHeader';
import CustomerCard from '@/components/FollowUp/CustomerCard';
import SendMessageModal from '@/components/FollowUp/SendMessageModal';
import ReportExceptionModal from '@/components/FollowUp/ReportExceptionModal';
import BatchSendModal from '@/components/FollowUp/BatchSendModal';
import CustomerTimelineModal from '@/components/FollowUp/CustomerTimelineModal';
import { useAppStore } from '@/store/appStore';
import { getDaysAfterSurgery } from '@/utils';
import type { Customer, FollowUpRecord } from '@/types';

type TabType = 'day1' | 'day3' | 'day7' | 'all' | 'recovery';

export default function Dashboard() {
  const { 
    customers, 
    followUps, 
    exceptions, 
    preselectedBatchCustomerIds,
    setPreselectedBatchCustomerIds 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('day1');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    // 从Store中读取预选的批量发送顾客ID
    if (preselectedBatchCustomerIds.length > 0) {
      return new Set(preselectedBatchCustomerIds);
    }
    return new Set();
  });

  const getFollowUpsByDay = (day: number | 'all' | 'recovery') => {
    if (day === 'all') {
      return followUps.filter(f => f.status === 'pending').map(f => {
        const customer = customers.find(c => c.id === f.customerId);
        return { followUp: f, customer };
      }).filter(item => item.customer !== undefined) as { followUp: FollowUpRecord; customer: Customer }[];
    }
    if (day === 'recovery') {
      return followUps
        .filter(f => {
          const customer = customers.find(c => c.id === f.customerId);
          if (!customer) return false;
          const days = getDaysAfterSurgery(customer.surgeryDate);
          return days > 0 && days <= customer.dietPeriodDays && f.status === 'pending';
        })
        .map(f => {
          const customer = customers.find(c => c.id === f.customerId)!;
          return { followUp: f, customer };
        });
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
  const recoveryList = getFollowUpsByDay('recovery');

  const tabs = [
    { id: 'day1' as TabType, label: '术后第1天', count: day1List.length, color: 'text-blue-600 bg-blue-50' },
    { id: 'day3' as TabType, label: '术后第3天', count: day3List.length, color: 'text-purple-600 bg-purple-50' },
    { id: 'day7' as TabType, label: '术后第7天', count: day7List.length, color: 'text-green-600 bg-green-50' },
    { id: 'recovery' as TabType, label: '恢复期顾客', count: recoveryList.length, color: 'text-amber-600 bg-amber-50' },
    { id: 'all' as TabType, label: '全部待随访', count: allList.length, color: 'text-gray-600 bg-gray-100' },
  ];

  const currentList = activeTab === 'day1' ? day1List
    : activeTab === 'day3' ? day3List
    : activeTab === 'day7' ? day7List
    : activeTab === 'recovery' ? recoveryList
    : allList;

  const handleSendMessage = (followUpId: string) => {
    const followUp = followUps.find(f => f.id === followUpId);
    const customer = customers.find(c => c.id === followUp?.customerId);
    if (followUp && customer) {
      setSelectedFollowUp(followUp);
      setSelectedCustomer(customer);
      setIsModalOpen(true);
    }
  };

  const handleMarkException = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsExceptionModalOpen(true);
  };

  const handleViewTimeline = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsTimelineModalOpen(true);
  };

  const openBatchModal = () => {
    // 保存当前选中的ID到Store，下次打开时能记住
    if (selectedIds.size > 0) {
      setPreselectedBatchCustomerIds(Array.from(selectedIds));
    }
    setIsBatchModalOpen(true);
  };

  const toggleSelect = (customerId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === currentList.length) {
      setSelectedIds(new Set());
    } else {
      const allCustomerIds = new Set(currentList.map(item => item.customer.id));
      setSelectedIds(allCustomerIds);
    }
  };

  const pendingCount = followUps.filter(f => f.status === 'pending').length;
  const todayCompleted = followUps.filter(f => {
    const today = new Date().toDateString();
    return f.sentAt && new Date(f.sentAt).toDateString() === today;
  }).length;
  const exceptionCount = exceptions.filter(e => e.status !== 'resolved').length;
  const recoveryCount = customers.filter(c => {
    const days = getDaysAfterSurgery(c.surgeryDate);
    return days > 0 && days <= c.dietPeriodDays;
  }).length;

  const stats = [
    { label: '今日待随访', value: pendingCount, icon: Clock, color: 'from-blue-500 to-blue-600' },
    { label: '今日已完成', value: todayCompleted, icon: Calendar, color: 'from-green-500 to-green-600' },
    { label: '在管顾客', value: customers.length, icon: Users, color: 'from-purple-500 to-purple-600' },
    { label: '待处理异常', value: exceptionCount, icon: AlertTriangle, color: 'from-orange-500 to-orange-600' },
  ];

  const showBatchBar = selectedIds.size > 0;
  const showCheckbox = activeTab === 'recovery';

  return (
    <div className="min-h-screen">
      <PageHeader
        title="随访看板"
        subtitle="查看今日待随访顾客，按术后天数分组管理"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={openBatchModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-medium rounded-lg transition-all shadow-sm"
            >
              <Layers className="w-4 h-4" />
              发送节假日提醒
            </button>
          </div>
        }
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

        {showBatchBar && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                已选择 {selectedIds.size} 位顾客
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-white rounded-lg transition-colors"
              >
                取消选择
              </button>
              <button
                onClick={openBatchModal}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                批量发送节假日提醒
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-6">
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedIds(new Set());
                  }}
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

          {showCheckbox && currentList.length > 0 && (
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedIds.size === currentList.length && currentList.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium">全选当前列表</span>
              </label>
              <span className="text-xs text-gray-400">
                勾选后可批量发送节假日聚餐提醒
              </span>
            </div>
          )}

          <div className="p-6">
            {currentList.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {currentList.map(({ customer, followUp }) => (
                  <CustomerCard
                    key={followUp.id}
                    customer={customer}
                    followUp={followUp}
                    exceptions={exceptions}
                    onSendMessage={handleSendMessage}
                    onMarkException={handleMarkException}
                    onViewTimeline={handleViewTimeline}
                    showCheckbox={showCheckbox}
                    isSelected={selectedIds.has(customer.id)}
                    onToggleSelect={() => toggleSelect(customer.id)}
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
                {activeTab === 'recovery' && (
                  <p className="text-sm text-gray-400 mt-2">
                    恢复期顾客用于批量发送节假日聚餐提醒
                  </p>
                )}
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

      <ReportExceptionModal
        isOpen={isExceptionModalOpen}
        onClose={() => setIsExceptionModalOpen(false)}
        customer={selectedCustomer}
      />

      <BatchSendModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        preselectedCustomerIds={Array.from(selectedIds)}
      />

      {isTimelineModalOpen && selectedCustomer && (
        <CustomerTimelineModal
          isOpen={isTimelineModalOpen}
          onClose={() => {
            setIsTimelineModalOpen(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
        />
      )}
    </div>
  );
}
