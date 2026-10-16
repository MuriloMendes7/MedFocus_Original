import React, { useState } from 'react';
import {
  Clock,
  HelpCircle,
  ChevronRight,
  Plus,
  Trash2,
  Lock,
  Award,
  Upload,
  X,
  Globe,
} from 'lucide-react';
import {
  useQuizzes,
  useCreateQuiz,
  useDeleteQuiz,
} from '../../hooks/useQuizzesAndStats';
import { CATEGORIES, parseQuizTxt } from '../../utils/parsers';
import QuizSession from '../../components/QuizSession';

const Quizzes = () => {
  const { data: quizzes = [], isLoading, isError, error } = useQuizzes();
  const createQuizMutation = useCreateQuiz();
  const deleteQuizMutation = useDeleteQuiz();

  const [activeQuizId, setActiveQuizId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (activeQuizId) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setActiveQuizId(null)}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600"
        >
          &larr; Sair do Simulado
        </button>
        <QuizSession quizId={activeQuizId} onExit={() => setActiveQuizId(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Simulados Disponíveis
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Teste seus conhecimentos com questões cronometradas e gabarito comentado.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Simulado</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 bg-red-50 dark:bg-red-950/30 rounded-3xl text-center">
          <p className="text-red-600 font-bold">{error?.message || 'Erro ao carregar simulados'}</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="bg-blue-50 dark:bg-blue-950/50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Nenhum simulado cadastrado
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto text-sm">
            Crie seu próprio simulado ou importe questões em arquivo .txt.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-5">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {quiz.title}
                    </h3>
                    {quiz.isGlobal && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300">
                        <Globe className="w-3 h-3" /> Oficial
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-slate-500 font-semibold">
                    <span className="text-blue-600 dark:text-blue-400 font-bold uppercase">
                      {quiz.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {quiz.timeLimitMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" /> {quiz.questionCount} questões
                    </span>
                    {quiz.bestScore !== null && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Award className="w-3.5 h-3.5" /> Melhor nota: {quiz.bestScore}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {quiz.canEdit && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Excluir o simulado "${quiz.title}"?`)) {
                        deleteQuizMutation.mutate(quiz.id);
                      }
                    }}
                    className="p-2.5 text-slate-400 hover:text-red-500 rounded-xl"
                    title="Excluir simulado"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {quiz.locked ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold">
                    <Lock className="w-4 h-4" /> Plano {quiz.plan.toUpperCase()}
                  </span>
                ) : (
                  <button
                    onClick={() => setActiveQuizId(quiz.id)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition"
                  >
                    <span>Iniciar</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateQuizModal
          onClose={() => setShowCreateModal(false)}
          createMutation={createQuizMutation}
        />
      )}
    </div>
  );
};

const CreateQuizModal = ({ onClose, createMutation }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [rawQuestions, setRawQuestions] = useState('');
  const [error, setError] = useState('');

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawQuestions(String(ev.target?.result || ''));
      if (!title) setTitle(file.name.replace(/\.txt$/i, ''));
    };
    reader.readAsText(file);
  };

  const parsed = parseQuizTxt(rawQuestions);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (parsed.items.length === 0) {
      setError(
        'Adicione pelo menos 1 questão válida (Pergunta; Opção A; Opção B; Opção C; Opção D; Letra; Explicação).',
      );
      return;
    }
    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        category,
        timeLimitMinutes: Number(timeLimitMinutes) || 30,
        questions: parsed.items,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao criar simulado.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 md:p-8 border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Novo Simulado
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Título</label>
              <input
                type="text"
                required
                placeholder="Ex: Simulado Clínica Médica"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Tempo (min)</label>
              <input
                type="number"
                min={1}
                max={300}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Disciplina</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold dark:text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Questões (separadas por ; ou |)
              </label>
              <label className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 cursor-pointer hover:underline">
                <Upload className="w-3.5 h-3.5" /> Importar .txt
                <input type="file" accept=".txt" className="hidden" onChange={handleFile} />
              </label>
            </div>
            <textarea
              rows={6}
              value={rawQuestions}
              onChange={(e) => setRawQuestions(e.target.value)}
              placeholder={
                'Qual o antidoto para intoxicacao por benzodiazepinicos?; Naloxona; Flumazenil; Atropina; N-acetilcisteina; B; O flumazenil e antagonista competitivo dos receptores GABA-A.'
              }
              className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs dark:text-white"
            />
            <p className="text-xs text-slate-500 mt-1">
              <strong>{parsed.items.length}</strong> questão(ões) válida(s)
              {parsed.errors.length > 0 && (
                <span className="text-amber-600 ml-2">
                  • {parsed.errors.length} linha(s) com erro
                </span>
              )}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 text-xs font-bold">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm disabled:opacity-50"
            >
              {createMutation.isPending ? 'Salvando...' : 'Criar Simulado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Quizzes;
