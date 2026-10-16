import React, { useEffect, useState } from 'react';
import { Check, FastForward, RotateCcw, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { useStudySession } from '../hooks/useStudySession';

const formatTime = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatIntervalLabel = (days) => {
  if (!days || days <= 0) return '10 min';
  if (days === 1) return '1 dia';
  return `${days} dias`;
};

const StudySession = ({ deck, onFinish }) => {
  const {
    currentCard,
    currentIndex,
    totalCards,
    isFinished,
    studiedCount,
    correctCount,
    elapsedSeconds,
    intervalPreviews,
    handleRate,
  } = useStudySession(deck);

  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  useEffect(() => {
    if (isFinished) return undefined;
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (isFlipped && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        setIsFlipped(false);
        handleRate(Number(e.key));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFinished, isFlipped, handleRate]);

  if (isFinished) {
    const accuracy = studiedCount > 0 ? Math.round((correctCount / studiedCount) * 100) : 100;
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-[#FFFFFF] dark:bg-[#18211E] rounded-2xl border border-[#DDD6C8] dark:border-[#2A3731] p-8 shadow-xs">
        <div className="bg-[#EDF3EF] dark:bg-[#1F2E28] p-4 rounded-full text-[#24503F] dark:text-[#8EBFAC] mb-5 border border-[#CFDFD7] dark:border-[#2F493E]">
          <Check className="w-10 h-10" />
        </div>
        <h2 className="text-2xl md:text-3xl font-serif text-[#172622] dark:text-[#F1F5F3] mb-2">
          Ciclo de Revisão Concluído
        </h2>
        <p className="text-xs md:text-sm text-[#6A7B74] dark:text-[#93A59E] mb-8 max-w-md leading-relaxed">
          Seus novos intervalos de retenção foram recalculados pelo algoritmo SM-2.
        </p>

        <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-8">
          <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141B18] border border-[#DDD6C8] dark:border-[#2A3731]">
            <p className="text-2xl font-serif text-[#172622] dark:text-[#F1F5F3]">{studiedCount}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#6A7B74]">Revisados</p>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141B18] border border-[#DDD6C8] dark:border-[#2A3731]">
            <p className="text-2xl font-serif text-[#24503F] dark:text-[#8EBFAC]">
              {accuracy}%
            </p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#6A7B74]">Acurácia</p>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141B18] border border-[#DDD6C8] dark:border-[#2A3731]">
            <p className="text-2xl font-serif text-[#1A3835] dark:text-[#A1C5B5]">
              {formatTime(elapsedSeconds)}
            </p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#6A7B74]">Tempo</p>
          </div>
        </div>

        <button
          onClick={onFinish}
          className="bg-[#1A3835] hover:bg-[#254F4A] text-[#FAF8F5] px-7 py-3 rounded-xl font-medium text-xs transition"
        >
          Voltar para Baralhos
        </button>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#889892] mb-3" />
        <p className="text-xs font-mono text-[#6A7B74]">Carregando sessão de estudo...</p>
      </div>
    );
  }

  const progress = totalCards > 0 ? (currentIndex / totalCards) * 100 : 0;
  const frontText = currentCard.question || currentCard.front;
  const backText = currentCard.answer || currentCard.back;
  const explanationText = currentCard.explanation || currentCard.hint;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* HUD */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-mono text-[#6A7B74] dark:text-[#93A59E] px-1">
          <span>
            Card {currentIndex + 1} de {totalCards}
          </span>
          <span className="flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-[#18211E] px-2.5 py-1 rounded-md border border-[#DDD6C8] dark:border-[#2A3731]">
            <Clock className="w-3 h-3 text-[#889892]" />
            {formatTime(elapsedSeconds)}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-[#E8E2D6] dark:bg-[#24312B] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1A3835] dark:bg-[#527063] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card 3D */}
      <div
        className="relative h-96 w-full perspective-1000 cursor-pointer select-none"
        onClick={() => setIsFlipped((f) => !f)}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Frente */}
          <div className="absolute inset-0 backface-hidden bg-[#FFFFFF] dark:bg-[#18211E] rounded-2xl p-8 md:p-10 flex flex-col items-center justify-center text-center border border-[#DDD6C8] dark:border-[#2A3731] shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-widest mb-4 bg-[#F4F1EA] dark:bg-[#202C27] text-[#556961] dark:text-[#95A8A0] px-3 py-1 rounded-full border border-[#E5DFD4] dark:border-[#293630]">
              Pergunta Clínica
            </span>
            <div className="my-auto max-h-56 overflow-y-auto px-2">
              <h3 className="text-xl md:text-2xl font-serif text-[#172622] dark:text-[#F1F5F3] leading-relaxed">
                {frontText}
              </h3>
            </div>
            <p className="mt-4 text-[#889892] text-xs font-mono">
              Clique ou pressione <kbd className="px-1.5 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#202C27] border border-[#DDD6C8] dark:border-[#2A3731]">Espaço</kbd> para revelar
            </p>
          </div>

          {/* Verso */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#FFFFFF] dark:bg-[#18211E] rounded-2xl p-8 md:p-10 flex flex-col items-center justify-center text-center border-2 border-[#1A3835] dark:border-[#4D7B6A] shadow-md">
            <span className="text-[10px] font-mono uppercase tracking-widest mb-4 bg-[#EDF3EF] dark:bg-[#1E2E27] text-[#24503F] dark:text-[#8EBFAC] px-3 py-1 rounded-full border border-[#CFDFD7] dark:border-[#2F493E]">
              Resposta & Justificativa
            </span>
            <div className="my-auto max-h-56 overflow-y-auto space-y-4 px-2">
              <p className="text-lg md:text-xl font-serif text-[#172622] dark:text-[#F1F5F3] leading-relaxed">
                {backText}
              </p>
              {explanationText && (
                <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141B18] border border-[#DDD6C8] dark:border-[#2A3731] text-[#5D6D67] dark:text-[#90A29A] text-xs text-left leading-relaxed">
                  <span className="font-semibold block text-[#1A3835] dark:text-[#A1C5B5] mb-1 font-mono uppercase text-[10px]">
                    Explicação Clínica:
                  </span>
                  <span>{explanationText}</span>
                </div>
              )}
            </div>
            <p className="mt-4 text-[#889892] text-xs font-mono">
              Avalie seu grau de retenção (teclas <kbd className="px-1 rounded bg-[#FAF8F5] dark:bg-[#202C27] border border-[#DDD6C8]">1</kbd> a <kbd className="px-1 rounded bg-[#FAF8F5] dark:bg-[#202C27] border border-[#DDD6C8]">4</kbd>)
            </p>
          </div>
        </div>
      </div>

      {/* Botões de avaliação SM-2 */}
      <div
        className={`grid grid-cols-2 md:grid-cols-4 gap-3 transition-all duration-200 ${
          isFlipped
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        <RateButton
          shortcut="1"
          label="Errei"
          interval={formatIntervalLabel(intervalPreviews?.again)}
          icon={RotateCcw}
          color="red"
          onClick={() => {
            setIsFlipped(false);
            handleRate(1);
          }}
        />
        <RateButton
          shortcut="2"
          label="Difícil"
          interval={formatIntervalLabel(intervalPreviews?.hard)}
          icon={AlertCircle}
          color="amber"
          onClick={() => {
            setIsFlipped(false);
            handleRate(2);
          }}
        />
        <RateButton
          shortcut="3"
          label="Bom"
          interval={formatIntervalLabel(intervalPreviews?.good)}
          icon={Check}
          color="emerald"
          onClick={() => {
            setIsFlipped(false);
            handleRate(3);
          }}
        />
        <RateButton
          shortcut="4"
          label="Fácil"
          interval={formatIntervalLabel(intervalPreviews?.easy)}
          icon={FastForward}
          color="teal"
          onClick={() => {
            setIsFlipped(false);
            handleRate(4);
          }}
        />
      </div>
    </div>
  );
};

const COLOR_STYLES = {
  red: 'border-[#F2D0C8] dark:border-[#4B2922] bg-[#FDF7F5] dark:bg-[#231A18] hover:border-[#C47253] text-[#A13A28] dark:text-[#E27D60]',
  amber:
    'border-[#EADBBD] dark:border-[#3D371E] bg-[#FAF8EE] dark:bg-[#222016] hover:border-[#B8860B] text-[#8C6D1F] dark:text-[#DFC377]',
  emerald:
    'border-[#CFDFD7] dark:border-[#2F493E] bg-[#F5FAF7] dark:bg-[#18231E] hover:border-[#3B6955] text-[#24503F] dark:text-[#8EBFAC]',
  teal: 'border-[#DDD6C8] dark:border-[#2A3731] bg-[#FAF8F5] dark:bg-[#1A2622] hover:border-[#1A3835] text-[#1A3835] dark:text-[#A1C5B5]',
};

const RateButton = ({ shortcut, label, interval, icon: Icon, color, onClick }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border transition-all active:scale-95 ${COLOR_STYLES[color]}`}
  >
    <Icon className="w-4 h-4" />
    <span className="text-xs font-medium uppercase font-mono tracking-wider">
      {label} <span className="opacity-50">({shortcut})</span>
    </span>
    <span className="text-[10px] font-mono opacity-80">{interval}</span>
  </button>
);

export default StudySession;
