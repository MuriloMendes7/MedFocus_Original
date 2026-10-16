import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  ArrowRight,
  BookOpen,
  Award,
  ChevronRight,
  RotateCw,
  Layers,
  FileCheck,
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
    <div className="space-y-8 font-sans">
      {/* Cabeçalho Acolhedor e Direto */}
      <div className="bg-[#FFFFFF] dark:bg-[#18211E] border border-[#DDD6C8] dark:border-[#283630] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#5C776C] dark:text-[#8CB2A1]">
              ROTINA DE REVISÃO • CICLO DIÁRIO
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#162320] dark:text-[#F3F6F4]">
              Olá, {user?.name?.split(' ')[0] || 'Doutor(a)'}.
            </h1>
            <p className="text-sm text-[#5B6B65] dark:text-[#9AA9A3] max-w-xl leading-relaxed">
              {summary.dueToday > 0
                ? `Você tem ${summary.dueToday} cartões agendados para hoje. Uma sessão de cerca de 20 minutos é suficiente para manter sua retenção em dia.`
                : 'Todas as suas revisões para hoje foram concluídas. Descanse com a certeza de que seu progresso está consolidado.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard/flashcards"
              className="inline-flex items-center gap-2 bg-[#1A3835] hover:bg-[#254F4A] text-[#FAF8F5] dark:bg-[#254641] dark:hover:bg-[#305953] px-5 py-3 rounded-xl font-semibold text-xs transition shadow-sm"
            >
              <RotateCw className="w-4 h-4" />
              <span>Iniciar Sessão do Dia</span>
            </Link>
            <Link
              to="/dashboard/quizzes"
              className="inline-flex items-center gap-2 bg-[#FAF8F5] dark:bg-[#1C2623] hover:bg-[#EFECE5] text-[#243530] dark:text-[#DFE8E3] border border-[#DDD6C8] dark:border-[#2F4039] px-4 py-3 rounded-xl font-semibold text-xs transition"
            >
              <FileCheck className="w-4 h-4 text-[#527063]" />
              <span>Fazer Simulado</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Indicadores Estruturados (Estilo Ficha Clínica) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBox
          label="Para revisar hoje"
          value={statsLoading ? '...' : `${summary.dueToday}`}
          unit="cartões"
          detail={`de ${summary.totalCards} cadastrados`}
          highlight
        />
        <MetricBox
          label="Consistência"
          value={statsLoading ? '...' : `${summary.streakDays}`}
          unit="dias seguidos"
          detail={`${summary.reviewsToday} revisados hoje`}
        />
        <MetricBox
          label="Taxa de Retenção"
          value={statsLoading ? '...' : `${summary.retentionRate}%`}
          unit="acerto estável"
          detail="Respostas Bom / Fácil"
        />
        <MetricBox
          label="Tempo Dedicado"
          value={statsLoading ? '...' : `${summary.studyHours}`}
          unit="horas totais"
          detail="Sessões ativas no app"
        />
      </div>

      {/* Grade de 2 Colunas: Atividade dos 7 dias e Decks Pendentes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Gráfico 7 Dias */}
        <div className="lg:col-span-7 bg-[#FFFFFF] dark:bg-[#18211E] border border-[#DDD6C8] dark:border-[#283630] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#EFEBE3] dark:border-[#25332D] pb-3">
            <div>
              <h3 className="text-base font-serif font-bold text-[#1A2824] dark:text-[#EAEFEA]">
                Volume de Revisão (Últimos 7 dias)
              </h3>
              <p className="text-[11px] text-[#71827B]">Frequência e constância diária</p>
            </div>
            <Link
              to="/dashboard/stats"
              className="text-xs font-semibold text-[#325244] dark:text-[#9EC4B3] hover:underline flex items-center gap-1"
            >
              <span>Detalhes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-4 px-2">
            {last7Days.map((day) => {
              const heightPct = Math.max(10, Math.round((day.reviews / maxDayReviews) * 100));
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className="w-full bg-[#3D5E53] hover:bg-[#2C483F] dark:bg-[#487363] dark:hover:bg-[#5D917D] rounded-t-lg transition relative group cursor-pointer"
                      style={{ height: `${heightPct}%` }}
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1A2623] text-[#FAF8F5] text-[10px] font-mono py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow">
                        {day.reviews} cards
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#7D8E87] uppercase">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Decks Pendentes */}
        <div className="lg:col-span-5 bg-[#FFFFFF] dark:bg-[#18211E] border border-[#DDD6C8] dark:border-[#283630] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFEBE3] dark:border-[#25332D] pb-3">
            <div>
              <h3 className="text-base font-serif font-bold text-[#1A2824] dark:text-[#EAEFEA]">
                Baralhos na Fila
              </h3>
              <p className="text-[11px] text-[#71827B]">Prontos para estudo hoje</p>
            </div>
            <Link
              to="/dashboard/flashcards"
              className="text-xs font-semibold text-[#325244] dark:text-[#9EC4B3] hover:underline"
            >
              Ver acervo
            </Link>
          </div>

          <div className="space-y-2.5">
            {decksLoading ? (
              <p className="text-xs text-[#7A8A84] py-8 text-center">Carregando baralhos...</p>
            ) : dueDecks.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Award className="w-8 h-8 text-[#527063] mx-auto" />
                <p className="text-xs font-bold text-[#23352F] dark:text-[#E8EFEA]">
                  Tudo em ordem por aqui
                </p>
                <p className="text-[11px] text-[#71827B] max-w-xs mx-auto">
                  Nenhum cartão vencendo hoje. Excelente trabalho de retenção.
                </p>
              </div>
            ) : (
              dueDecks.map((deck) => (
                <Link
                  key={deck.deckId}
                  to={`/dashboard/flashcards?study=${encodeURIComponent(deck.deckId)}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#1C2522] border border-[#E5DFD4] dark:border-[#2B3833] hover:border-[#3D5E53] transition group"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-[#1C2925] dark:text-[#EAEFEA] truncate">
                      {deck.name}
                    </p>
                    <span className="text-[11px] text-[#4F7363] dark:text-[#9EC4B3] font-mono">
                      {deck.dueCount} para revisar
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8C9C96] group-hover:text-[#1A3835] dark:group-hover:text-[#FAF8F5] shrink-0" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricBox = ({ label, value, unit, detail, highlight = false }) => (
  <div
    className={`p-5 rounded-2xl border transition ${
      highlight
        ? 'bg-[#F2EFE8] dark:bg-[#1D2723] border-[#C8BEAB] dark:border-[#33463E]'
        : 'bg-[#FFFFFF] dark:bg-[#18211E] border-[#DDD6C8] dark:border-[#283630]'
    }`}
  >
    <p className="text-[11px] font-mono text-[#6A7B74] uppercase tracking-wider">{label}</p>
    <div className="mt-1 flex items-baseline gap-1.5">
      <span className="text-2xl sm:text-3xl font-serif font-bold text-[#192723] dark:text-[#E8EFEA]">
        {value}
      </span>
      <span className="text-xs text-[#71827C] font-normal">{unit}</span>
    </div>
    <p className="text-[11px] text-[#7E8F88] mt-1">{detail}</p>
  </div>
);

export default Overview;
