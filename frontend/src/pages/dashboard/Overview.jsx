import React from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Brain,
  Target,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Layers,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDecks } from '../../hooks/useDecks';
import { useStats } from '../../hooks/useQuizzesAndStats';

const Overview = () => {
  const { user } = useAuth();
  const { data: decks = [], isLoading: decksLoading } = useDecks();
  const { data: statsData, isLoading: statsLoading } = useStats();

  const summary = statsData?.summary ?? {
    totalCards: 0,
    dueToday: 0,
    reviewsToday: 0,
    retentionRate: 0,
    streakDays: 0,
    studyHours: 0,
  };
  const last7Days = statsData?.last7Days ?? [];
  const maxDayReviews = Math.max(10, ...last7Days.map((d) => d.reviews));

  const dueDecks = decks.filter((d) => !d.locked && d.dueCount > 0).slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Olá, {user?.name?.split(' ')[0] || 'Estudante'}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {summary.dueToday > 0
              ? `Você tem ${summary.dueToday} flashcards prontos para revisão hoje.`
              : 'Suas revisões estão em dia! Que tal um simulado?'}
          </p>
        </div>
        <Link
          to="/dashboard/flashcards"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition text-sm"
        >
          <span>Estudar Agora</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Cards de métricas reais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Flame className="w-6 h-6 text-orange-500" />}
          label="Ofensiva"
          value={statsLoading ? '...' : `${summary.streakDays} dias`}
          subValue={`${summary.reviewsToday} revisões hoje`}
          bg="bg-orange-50 dark:bg-orange-950/30"
        />
        <StatCard
          icon={<Brain className="w-6 h-6 text-blue-500" />}
          label="Para Hoje"
          value={statsLoading ? '...' : `${summary.dueToday} cards`}
          subValue={`de ${summary.totalCards} no total`}
          bg="bg-blue-50 dark:bg-blue-950/30"
        />
        <StatCard
          icon={<Target className="w-6 h-6 text-emerald-500" />}
          label="Taxa de Retenção"
          value={statsLoading ? '...' : `${summary.retentionRate}%`}
          subValue="Respostas Bom / Fácil"
          bg="bg-emerald-50 dark:bg-emerald-950/30"
        />
        <StatCard
          icon={<Clock className="w-6 h-6 text-indigo-500" />}
          label="Tempo de Estudo"
          value={statsLoading ? '...' : `${summary.studyHours}h`}
          subValue="Últimos 90 dias"
          bg="bg-indigo-50 dark:bg-indigo-950/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de revisões dos últimos 7 dias */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Atividade nos Últimos 7 Dias
              </h3>
              <p className="text-xs text-slate-500">Quantidade de flashcards revisados por dia</p>
            </div>
            <Link
              to="/dashboard/stats"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Ver estatísticas completas
            </Link>
          </div>

          <div className="h-52 flex items-end justify-between gap-3 pt-6 px-2">
            {last7Days.map((day) => {
              const heightPct = Math.max(6, Math.round((day.reviews / maxDayReviews) * 100));
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className="w-full bg-blue-600/90 hover:bg-blue-600 rounded-t-xl transition-all relative group"
                      style={{ height: `${heightPct}%` }}
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        {day.reviews} cards
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Próximas revisões */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Decks Pendentes
            </h3>
            <Link
              to="/dashboard/flashcards"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Ver todos
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {decksLoading ? (
              <p className="text-sm text-slate-400 py-8 text-center">Carregando decks...</p>
            ) : dueDecks.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Award className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Tudo revisado por hoje!
                </p>
                <p className="text-xs text-slate-400">
                  Crie novos decks ou pratique com um simulado.
                </p>
              </div>
            ) : (
              dueDecks.map((deck) => (
                <Link
                  key={deck.deckId}
                  to={`/dashboard/flashcards?study=${encodeURIComponent(deck.deckId)}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/70 dark:hover:bg-slate-800 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-blue-600 border border-slate-200 dark:border-slate-700 shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {deck.name}
                      </h4>
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {deck.dueCount} para revisar
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subValue, bg }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex items-center gap-4">
      <div className={`${bg} p-3.5 rounded-2xl`}>{icon}</div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{value}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subValue}</p>
      </div>
    </div>
  </div>
);

export default Overview;
