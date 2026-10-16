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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div
            className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
              result.passed
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
            }`}
          >
            <Award className="w-9 h-9" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Nota: {result.score}%
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Você acertou <strong>{result.correct}</strong> de <strong>{result.total}</strong>{' '}
            questões em {formatClock(result.timeSpentSeconds)}.
          </p>
          <button
            onClick={onExit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold transition"
          >
            Concluir Revisão
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Gabarito Comentado
          </h3>
          {result.review.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="font-bold text-slate-900 dark:text-white">
                  {idx + 1}. {item.question}
                </p>
                {item.isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500 shrink-0" />
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {item.options.map((opt, optIdx) => {
                  const letter = LETTERS[optIdx];
                  const isCorrectOpt = letter === item.correct;
                  const isSelected = letter === item.selected;
                  return (
                    <div
                      key={letter}
                      className={`p-3 rounded-xl border font-medium ${
                        isCorrectOpt
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                          : isSelected
                            ? 'bg-red-50 border-red-300 text-red-900 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="font-extrabold mr-2">{letter})</span>
                      {opt}
                    </div>
                  );
                })}
              </div>
              {item.explanation && (
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl">
                  <strong>Comentário:</strong> {item.explanation}
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
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 px-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="font-extrabold text-slate-900 dark:text-white">{quiz.title}</h2>
          <p className="text-xs text-slate-500">
            Questão {currentIndex + 1} de {questions.length} • {answeredCount} respondidas
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-sm ${
            isLowTime
              ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400 animate-pulse'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{remainingSeconds !== null ? formatClock(remainingSeconds) : '--:--'}</span>
        </div>
      </div>

      {/* Enunciado e alternativas */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
        <p className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
          {currentIndex + 1}. {current.question}
        </p>

        <div className="space-y-3">
          {current.options.map((opt, idx) => {
            const letter = LETTERS[idx];
            const selected = answers[current.id] === letter;
            return (
              <button
                key={letter}
                type="button"
                onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: letter }))}
                className={`w-full text-left p-4 rounded-2xl border-2 transition flex items-start gap-3 ${
                  selected
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 text-slate-700 dark:text-slate-200'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
                    selected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {letter}
                </span>
                <span className="font-medium leading-relaxed">{opt}</span>
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
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-700 dark:text-slate-200 disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" /> Anterior
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
          >
            Próxima <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={submitMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-50"
          >
            <Flag className="w-4 h-4" />
            {submitMutation.isPending ? 'Enviando...' : 'Finalizar Simulado'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizSession;
