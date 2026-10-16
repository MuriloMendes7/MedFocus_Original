import React, { useState } from 'react';
import {
  Upload,
  CheckCircle,
  Download,
  Trash2,
  Database,
  Users,
  Brain,
  ClipboardList,
  Search,
} from 'lucide-react';
import { CATEGORIES, parseFlashcardTxt, parseQuizTxt } from '../../utils/parsers';
import { useDecks, useCreateDeck, useDeleteDeck } from '../../hooks/useDecks';
import {
  useQuizzes,
  useCreateQuiz,
  useDeleteQuiz,
  useAdminSummary,
  useAdminUsers,
  useUpdateAdminUser,
} from '../../hooks/useQuizzesAndStats';
import api from '../../utils/api';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('flashcards');
  const [results, setResults] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [plan, setPlan] = useState('free');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [userSearch, setUserSearch] = useState('');
  const [feedback, setFeedback] = useState('');

  const { data: summary } = useAdminSummary();
  const { data: decks = [] } = useDecks('all');
  const { data: quizzes = [] } = useQuizzes('all');
  const { data: users = [], isLoading: usersLoading } = useAdminUsers();

  const createDeckMutation = useCreateDeck();
  const deleteDeckMutation = useDeleteDeck();
  const createQuizMutation = useCreateQuiz();
  const deleteQuizMutation = useDeleteQuiz();
  const updateUserMutation = useUpdateAdminUser();

  const handleFileUpload = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      const parsed = type === 'flashcards' ? parseFlashcardTxt(content) : parseQuizTxt(content);
      setResults(parsed);
      if (!title) setTitle(file.name.replace(/\.txt$/i, ''));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!results || !title.trim() || results.items.length === 0) return;
    setFeedback('');

    try {
      if (activeTab === 'flashcards') {
        await createDeckMutation.mutateAsync({
          name: title.trim(),
          category,
          plan,
          isGlobal: true,
          cards: results.items,
        });
        setFeedback(`Deck oficial "${title}" publicado com ${results.items.length} cards!`);
      } else {
        await createQuizMutation.mutateAsync({
          title: title.trim(),
          category,
          plan,
          isGlobal: true,
          timeLimitMinutes: Number(timeLimitMinutes) || 30,
          questions: results.items,
        });
        setFeedback(`Simulado oficial "${title}" publicado com ${results.items.length} questões!`);
      }
      setResults(null);
      setTitle('');
    } catch (err) {
      setFeedback(`Erro: ${err.message}`);
    }
  };

  const handleExportBackup = async () => {
    try {
      const { data } = await api.get('/admin/export');
      const blob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medfocus-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Erro ao exportar backup.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.plan?.toLowerCase().includes(q)
    );
  });

  const tabs = [
    { id: 'flashcards', label: 'Flashcards Oficiais', icon: Brain },
    { id: 'quizzes', label: 'Simulados Oficiais', icon: ClipboardList },
    { id: 'users', label: 'Usuários e Planos', icon: Users },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Painel Administrativo
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Publique decks e simulados oficiais e gerencie os planos dos alunos.
          </p>
        </div>

        <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setResults(null);
                  setFeedback('');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-200 text-sm font-bold">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {(activeTab === 'flashcards' || activeTab === 'quizzes') && (
            <>
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    Upload de {activeTab === 'flashcards' ? 'Flashcards' : 'Simulado'} (.txt)
                  </h3>
                  <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase">
                    Conteúdo Oficial
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex flex-col items-center justify-center w-full h-52 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl cursor-pointer hover:border-blue-500 transition p-6 text-center">
                    <Upload className="w-8 h-8 text-blue-500 mb-3" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Selecionar arquivo .txt
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {activeTab === 'flashcards'
                        ? 'Formato: Pergunta | Resposta | Explicação'
                        : 'Formato: Pergunta; A; B; C; D; Letra; Explicação'}
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".txt"
                      onChange={(e) => handleFileUpload(e, activeTab)}
                    />
                  </label>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">Título</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Cardiologia — Insuficiência Cardíaca"
                        className="mt-1 w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">
                          Disciplina
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="mt-1 w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">
                          Plano Mínimo
                        </label>
                        <select
                          value={plan}
                          onChange={(e) => setPlan(e.target.value)}
                          className="mt-1 w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                        >
                          <option value="free">Gratuito</option>
                          <option value="basic">Básico</option>
                          <option value="premium">Premium</option>
                        </select>
                      </div>
                    </div>
                    {activeTab === 'quizzes' && (
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">
                          Tempo Limite (minutos)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={300}
                          value={timeLimitMinutes}
                          onChange={(e) => setTimeLimitMinutes(e.target.value)}
                          className="mt-1 w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {results && (
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                          Preview da Importação
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full">
                          {results.items.length} válidos
                        </span>
                        {results.errors.length > 0 && (
                          <span className="px-3 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-full">
                            {results.errors.length} erros
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {results.items.slice(0, 5).map((item, i) => (
                        <div
                          key={i}
                          className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                        >
                          <p className="font-bold text-slate-900 dark:text-white">
                            {item.question}
                          </p>
                          <p className="text-slate-500 mt-0.5">
                            {item.answer || `Gabarito: ${item.correct}`}
                          </p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleImport}
                      disabled={
                        results.items.length === 0 ||
                        createDeckMutation.isPending ||
                        createQuizMutation.isPending
                      }
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 text-sm"
                    >
                      Publicar {results.items.length} itens
                    </button>
                  </div>
                )}
              </div>

              {/* Lista de conteúdos publicados */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-extrabold text-slate-900 dark:text-white">
                  {activeTab === 'flashcards'
                    ? `Decks Cadastrados (${decks.length})`
                    : `Simulados Cadastrados (${quizzes.length})`}
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                  {(activeTab === 'flashcards' ? decks : quizzes).map((item) => {
                    const id = item.deckId || item.id;
                    const name = item.name || item.title;
                    const count = item.totalCards ?? item.questionCount ?? 0;
                    return (
                      <div key={id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.category} • Plano {item.plan?.toUpperCase()} • {count} itens
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm(`Excluir "${name}"?`)) {
                              if (activeTab === 'flashcards') deleteDeckMutation.mutate(id);
                              else deleteQuizMutation.mutate(id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Gestão de Usuários ({users.length})
                </h3>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold dark:text-white"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase">
                    <tr>
                      <th className="px-6 py-4">Aluno</th>
                      <th className="px-6 py-4">Plano</th>
                      <th className="px-6 py-4">Papel</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                          Carregando usuários...
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id}>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {u.name || 'Sem nome'}
                            </div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={u.plan}
                              onChange={(e) =>
                                updateUserMutation.mutate({ id: u.id, plan: e.target.value })
                              }
                              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold dark:text-white"
                            >
                              <option value="free">Gratuito</option>
                              <option value="basic">Básico</option>
                              <option value="premium">Premium</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={u.role}
                              onChange={(e) =>
                                updateUserMutation.mutate({ id: u.id, role: e.target.value })
                              }
                              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold dark:text-white"
                            >
                              <option value="student">Aluno</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() =>
                                updateUserMutation.mutate({ id: u.id, isActive: !u.isActive })
                              }
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                u.isActive
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              }`}
                            >
                              {u.isActive ? 'Ativo' : 'Bloqueado'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 dark:bg-blue-600 rounded-3xl p-7 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/10 p-3 rounded-2xl">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold">Resumo da Plataforma</h3>
            </div>

            <div className="space-y-4 text-sm">
              <MetricRow label="Usuários" value={summary?.users ?? users.length} />
              <MetricRow label="Decks" value={summary?.decks ?? decks.length} />
              <MetricRow label="Simulados" value={summary?.quizzes ?? quizzes.length} />
              <MetricRow label="Revisões feitas" value={summary?.reviews ?? 0} />
              <MetricRow label="Simulados entregues" value={summary?.quizAttempts ?? 0} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
              Backup de Dados
            </h4>
            <button
              onClick={handleExportBackup}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-blue-50 dark:hover:bg-slate-700 transition text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              <span>Exportar JSON completo</span>
              <Download className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="opacity-75 font-semibold">{label}</span>
    <span className="text-xl font-black">{value}</span>
  </div>
);

export default Admin;
