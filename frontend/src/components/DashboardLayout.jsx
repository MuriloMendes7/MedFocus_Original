import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Brain,
  ClipboardCheck,
  ChartLine,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Crown,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const PLAN_LABELS = {
  free: 'Gratuito',
  basic: 'Básico',
  premium: 'Premium',
};

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Visão Geral', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Flashcards', path: '/dashboard/flashcards', icon: Brain },
    { name: 'Simulados', path: '/dashboard/quizzes', icon: ClipboardCheck },
    { name: 'Estatísticas', path: '/dashboard/stats', icon: ChartLine },
    { name: 'Perfil', path: '/dashboard/profile', icon: User },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ name: 'Admin', path: '/dashboard/admin', icon: Settings });
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/assets/medfocus-icon.png" alt="Logo" className="h-8 w-8" />
              <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                MedFocus
              </span>
            </Link>
            <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {user && (
            <div className="px-4 py-3 mx-4 mt-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {user.name || user.email}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Plano {PLAN_LABELS[user.plan] || user.plan}
                </span>
              </div>
            </div>
          )}

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-semibold text-sm ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition font-semibold"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition font-semibold"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 md:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/assets/medfocus-icon.png" alt="Logo" className="h-6 w-6" />
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">MedFocus</span>
          </div>
          <button onClick={toggleTheme} className="text-slate-600 dark:text-slate-400">
            {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
