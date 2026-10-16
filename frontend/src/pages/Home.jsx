import React from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  ClipboardCheck,
  ChartLine,
  UserCog,
  HeartPulse,
  Microscope,
  Pill,
  Sun,
  Moon,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen dark:bg-slate-950 transition-colors duration-200">
      {/* Navbar */}
      <nav className="bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/assets/medfocus-icon.png" alt="Logo" className="h-8 w-8" />
              <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                MedFocus
              </span>
            </Link>
            <div className="flex items-center gap-4 md:gap-6">
              <a
                href="#funcionalidades"
                className="hidden md:inline text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition"
              >
                Funcionalidades
              </a>
              <a
                href="#planos"
                className="hidden md:inline text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition"
              >
                Planos
              </a>
              <button
                onClick={toggleTheme}
                aria-label="Alternar tema"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              {user ? (
                <Link
                  to="/dashboard"
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition flex items-center gap-1.5"
                >
                  <span>Meu Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition"
                >
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-blue-50/70 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
              Revolucione seus estudos em <span className="text-blue-600">Medicina</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-xl">
              Aprenda com flashcards inteligentes de repetição espaçada (SM-2), simulados
              cronometrados e estatísticas reais sincronizadas na nuvem.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                to={user ? '/dashboard' : '/register'}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
              >
                {user ? 'Ir para os Estudos' : 'Começar Agora'}
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-500 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                >
                  Fazer Login
                </Link>
              )}
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="relative w-72 h-72 md:w-96 md:h-96 mx-auto bg-blue-100 dark:bg-blue-950/50 rounded-full flex items-center justify-center">
              <HeartPulse className="w-32 h-32 text-blue-600 dark:text-blue-400" />
              <div className="absolute top-2 right-2 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                <Brain className="w-8 h-8 text-indigo-500" />
              </div>
              <div className="absolute bottom-2 left-2 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                <Microscope className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="absolute top-1/2 -right-4 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                <Pill className="w-8 h-8 text-rose-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-center text-slate-900 dark:text-white mb-12">
            Funcionalidades Principais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Brain className="w-8 h-8 text-blue-500" />}
              title="Flashcards Inteligentes"
              description="Algoritmo SM-2 que agenda suas revisões no momento ideal para retenção máxima."
            />
            <FeatureCard
              icon={<ClipboardCheck className="w-8 h-8 text-emerald-500" />}
              title="Simulados Cronometrados"
              description="Questões com temporizador e gabarito comentado ao finalizar."
            />
            <FeatureCard
              icon={<ChartLine className="w-8 h-8 text-indigo-500" />}
              title="Estatísticas em Tempo Real"
              description="Acompanhe ofensiva de dias, taxa de retenção e desempenho por disciplina."
            />
            <FeatureCard
              icon={<UserCog className="w-8 h-8 text-amber-500" />}
              title="Decks Próprios + Oficiais"
              description="Estude os baralhos oficiais do MedFocus ou crie/importe seus próprios em .txt."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
              Planos e Preços
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Escolha o plano ideal para sua jornada até a aprovação
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard
              title="Gratuito"
              price="0"
              features={['Até 50 flashcards próprios', '5 simulados por mês', 'Decks oficiais gratuitos']}
              buttonText="Começar Grátis"
              variant="outline"
            />
            <PricingCard
              title="Básico"
              price="29,90"
              features={[
                'Até 500 flashcards próprios',
                '50 simulados por mês',
                'Decks oficiais do plano Básico',
                'Estatísticas completas',
              ]}
              buttonText="Assinar Básico"
              variant="primary"
              popular
            />
            <PricingCard
              title="Premium"
              price="49,90"
              features={[
                'Flashcards ilimitados',
                'Simulados ilimitados',
                'Acesso total ao acervo Premium',
                'Suporte prioritário',
              ]}
              buttonText="Assinar Premium"
              variant="primary"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/assets/medfocus-icon.png" alt="Logo" className="h-6 w-6" />
            <span className="text-slate-600 dark:text-slate-400 font-semibold text-sm">
              © 2026 MedFocus Cards
            </span>
          </div>
          <div className="flex gap-6 text-sm font-medium text-slate-500">
            <a href="#funcionalidades" className="hover:text-blue-600 transition">
              Funcionalidades
            </a>
            <a href="#planos" className="hover:text-blue-600 transition">
              Planos
            </a>
            <Link to="/login" className="hover:text-blue-600 transition">
              Área do Aluno
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="p-8 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
  </div>
);

const PricingCard = ({ title, price, features, buttonText, variant, popular }) => (
  <div
    className={`p-8 rounded-3xl flex flex-col ${
      popular
        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 md:scale-105 z-10'
        : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800'
    }`}
  >
    {popular && (
      <span className="bg-blue-500 text-xs font-extrabold px-3 py-1 rounded-full w-fit mb-4">
        MAIS POPULAR
      </span>
    )}
    <h3 className="text-2xl font-extrabold mb-4">{title}</h3>
    <div className="text-4xl font-black mb-6">
      R$ {price}
      <span className="text-lg font-normal opacity-80">/mês</span>
    </div>
    <ul className="space-y-3.5 mb-8 flex-1 text-sm">
      {features.map((f, i) => (
        <li key={i} className="flex items-center gap-3">
          <ClipboardCheck className={`w-5 h-5 shrink-0 ${popular ? 'text-blue-200' : 'text-blue-600'}`} />
          <span>{f}</span>
        </li>
      ))}
    </ul>
    <Link
      to="/register"
      className={`block text-center py-3.5 rounded-xl font-bold transition ${
        popular
          ? 'bg-white text-blue-600 hover:bg-blue-50'
          : variant === 'primary'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800'
      }`}
    >
      {buttonText}
    </Link>
  </div>
);

export default Home;
