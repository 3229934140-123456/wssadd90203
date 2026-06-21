import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  BarChart3,
  UserCog,
  Heart,
  Bell,
  AlertCircle,
  RefreshCcw,
  ChevronDown,
  Stethoscope
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';

const navItems = [
  { path: '/', label: '随访看板', icon: LayoutDashboard },
  { path: '/customers', label: '顾客建档', icon: Users },
  { path: '/templates', label: '提醒模板', icon: FileText },
  { path: '/exceptions', label: '异常处理', icon: AlertTriangle },
  { path: '/handover', label: '交接班', icon: RefreshCcw },
  { path: '/statistics', label: '数据统计', icon: BarChart3 },
  { path: '/staff', label: '员工记录', icon: UserCog },
];

export default function Sidebar() {
  const location = useLocation();
  const { currentUser, staff, switchUser, getOverdueHighRiskExceptions, getAssignedExceptions } = useAppStore();
  const [overdueCount, setOverdueCount] = useState(0);
  const [myTaskCount, setMyTaskCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const updateCounts = () => {
      setOverdueCount(getOverdueHighRiskExceptions().length);
      if (currentUser.role === 'doctor') {
        setMyTaskCount(getAssignedExceptions().length);
      }
    };
    updateCounts();
    const timer = setInterval(updateCounts, 15000);
    return () => clearInterval(timer);
  }, [getOverdueHighRiskExceptions, getAssignedExceptions, currentUser.role, currentUser.id]);

  const roleLabels: Record<string, string> = {
    nurse: '护士',
    doctor: '医生',
    reception: '前台',
    manager: '主管'
  };

  const handleSwitchUser = (staffId: string) => {
    switchUser(staffId);
    setShowUserMenu(false);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col relative">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-pink-400 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">术后随访</h1>
            <p className="text-xs text-gray-500">忌口管理工作台</p>
          </div>
        </div>
      </div>

      {overdueCount > 0 && (
        <div className="mx-4 my-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-red-700">
                ⚠️ {overdueCount}条高风险超时
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                超过30分钟未处理，请尽快跟进
              </p>
            </div>
          </div>
        </div>
      )}

      {currentUser.role === 'doctor' && myTaskCount > 0 && (
        <div className="mx-4 mb-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
          <div className="flex items-start gap-2">
            <Stethoscope className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-purple-700">
                👨‍⚕️ {myTaskCount}条待您处理
              </p>
              <p className="text-xs text-purple-600 mt-0.5">
                请前往异常处理页查看
              </p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            const showBadge = item.path === '/exceptions' && (overdueCount > 0 || myTaskCount > 0);
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${item.path === '/exceptions' && overdueCount > 0 ? 'text-red-500' : ''}`} />
                  {item.label}
                  {showBadge && (
                    <span className={`ml-auto ${
                      overdueCount > 0
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-purple-500 text-white'
                    } text-xs px-2 py-0.5 rounded-full`}>
                      {overdueCount > 0 ? overdueCount : myTaskCount}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-100 relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full bg-white"
          />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              {roleLabels[currentUser.role]}
              <ChevronDown className="w-3 h-3" />
            </p>
          </div>
          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors relative">
            <Bell className="w-4 h-4" />
            {overdueCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                !
              </span>
            )}
          </button>
        </button>

        {showUserMenu && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
            <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-600">切换身份</p>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {staff.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSwitchUser(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left ${
                    currentUser.id === s.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <img src={s.avatar} alt={s.name} className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">{roleLabels[s.role]}</p>
                  </div>
                  {currentUser.id === s.id && (
                    <span className="text-blue-600 text-xs font-medium bg-blue-100 px-2 py-0.5 rounded">当前</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
