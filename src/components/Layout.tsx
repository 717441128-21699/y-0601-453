import { Link, useLocation, Outlet } from 'react-router-dom';
import { Activity, LayoutDashboard, ListTodo, FileCheck, FolderKanban, HeartPulse, Bell, User, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const navItems = [
  { path: '/dashboard', label: '数据看板', icon: LayoutDashboard },
  { path: '/tasks', label: '任务管理', icon: ListTodo },
  { path: '/approvals', label: '审批中心', icon: FileCheck },
  { path: '/cases', label: '病例档案', icon: FolderKanban },
];

export default function Layout() {
  const location = useLocation();
  const { currentUser, warnings, stats } = useAppStore();
  const unreadWarnings = warnings.filter(w => !w.reviewResult).length;

  return (
    <div className="flex h-screen bg-space-deep overflow-hidden">
      <aside className="w-64 flex-shrink-0 glass-card border-r border-medical-cyan/10 flex flex-col">
        <div className="p-6 border-b border-medical-cyan/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-medical-cyan to-medical-cyan-dark flex items-center justify-center shadow-glow-cyan">
              <HeartPulse className="w-6 h-6 text-space-deep" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-white glow-text">Hemodyn</h1>
              <p className="text-xs text-medical-cyan/60">血流动力学平台</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                  active
                    ? 'bg-medical-cyan/15 text-medical-cyan shadow-glow-cyan border border-medical-cyan/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-medical-cyan/10">
          <div className="glass-card rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-space-blue to-space-dark flex items-center justify-center border border-medical-cyan/20">
              <User className="w-5 h-5 text-medical-cyan" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-400 truncate">
                {currentUser.role === 'engineer' ? '临床工程师' :
                 currentUser.role === 'researcher' ? '生物力学研究员' :
                 currentUser.role === 'doctor' ? '主任医师' : '首席科学家'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex-shrink-0 border-b border-medical-cyan/10 glass-card flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <Activity className="w-5 h-5 text-medical-cyan animate-pulse" />
            <span className="text-sm text-gray-300">系统运行正常 · 计算节点 <span className="text-medical-cyan font-mono">8/10</span> 在线</span>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition">
              <Bell className="w-5 h-5 text-gray-300" />
              {unreadWarnings > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-alert-red text-white text-xs flex items-center justify-center shadow-glow-red">
                  {unreadWarnings}
                </span>
              )}
            </button>
            <div className="text-right">
              <p className="text-sm text-gray-300">今日统计</p>
              <p className="font-mono text-medical-cyan text-sm">
                {stats?.todayTasks || 0} 任务 · {stats?.completionRate || 0}% 完成
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 bg-grid-pattern bg-radial-glow" style={{ backgroundSize: '40px 40px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
