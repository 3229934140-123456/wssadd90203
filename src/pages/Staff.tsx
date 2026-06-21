import { useState } from 'react';
import { User, Clock, CheckCircle2, Search, Calendar, FileText } from 'lucide-react';
import PageHeader from '@/components/Layout/PageHeader';
import { useAppStore } from '@/store/appStore';
import { formatDateTime } from '@/utils';

export default function StaffPage() {
  const { staff, operationLogs } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  const roleLabels: Record<string, string> = {
    nurse: '护士',
    doctor: '医生',
    reception: '前台',
    manager: '主管'
  };

  const roleColors: Record<string, string> = {
    nurse: 'bg-pink-100 text-pink-700',
    doctor: 'bg-blue-100 text-blue-700',
    reception: 'bg-purple-100 text-purple-700',
    manager: 'bg-amber-100 text-amber-700'
  };

  const filteredStaff = staff.filter(s =>
    s.name.includes(searchTerm)
  );

  const selectedStaffMember = staff.find(s => s.id === selectedStaff);
  const staffLogs = selectedStaff
    ? operationLogs.filter(log => log.staffId === selectedStaff)
    : operationLogs;

  const sortedStaff = [...filteredStaff].sort((a, b) => b.followUpCount - a.followUpCount);

  return (
    <div className="min-h-screen">
      <PageHeader
        title="员工记录"
        subtitle="查看员工操作日志和绩效统计"
      />

      <div className="p-8">
        <div className="flex gap-6">
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索员工姓名..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="divide-y divide-gray-100 max-h-[calc(100vh-280px)] overflow-y-auto">
                {sortedStaff.map((member, idx) => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedStaff(member.id)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedStaff === member.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-10 h-10 rounded-full bg-gray-100"
                        />
                        {idx < 3 && member.followUpCount > 0 && (
                          <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-gray-400' : 'bg-amber-700'
                          }`}>
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{member.name}</p>
                          <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${roleColors[member.role]}`}>
                            {roleLabels[member.role]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {member.followUpCount}次
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {member.completionRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1">
            {selectedStaffMember ? (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedStaffMember.avatar}
                      alt={selectedStaffMember.name}
                      className="w-16 h-16 rounded-full bg-gray-100"
                    />
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedStaffMember.name}</h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${roleColors[selectedStaffMember.role]}`}>
                          {roleLabels[selectedStaffMember.role]}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="p-4 bg-blue-50 rounded-xl text-center">
                      <p className="text-3xl font-bold text-blue-600">{selectedStaffMember.followUpCount}</p>
                      <p className="text-sm text-blue-600/70 mt-1">随访次数</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl text-center">
                      <p className="text-3xl font-bold text-green-600">{selectedStaffMember.completionRate}%</p>
                      <p className="text-sm text-green-600/70 mt-1">完成率</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl text-center">
                      <p className="text-3xl font-bold text-purple-600">{staffLogs.length}</p>
                      <p className="text-sm text-purple-600/70 mt-1">操作记录</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      操作日志
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                    {staffLogs.length > 0 ? (
                      staffLogs.map(log => (
                        <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Clock className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900 text-sm">{log.action}</p>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDateTime(log.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5">
                                操作对象：{log.target}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-16 text-center">
                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">暂无操作记录</h3>
                        <p className="text-sm text-gray-500">该员工暂无操作记录</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">选择员工查看详情</h3>
                  <p className="text-sm text-gray-500">从左侧列表选择一位员工查看详细信息和操作记录</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
