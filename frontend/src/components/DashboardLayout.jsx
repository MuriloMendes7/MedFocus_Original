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
import MedFocusLogo from './MedFocusLogo';

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
    { name: 'Baralhos (SM-2)', path: '/dashboard/flashcards', icon: Brain },
    { name: 'Simulados', path: '/dashboard/quizzes', icon: ClipboardCheck },
    { name: 'Estatísticas', path: '/dashboard/stats', icon: ChartLine },
    { name: 'Minha Conta', path: '/dashboard/profile', icon: User },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ name: 'Gestão de Conteúdo', path: '/dashboard/admin', icon: Settings });
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isDemo = Boolean(localStorage.getItem('medfocus_demo_token'));

  return (
    <div className="flex h-screen bg-[#FAF8F5] dark:bg-[#121615] text-[#1C2321] dark:text-[#F1F4F2] transition-colors duration-200 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#161E1B]/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Sóbria em Linho / Carvão Mineral */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-68 bg-[#F4F1EA] dark:bg-[#161D1A] border-r border-[#E2DBD0] dark:border-[#24302A] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#E6E0D5] dark:border-[#222E28]">
            <Link to="/" className="flex items-center">
              <MedFocusLogo size="md" showBadge={false} />
            </Link>
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-[#EAE4D9] dark:hover:bg-[#1E2723] text-[#6A7B74]"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card Sóbrio */}
          {user && (
            <div className="p-4 mx-4 mt-4 rounded-xl bg-[#FAF8F5] dark:bg-[#1C2522] border border-[#DDD6C8] dark:border-[#2A3731]">
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-serif font-bold text-[#1C2925] dark:text-[#EAEFEA] truncate">
                    {user.name || user.email}
                  </p>
                  <p className="text-[11px] text-[#6C7C75] dark:text-[#8E9F98] truncate">
                    {user.email}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#1A3835] dark:bg-[#284944] text-[#FAF8F5] flex items-center justify-center font-serif text-sm font-bold shrink-0">
                  {(user.name || user.email || 'M').charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#EAE4D8] dark:border-[#26332D] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#38594E] dark:text-[#9FB7AC]">
                  <Crown className="w-3.5 h-3.5 text-[#C4883A]" />
                  <span>Plano {PLAN_LABELS[user.plan] || user.plan}</span>
                </div>
                {isDemo && (
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#EAE3D4] dark:bg-[#202E27] text-[#556960] dark:text-[#A1B8AD] border border-[#D5CBBC] dark:border-[#2A3E34]">
                    Demo
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Navegação Sólida */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition text-xs font-semibold ${
                    isActive
                      ? 'bg-[#1A3835] text-[#FAF8F5] dark:bg-[#254641] dark:text-[#FAF8F5] shadow-sm'
                      : 'text-[#4F605A] dark:text-[#9EAEA8] hover:bg-[#EAE4D8] dark:hover:bg-[#1E2824] hover:text-[#1A2623] dark:hover:text-[#FAF8F5]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Rodapé da Sidebar */}
          <div className="p-4 border-t border-[#E6E0D5] dark:border-[#222E28] space-y-1">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-between px-3 py-2 w-full rounded-lg text-xs text-[#52635D] dark:text-[#97A8A1] hover:bg-[#EAE4D8] dark:hover:bg-[#1E2824] transition font-medium"
            >
              <div className="flex items-center gap-2.5">
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-[#D8B168]" />}
                <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-xs text-[#9E4738] dark:text-[#D97767] hover:bg-[#FBECE9] dark:hover:bg-[#2A1D1B] transition font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da conta</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Mobile */}
        <header className="flex items-center justify-between p-4 bg-[#F4F1EA] dark:bg-[#161D1A] border-b border-[#E2DBD0] dark:border-[#24302A] md:hidden z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-[#FAF8F5] dark:bg-[#1C2522] text-[#4F605A] dark:text-[#9DAEA8] border border-[#DDD6C8] dark:border-[#2A3731]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <MedFocusLogo size="sm" />
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-[#FAF8F5] dark:bg-[#1C2522] text-[#4F605A] dark:text-[#9DAEA8] border border-[#DDD6C8] dark:border-[#2A3731]"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-[#D8B168]" />}
          </button>
        </header>

        {/* Scrollable Container com Paleta Acolhedora */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-5xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
