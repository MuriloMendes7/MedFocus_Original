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
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-5 rounded-full text-emerald-600 dark:text-emerald-400 mb-6">
          <Check className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
          Sessão Concluída!
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
          Excelente trabalho! Seu progresso foi salvo na nuvem com o algoritmo SM-2.
        </p>

        <div className="grid grid-cols-3 gap-4 w-full max-w-md mb-8">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{studiedCount}</p>
            <p className="text-xs font-bold text-slate-500 uppercase">Revisados</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {accuracy}%
            </p>
            <p className="text-xs font-bold text-slate-500 uppercase">Precisão</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {formatTime(elapsedSeconds)}
            </p>
            <p className="text-xs font-bold text-slate-500 uppercase">Tempo</p>
          </div>
        </div>

        <button
          onClick={onFinish}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold transition shadow-lg shadow-blue-600/20"
        >
          Voltar para Decks
        </button>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-slate-500">Carregando sessão...</p>
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
        <div className="flex justify-between items-center text-sm font-bold text-slate-500 dark:text-slate-400 px-1">
          <span>
            Card {currentIndex + 1} de {totalCards}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(elapsedSeconds)}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
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
          <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-10 flex flex-col items-center justify-center text-center border-2 border-slate-200 dark:border-slate-800 shadow-xl">
            <span className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-4 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full">
              Pergunta
            </span>
            <div className="my-auto max-h-56 overflow-y-auto px-2">
              <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-relaxed">
                {frontText}
              </h3>
            </div>
            <p className="mt-4 text-slate-400 dark:text-slate-500 text-xs font-semibold">
              Clique ou pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Espaço</kbd> para revelar
            </p>
          </div>

          {/* Verso */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-10 flex flex-col items-center justify-center text-center border-2 border-blue-500 shadow-2xl">
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full">
              Resposta
            </span>
            <div className="my-auto max-h-56 overflow-y-auto space-y-4 px-2">
              <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                {backText}
              </p>
              {explanationText && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-sm text-left flex gap-2.5 items-start">
                  <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>{explanationText}</span>
                </div>
              )}
            </div>
            <p className="mt-4 text-slate-400 text-xs font-semibold">
              Avalie abaixo (atalhos <kbd className="px-1 rounded bg-slate-100 dark:bg-slate-800">1</kbd>–<kbd className="px-1 rounded bg-slate-100 dark:bg-slate-800">4</kbd>)
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
          color="blue"
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
  red: 'border-red-200 dark:border-red-900/40 hover:border-red-500 text-red-600 dark:text-red-400',
  amber:
    'border-amber-200 dark:border-amber-900/40 hover:border-amber-500 text-amber-600 dark:text-amber-400',
  emerald:
    'border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400',
  blue: 'border-blue-200 dark:border-blue-900/40 hover:border-blue-500 text-blue-600 dark:text-blue-400',
};

const RateButton = ({ shortcut, label, interval, icon: Icon, color, onClick }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 transition-all active:scale-95 ${COLOR_STYLES[color]}`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-xs font-extrabold uppercase">
      {label} <span className="opacity-50">({shortcut})</span>
    </span>
    <span className="text-[11px] text-slate-400 font-semibold">{interval}</span>
  </button>
);

export default StudySession;
