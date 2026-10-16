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
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5D6D67] dark:text-[#9FB0A9] hover:text-[#1A3835] dark:hover:text-[#E8EFEA] transition"
        >
          &larr; Sair do Simulado
        </button>
        <QuizSession quizId={activeQuizId} onExit={() => setActiveQuizId(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D6] dark:border-[#24312B]">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-[#172622] dark:text-[#F1F5F3] tracking-tight">
            Simulados Clínicos
          </h1>
          <p className="text-[#6A7B74] dark:text-[#93A59E] text-xs md:text-sm mt-1">
            Questões cronometradas com gabarito comentado para exames de residência e revalidação.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-[#1A3835] hover:bg-[#254F4A] text-[#FAF8F5] px-5 py-2.5 rounded-xl font-medium shadow-sm transition text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Simulado</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-[#FFFFFF] dark:bg-[#18211E] rounded-xl animate-pulse border border-[#DDD6C8] dark:border-[#2A3731]"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 bg-[#FBF0EE] dark:bg-[#2A1D1A] rounded-2xl text-center border border-[#F2D0C8] dark:border-[#4B2922]">
          <p className="text-[#A13A28] dark:text-[#E27D60] font-medium text-sm">{error?.message || 'Erro ao carregar simulados'}</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-16 bg-[#FFFFFF] dark:bg-[#18211E] rounded-2xl border border-dashed border-[#DDD6C8] dark:border-[#2A3731]">
          <div className="bg-[#F4F1EA] dark:bg-[#1F2B26] w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-[#1A3835] dark:text-[#A1C5B5]">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-serif text-[#172622] dark:text-[#F1F5F3]">
            Nenhum simulado cadastrado
          </h3>
          <p className="text-[#6A7B74] dark:text-[#93A59E] mt-1 max-w-sm mx-auto text-xs leading-relaxed">
            Crie seu próprio simulado ou importe questões clínicas em arquivo .txt.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-[#FFFFFF] dark:bg-[#18211E] p-5 sm:p-6 rounded-2xl border border-[#DDD6C8] dark:border-[#2A3731] shadow-xs hover:border-[#1A3835] dark:hover:border-[#4D7B6A] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-10 h-10 bg-[#F4F1EA] dark:bg-[#202C27] rounded-xl flex items-center justify-center text-[#1A3835] dark:text-[#A1C5B5] shrink-0 border border-[#E5DFD4] dark:border-[#293630]">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-serif text-[#172622] dark:text-[#F1F5F3]">
                      {quiz.title}
                    </h3>
                    {quiz.isGlobal && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#EDF3EF] dark:bg-[#1E2E27] text-[#24503F] dark:text-[#8EBFAC] border border-[#CFDFD7] dark:border-[#2F493E]">
                        <Globe className="w-2.5 h-2.5" /> Oficial
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3.5 mt-1 text-xs text-[#6A7B74] font-mono text-[11px]">
                    <span className="text-[#1A3835] dark:text-[#A1C5B5] font-semibold uppercase">
                      {quiz.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#889892]" /> {quiz.timeLimitMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-[#889892]" /> {quiz.questionCount} questões
                    </span>
                    {quiz.bestScore !== null && (
                      <span className="flex items-center gap-1 text-[#24503F] dark:text-[#8EBFAC] font-semibold">
                        <Award className="w-3 h-3" /> Melhor nota: {quiz.bestScore}%
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
                    className="p-2 text-[#889892] hover:text-[#A13A28] rounded-lg transition"
                    title="Excluir simulado"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {quiz.locked ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FAF5E8] dark:bg-[#252216] text-[#8C6D1F] dark:text-[#DFC377] text-xs font-medium border border-[#EADBBD] dark:border-[#3D371E]">
                    <Lock className="w-3.5 h-3.5" /> Plano {quiz.plan.toUpperCase()}
                  </span>
                ) : (
                  <button
                    onClick={() => setActiveQuizId(quiz.id)}
                    className="flex items-center gap-1.5 bg-[#1A3835] hover:bg-[#254F4A] text-[#FAF8F5] px-4 py-2 rounded-lg font-medium text-xs transition"
                  >
                    <span>Iniciar Prova</span>
                    <ChevronRight className="w-3.5 h-3.5" />
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
    <div className="fixed inset-0 z-50 bg-[#121615]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] dark:bg-[#18211E] rounded-2xl max-w-xl w-full p-6 md:p-8 border border-[#DDD6C8] dark:border-[#2A3731] space-y-5 max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE2] dark:border-[#24312B]">
          <h3 className="text-xl font-serif text-[#172622] dark:text-[#F1F5F3]">
            Novo Simulado Clínico
          </h3>
          <button onClick={onClose} className="text-[#889892] hover:text-[#172622] dark:hover:text-[#F1F5F3]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#5D6D67] dark:text-[#9FB0A9]">Título do Simulado</label>
              <input
                type="text"
                required
                placeholder="Ex: Simulado Emergências Clínicas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full px-3.5 py-2.5 rounded-lg border border-[#D5CDC0] dark:border-[#2E3E37] bg-[#FAF8F5] dark:bg-[#141B18] text-sm text-[#1C2A26] dark:text-[#EAEFEA] focus:outline-none focus:border-[#1A3835]"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#5D6D67] dark:text-[#9FB0A9]">Tempo (min)</label>
              <input
                type="number"
                min={1}
                max={300}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value)}
                className="mt-1 w-full px-3.5 py-2.5 rounded-lg border border-[#D5CDC0] dark:border-[#2E3E37] bg-[#FAF8F5] dark:bg-[#141B18] text-sm text-[#1C2A26] dark:text-[#EAEFEA] focus:outline-none focus:border-[#1A3835]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#5D6D67] dark:text-[#9FB0A9]">Disciplina</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full px-3.5 py-2.5 rounded-lg border border-[#D5CDC0] dark:border-[#2E3E37] bg-[#FAF8F5] dark:bg-[#141B18] text-sm text-[#1C2A26] dark:text-[#EAEFEA] focus:outline-none focus:border-[#1A3835]"
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
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#5D6D67] dark:text-[#9FB0A9]">
                Questões (separadas por ; ou |)
              </label>
              <label className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A3835] dark:text-[#A1C5B5] cursor-pointer hover:underline">
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
              className="w-full p-3.5 rounded-lg border border-[#D5CDC0] dark:border-[#2E3E37] bg-[#FAF8F5] dark:bg-[#141B18] font-mono text-xs text-[#1C2A26] dark:text-[#EAEFEA] focus:outline-none focus:border-[#1A3835]"
            />
            <p className="text-xs text-[#6A7B74] mt-1 font-mono text-[11px]">
              <strong>{parsed.items.length}</strong> questão(ões) válida(s)
              {parsed.errors.length > 0 && (
                <span className="text-[#C47253] ml-2">
                  • {parsed.errors.length} linha(s) com erro
                </span>
              )}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[#FBF0EE] dark:bg-[#2A1D1A] text-[#A13A28] dark:text-[#E27D60] text-xs font-medium border border-[#F2D0C8] dark:border-[#4B2922]">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-xs text-[#5D6D67] dark:text-[#9FB0A9] hover:bg-[#F4F1EA] dark:hover:bg-[#202C27] transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 rounded-lg bg-[#1A3835] hover:bg-[#254F4A] text-[#FAF8F5] font-medium text-xs transition disabled:opacity-50"
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
