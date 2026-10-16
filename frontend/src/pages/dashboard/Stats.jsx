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
      <div className="pb-4 border-b border-[#E8E2D6] dark:border-[#24312B]">
        <h1 className="text-2xl md:text-3xl font-serif text-[#172622] dark:text-[#F1F5F3] tracking-tight">
          Desempenho e Retenção
        </h1>
        <p className="text-[#6A7B74] dark:text-[#93A59E] text-xs md:text-sm mt-1">
          Análise longitudinal de revisões espaçadas, acurácia por especialidade e simulados.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryBox
          label="Revisões (90 dias)"
          value={isLoading ? '...' : summary.totalReviews}
        />
        <SummaryBox
          label="Cards Consolidados"
          value={isLoading ? '...' : `${summary.learnedCards}/${summary.totalCards}`}
        />
        <SummaryBox
          label="Simulados Concluídos"
          value={isLoading ? '...' : summary.quizAttempts}
        />
        <SummaryBox
          label="Acurácia Geral"
          value={isLoading ? '...' : `${summary.avgQuizScore}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desempenho por disciplina */}
        <div className="bg-[#FFFFFF] dark:bg-[#18211E] p-6 rounded-2xl border border-[#DDD6C8] dark:border-[#2A3731] shadow-xs">
          <div className="flex items-center gap-2 mb-6 text-[#172622] dark:text-[#F1F5F3]">
            <BarChart3 className="w-4 h-4 text-[#1A3835] dark:text-[#A1C5B5]" />
            <h3 className="font-serif text-base">Aproveitamento por Especialidade</h3>
          </div>

          {byCategory.length === 0 ? (
            <p className="text-xs font-mono text-[#889892] py-10 text-center">
              Complete revisões ou simulados para gerar métricas por disciplina.
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
        <div className="bg-[#FFFFFF] dark:bg-[#18211E] p-6 rounded-2xl border border-[#DDD6C8] dark:border-[#2A3731] shadow-xs">
          <div className="flex items-center gap-2 mb-6 text-[#172622] dark:text-[#F1F5F3]">
            <TrendingUp className="w-4 h-4 text-[#2D6A4F] dark:text-[#8EBFAC]" />
            <h3 className="font-serif text-base">Histórico Recente de Simulados</h3>
          </div>

          {recentAttempts.length === 0 ? (
            <p className="text-xs font-mono text-[#889892] py-10 text-center">
              Nenhum simulado registrado até o momento.
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#141B18] border border-[#E8E2D6] dark:border-[#24312B]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        attempt.score >= 70
                          ? 'bg-[#EDF3EF] text-[#24503F] border-[#CFDFD7] dark:bg-[#1E2E27] dark:text-[#8EBFAC] dark:border-[#2F493E]'
                          : 'bg-[#FAF5E8] text-[#8C6D1F] border-[#EADBBD] dark:bg-[#252216] dark:text-[#DFC377] dark:border-[#3D371E]'
                      }`}
                    >
                      {attempt.score >= 70 ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Award className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#172622] dark:text-[#F1F5F3] truncate">
                        {attempt.quizTitle}
                      </p>
                      <p className="text-[11px] font-mono text-[#6A7B74]">
                        {attempt.correct}/{attempt.total} acertos •{' '}
                        {new Date(attempt.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-serif text-[#172622] dark:text-[#F1F5F3]">
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
  <div className="bg-[#FFFFFF] dark:bg-[#18211E] p-5 rounded-2xl border border-[#DDD6C8] dark:border-[#2A3731] shadow-xs">
    <p className="text-[10px] font-mono uppercase tracking-wider text-[#6A7B74] dark:text-[#93A59E]">{label}</p>
    <p className="text-2xl font-serif text-[#172622] dark:text-[#F1F5F3] mt-1">{value}</p>
  </div>
);

const StatBar = ({ label, subLabel, percentage }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-[#354640] dark:text-[#CAD6D1] font-medium">
        {label}{' '}
        <span className="text-[10px] font-mono text-[#889892]">({subLabel})</span>
      </span>
      <span className="font-mono font-semibold text-[#172622] dark:text-[#F1F5F3]">{percentage}%</span>
    </div>
    <div className="w-full bg-[#E8E2D6] dark:bg-[#24312B] h-2 rounded-full overflow-hidden">
      <div
        className="bg-[#1A3835] dark:bg-[#527063] h-full rounded-full transition-all duration-700"
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);

export default Stats;
