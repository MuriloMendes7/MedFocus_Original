import React from 'react';
import { BarChart3, TrendingUp, Award, CheckCircle2 } from 'lucide-react';
import { useStats } from '../../hooks/useQuizzesAndStats';

const Stats = () => {
  const { data, isLoading } = useStats();

  const summary = data?.summary ?? {
    totalReviews: 0,
    retentionRate: 0,
    learnedCards: 0,
    totalCards: 0,
    quizAttempts: 0,
    avgQuizScore: 0,
  };
  const byCategory = data?.byCategory ?? [];
  const recentAttempts = data?.recentAttempts ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Estatísticas Detalhadas
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Analise seu desempenho real por disciplina, retenção de flashcards e histórico de
          simulados.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryBox
          label="Revisões (90d)"
          value={isLoading ? '...' : summary.totalReviews}
        />
        <SummaryBox
          label="Cards Aprendidos"
          value={isLoading ? '...' : `${summary.learnedCards}/${summary.totalCards}`}
        />
        <SummaryBox
          label="Simulados Realizados"
          value={isLoading ? '...' : summary.quizAttempts}
        />
        <SummaryBox
          label="Média nos Simulados"
          value={isLoading ? '...' : `${summary.avgQuizScore}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Desempenho por disciplina */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white font-extrabold">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3>Aproveitamento por Disciplina</h3>
          </div>

          {byCategory.length === 0 ? (
            <p className="text-sm text-slate-400 py-10 text-center">
              Estude flashcards ou realize simulados para ver seu desempenho por matéria.
            </p>
          ) : (
            <div className="space-y-4">
              {byCategory.map((item) => (
                <StatBar
                  key={item.category}
                  label={item.category}
                  subLabel={`${item.total} respostas`}
                  percentage={item.percentage}
                />
              ))}
            </div>
          )}
        </div>

        {/* Histórico recente de simulados */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white font-extrabold">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3>Últimos Simulados</h3>
          </div>

          {recentAttempts.length === 0 ? (
            <p className="text-sm text-slate-400 py-10 text-center">
              Você ainda não concluiu nenhum simulado.
            </p>
          ) : (
            <div className="space-y-3">
              {recentAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        attempt.score >= 70
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}
                    >
                      {attempt.score >= 70 ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Award className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {attempt.quizTitle}
                      </p>
                      <p className="text-xs text-slate-500">
                        {attempt.correct}/{attempt.total} acertos •{' '}
                        {new Date(attempt.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {attempt.score}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryBox = ({ label, value }) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
    <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{value}</p>
  </div>
);

const StatBar = ({ label, subLabel, percentage }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-sm">
      <span className="text-slate-700 dark:text-slate-200 font-bold">
        {label}{' '}
        <span className="text-xs font-normal text-slate-400">({subLabel})</span>
      </span>
      <span className="text-slate-900 dark:text-white font-extrabold">{percentage}%</span>
    </div>
    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
      <div
        className="bg-blue-600 h-full rounded-full transition-all duration-700"
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);

export default Stats;
