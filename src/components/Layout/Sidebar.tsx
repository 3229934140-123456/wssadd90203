import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  BarChart3,
  UserCog,
  Heart,
  Bell
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';

const navItems = [
  { path: '/', label: '随访看板', icon: LayoutDashboard },
  { path: '/customers', label: '顾客建档', icon: Users },
  { path: '/templates', label: '提醒模板', icon: FileText },
  { path: '/exceptions', label: '异常处理', icon: AlertTriangle },
  { path: '/statistics', label: '数据统计', icon: BarChart3 },
  { path: '/staff', label: '员工记录', icon: UserCog },
];

export default function Sidebar() {
  const location = useLocation();
  const { currentUser } = useAppStore();

  const roleLabels: Record<string, string> = {
    nurse: '护士',
    doctor: '医生',
    reception: '前台',
    manager: '主管'
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
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

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
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
                  <Icon className="w-5 h-5" />
                  {item.label}
                  {item.path === '/exceptions' && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      3
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full bg-white"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
            <p className="text-xs text-gray-500">{roleLabels[currentUser.role]}</p>
          </div>
          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
