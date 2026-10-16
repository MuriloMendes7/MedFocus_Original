import React, { useEffect, useRef, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  Award,
} from 'lucide-react';
import { useQuiz, useSubmitQuizAttempt } from '../hooks/useQuizzesAndStats';

const LETTERS = ['A', 'B', 'C', 'D'];

const formatClock = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const QuizSession = ({ quizId, onExit }) => {
  const { data: quiz, isLoading, error } = useQuiz(quizId);
  const submitMutation = useSubmitQuizAttempt();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [result, setResult] = useState(null);
  const startedAtRef = useRef(Date.now());
  const submittedRef = useRef(false);

  useEffect(() => {
    if (quiz && remainingSeconds === null) {
      setRemainingSeconds((quiz.timeLimitMinutes || 30) * 60);
      startedAtRef.current = Date.now();
    }
  }, [quiz, remainingSeconds]);

  const handleFinish = async () => {
    if (!quiz || submittedRef.current) return;
    submittedRef.current = true;
    const timeSpentSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
    try {
      const res = await submitMutation.mutateAsync({
        quizId: quiz.id,
        answers,
        timeSpentSeconds,
      });
      setResult(res);
    } catch (err) {
      submittedRef.current = false;
      alert(err.message || 'Não foi possível enviar o simulado.');
    }
  };

  useEffect(() => {
    if (remainingSeconds === null || result) return undefined;
    if (remainingSeconds <= 0) {
      handleFinish();
      return undefined;
    }
    const id = setInterval(() => setRemainingSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [remainingSeconds, result]);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-500 dark:text-slate-400 font-semibold">
        Carregando simulado...
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="p-8 bg-red-50 dark:bg-red-950/30 rounded-3xl text-center space-y-4">
        <p className="text-red-600 dark:text-red-400 font-bold">
          {error?.message || 'Não foi possível abrir este simulado.'}
        </p>
        <button
          onClick={onExit}
          className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-8">
        <div className="bg-[#FFFFFF] dark:bg-[#18211E] rounded-2xl p-8 border border-[#DDD6C8] dark:border-[#2A3731] text-center space-y-4 shadow-xs">
          <div
            className={`w-14 h-14 rounded-xl mx-auto flex items-center justify-center border ${
              result.passed
                ? 'bg-[#EDF3EF] text-[#24503F] border-[#CFDFD7] dark:bg-[#1E2E27] dark:text-[#8EBFAC] dark:border-[#2F493E]'
                : 'bg-[#FAF5E8] text-[#8C6D1F] border-[#EADBBD] dark:bg-[#252216] dark:text-[#DFC377] dark:border-[#3D371E]'
            }`}
          >
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-serif text-[#172622] dark:text-[#F1F5F3]">
            Desempenho: {result.score}%
          </h2>
          <p className="text-xs md:text-sm text-[#5D6D67] dark:text-[#93A59E]">
            Você acertou <strong>{result.correct}</strong> de <strong>{result.total}</strong>{' '}
            questões em {formatClock(result.timeSpentSeconds)}.
          </p>
          <button
            onClick={onExit}
            className="bg-[#1A3835] hover:bg-[#254F4A] text-[#FAF8F5] px-6 py-2.5 rounded-lg font-medium text-xs transition"
          >
            Concluir e Voltar
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-serif text-[#172622] dark:text-[#F1F5F3]">
            Gabarito Comentado
          </h3>
          {result.review.map((item, idx) => (
            <div
              key={item.id}
              className="bg-[#FFFFFF] dark:bg-[#18211E] rounded-xl p-5 border border-[#DDD6C8] dark:border-[#2A3731] space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="font-serif text-[#172622] dark:text-[#F1F5F3] text-sm">
                  {idx + 1}. {item.question}
                </p>
                {item.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-[#2D6A4F] shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-[#C47253] shrink-0" />
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {item.options.map((opt, optIdx) => {
                  const letter = LETTERS[optIdx];
                  const isCorrectOpt = letter === item.correct;
                  const isSelected = letter === item.selected;
                  return (
                    <div
                      key={letter}
                      className={`p-2.5 rounded-lg border font-medium ${
                        isCorrectOpt
                          ? 'bg-[#EDF3EF] border-[#CFDFD7] text-[#1E4335] dark:bg-[#1E2E27] dark:border-[#2F493E] dark:text-[#8EBFAC]'
                          : isSelected
                            ? 'bg-[#FDF7F5] border-[#F2D0C8] text-[#8A3020] dark:bg-[#2A1D1A] dark:border-[#4B2922] dark:text-[#E27D60]'
                            : 'border-[#DDD6C8] dark:border-[#2A3731] text-[#5D6D67] dark:text-[#93A59E]'
                      }`}
                    >
                      <span className="font-mono mr-1.5 font-bold">{letter})</span>
                      {opt}
                    </div>
                  );
                })}
              </div>
              {item.explanation && (
                <p className="text-xs text-[#5D6D67] dark:text-[#93A59E] bg-[#FAF8F5] dark:bg-[#141B18] p-3 rounded-lg border border-[#E8E2D6] dark:border-[#24312B] leading-relaxed">
                  <strong className="text-[#1A3835] dark:text-[#A1C5B5] font-mono uppercase text-[10px] block mb-0.5">Comentário Clínico:</strong> {item.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const current = questions[currentIndex];
  if (!current) return null;

  const isLowTime = remainingSeconds !== null && remainingSeconds <= 300;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header do simulado */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FFFFFF] dark:bg-[#18211E] p-4 px-6 rounded-2xl border border-[#DDD6C8] dark:border-[#2A3731]">
        <div>
          <h2 className="font-serif text-[#172622] dark:text-[#F1F5F3] text-base">{quiz.title}</h2>
          <p className="text-[11px] font-mono text-[#6A7B74]">
            Questão {currentIndex + 1} de {questions.length} • {answeredCount} respondidas
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-semibold text-xs border ${
            isLowTime
              ? 'bg-[#FDF7F5] text-[#A13A28] border-[#F2D0C8] animate-pulse'
              : 'bg-[#FAF8F5] text-[#1A3835] dark:bg-[#141B18] dark:text-[#A1C5B5] border-[#DDD6C8] dark:border-[#2A3731]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{remainingSeconds !== null ? formatClock(remainingSeconds) : '--:--'}</span>
        </div>
      </div>

      {/* Enunciado e alternativas */}
      <div className="bg-[#FFFFFF] dark:bg-[#18211E] rounded-2xl p-6 md:p-8 border border-[#DDD6C8] dark:border-[#2A3731] space-y-6 shadow-xs">
        <p className="text-base md:text-lg font-serif text-[#172622] dark:text-[#F1F5F3] leading-relaxed">
          {currentIndex + 1}. {current.question}
        </p>

        <div className="space-y-2.5">
          {current.options.map((opt, idx) => {
            const letter = LETTERS[idx];
            const selected = answers[current.id] === letter;
            return (
              <button
                key={letter}
                type="button"
                onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: letter }))}
                className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 ${
                  selected
                    ? 'border-[#1A3835] bg-[#F4F1EA] dark:bg-[#1F2B26] dark:border-[#4D7B6A] text-[#172622] dark:text-[#F1F5F3]'
                    : 'border-[#DDD6C8] dark:border-[#2A3731] hover:border-[#1A3835]/50 text-[#4D5D57] dark:text-[#93A59E]'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                    selected
                      ? 'bg-[#1A3835] text-[#FAF8F5]'
                      : 'bg-[#FAF8F5] dark:bg-[#141B18] text-[#5D6D67] border border-[#DDD6C8] dark:border-[#2A3731]'
                  }`}
                >
                  {letter}
                </span>
                <span className="font-normal text-xs md:text-sm leading-relaxed">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navegação */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#18211E] border border-[#DDD6C8] dark:border-[#2A3731] font-medium text-xs text-[#5D6D67] dark:text-[#93A59E] hover:bg-[#F4F1EA] disabled:opacity-40 transition"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Anterior
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1A3835] hover:bg-[#254F4A] text-[#FAF8F5] font-medium text-xs transition"
          >
            <span>Próxima</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={submitMutation.isPending}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#2D6A4F] hover:bg-[#3B8062] text-[#FAF8F5] font-medium text-xs disabled:opacity-50 transition"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{submitMutation.isPending ? 'Enviando...' : 'Finalizar Prova'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizSession;
