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
  UserCheck,
  Send,
  X,
  Layers,
  Sparkles,
  BookOpen,
  Filter,
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
  useAssignDeckToStudent,
  useAssignQuizToStudent,
} from '../../hooks/useQuizzesAndStats';
import api from '../../utils/api';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('flashcards');
  const [results, setResults] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [plan, setPlan] = useState('free');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [targetScope, setTargetScope] = useState('global'); // 'global' | 'student'
  const [targetStudentId, setTargetStudentId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [feedback, setFeedback] = useState('');

  // Modal de Atribuição Direta
  const [assignModal, setAssignModal] = useState(null); // { user, type: 'deck'|'quiz', selectedId: '' }

  const { data: summary } = useAdminSummary();
  const { data: decks = [] } = useDecks('all');
  const { data: quizzes = [] } = useQuizzes('all');
  const { data: users = [], isLoading: usersLoading } = useAdminUsers();

  const createDeckMutation = useCreateDeck();
  const deleteDeckMutation = useDeleteDeck();
  const createQuizMutation = useCreateQuiz();
  const deleteQuizMutation = useDeleteQuiz();
  const updateUserMutation = useUpdateAdminUser();
  const assignDeckMutation = useAssignDeckToStudent();
  const assignQuizMutation = useAssignQuizToStudent();

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

    const isGlobal = targetScope === 'global';
    const chosenStudentId = targetScope === 'student' ? targetStudentId : undefined;

    if (targetScope === 'student' && !chosenStudentId) {
      setFeedback('Selecione um aluno para atribuir o conteúdo.');
      return;
    }

    try {
      if (activeTab === 'flashcards') {
        await createDeckMutation.mutateAsync({
          name: title.trim(),
          category,
          plan: isGlobal ? plan : 'free',
          isGlobal,
          targetUserId: chosenStudentId,
          cards: results.items,
        });
        const targetDesc = isGlobal
          ? `para o plano ${plan.toUpperCase()}`
          : `atribuído diretamente ao aluno`;
        setFeedback(`Baralho "${title}" com ${results.items.length} cards publicado com sucesso (${targetDesc})!`);
      } else {
        await createQuizMutation.mutateAsync({
          title: title.trim(),
          category,
          plan: isGlobal ? plan : 'free',
          isGlobal,
          targetUserId: chosenStudentId,
          timeLimitMinutes: Number(timeLimitMinutes) || 30,
          questions: results.items,
        });
        const targetDesc = isGlobal
          ? `para o plano ${plan.toUpperCase()}`
          : `atribuído diretamente ao aluno`;
        setFeedback(`Simulado "${title}" com ${results.items.length} questões publicado com sucesso (${targetDesc})!`);
      }
      setResults(null);
      setTitle('');
    } catch (err) {
      setFeedback(`Erro ao publicar: ${err.message}`);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!assignModal || !assignModal.selectedId) {
      alert('Selecione um conteúdo para atribuir.');
      return;
    }

    try {
      if (assignModal.type === 'deck') {
        await assignDeckMutation.mutateAsync({
          deckId: assignModal.selectedId,
          targetUserId: assignModal.user.id,
        });
        setFeedback(`Baralho atribuído com sucesso a ${assignModal.user.name || assignModal.user.email}!`);
      } else {
        await assignQuizMutation.mutateAsync({
          quizId: assignModal.selectedId,
          targetUserId: assignModal.user.id,
        });
        setFeedback(`Simulado atribuído com sucesso a ${assignModal.user.name || assignModal.user.email}!`);
      }
      setAssignModal(null);
    } catch (err) {
      setFeedback(`Erro na atribuição: ${err.message}`);
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

  const studentsList = users.filter((u) => u.role !== 'admin' || users.length <= 1);

  const tabs = [
    { id: 'flashcards', label: 'Baralhos & Flashcards', icon: Brain },
    { id: 'quizzes', label: 'Simulados Clínicos', icon: ClipboardList },
    { id: 'users', label: 'Alunos & Planos', icon: Users },
  ];

  return (
    <div className="space-y-8">
      {/* Cabeçalho Editorial */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-5 border-b border-[#E8E2D6] dark:border-[#24312B]">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#527063] dark:text-[#8EBFAC]">
            Coordenação Acadêmica
          </span>
          <h1 className="text-2xl md:text-3xl font-serif text-[#172622] dark:text-[#F1F5F3] tracking-tight mt-1">
            Gestão & Atribuição de Conteúdo
          </h1>
          <p className="text-[#6A7B74] dark:text-[#93A59E] text-xs md:text-sm mt-1">
            Suba baralhos e simulados (.txt), distribua para turmas inteiras ou atribua diretamente a alunos específicos.
          </p>
        </div>

        <div className="flex p-1 bg-[#FAF8F5] dark:bg-[#141B18] rounded-xl border border-[#DDD6C8] dark:border-[#2A3731]">
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-[#1A3835] text-[#FAF8F5] shadow-xs'
                    : 'text-[#5D6D67] hover:text-[#172622] dark:text-[#93A59E]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-[#EDF3EF] dark:bg-[#1A2822] border border-[#CFDFD7] dark:border-[#2F493E] text-[#1E4335] dark:text-[#9ECBB9] text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-[#2C6B53]" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback('')} className="text-[#6B7B75] hover:text-[#172622]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {(activeTab === 'flashcards' || activeTab === 'quizzes') && (
            <>
              {/* Formulário de Importação & Atribuição */}
              <div className="bg-[#FFFFFF] dark:bg-[#18211E] rounded-2xl p-6 md:p-8 border border-[#DDD6C8] dark:border-[#2A3731] shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-[#F0EBE0] dark:border-[#222E28] pb-4">
                  <div>
                    <h3 className="text-lg font-serif text-[#172622] dark:text-[#F1F5F3]">
                      Upload de {activeTab === 'flashcards' ? 'Flashcards Clínicos' : 'Simulado'} (.txt)
                    </h3>
                    <p className="text-xs text-[#6A7B74] mt-0.5">
                      {activeTab === 'flashcards'
                        ? 'Formato: Pergunta | Resposta | Explicação (uma por linha)'
                        : 'Formato: Pergunta; A; B; C; D; Gabarito; Explicação'}
                    </p>
                  </div>
                  <span className="bg-[#EDF3EF] dark:bg-[#1E2E27] text-[#245441] dark:text-[#8EBFAC] px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold border border-[#CFDFD7] dark:border-[#2F493E]">
                    Importação Direta
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Seletor de Arquivo */}
                  <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-[#DDD6C8] dark:border-[#2A3731] rounded-2xl cursor-pointer hover:border-[#1A3835] dark:hover:border-[#8EBFAC] transition p-6 text-center bg-[#FAF8F5]/60 dark:bg-[#141B18]/50">
                    <Upload className="w-8 h-8 text-[#527063] mb-3" />
                    <p className="text-xs font-semibold text-[#172622] dark:text-[#F1F5F3]">
                      Arraste ou clique para selecionar arquivo .txt
                    </p>
                    <p className="text-[11px] text-[#6A7B74] mt-1">
                      {activeTab === 'flashcards' ? 'Cards no padrão MedFocus' : 'Questões de múltipla escolha'}
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".txt"
                      onChange={(e) => handleFileUpload(e, activeTab)}
                    />
                  </label>

                  {/* Metadados e Destinatário */}
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6A7B74]">
                        Título do Conteúdo
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={activeTab === 'flashcards' ? 'Ex: Cardiologia — ECG & Arritmias' : 'Ex: Simulado ENARE — Prova 2024'}
                        className="mt-1 w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#141B18] border border-[#DDD6C8] dark:border-[#2A3731] rounded-xl text-xs font-medium dark:text-white focus:outline-none focus:border-[#1A3835]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6A7B74]">
                          Especialidade
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="mt-1 w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#141B18] border border-[#DDD6C8] dark:border-[#2A3731] rounded-xl text-xs font-medium dark:text-white"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {activeTab === 'quizzes' && (
                        <div>
                          <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6A7B74]">
                            Tempo (Minutos)
                          </label>
                          <input
                            type="number"
                            min={5}
                            max={300}
                            value={timeLimitMinutes}
                            onChange={(e) => setTimeLimitMinutes(e.target.value)}
                            className="mt-1 w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#141B18] border border-[#DDD6C8] dark:border-[#2A3731] rounded-xl text-xs font-medium dark:text-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* Atribuição: Todos por Plano OU Aluno Específico */}
                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141B18] border border-[#DDD6C8] dark:border-[#2A3731] space-y-2.5">
                      <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6A7B74] block">
                        Destino da Atribuição
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setTargetScope('global')}
                          className={`py-1.5 px-2.5 rounded-lg border text-center transition font-medium ${
                            targetScope === 'global'
                              ? 'bg-[#1A3835] text-[#FAF8F5] border-[#1A3835]'
                              : 'bg-white dark:bg-[#1B2420] text-[#556760] border-[#DDD6C8] dark:border-[#2A3731]'
                          }`}
                        >
                          Por Plano (Geral)
                        </button>
                        <button
                          type="button"
                          onClick={() => setTargetScope('student')}
                          className={`py-1.5 px-2.5 rounded-lg border text-center transition font-medium ${
                            targetScope === 'student'
                              ? 'bg-[#1A3835] text-[#FAF8F5] border-[#1A3835]'
                              : 'bg-white dark:bg-[#1B2420] text-[#556760] border-[#DDD6C8] dark:border-[#2A3731]'
                          }`}
                        >
                          Aluno Específico
                        </button>
                      </div>

                      {targetScope === 'global' ? (
                        <div>
                          <label className="text-[10px] text-[#6A7B74] font-medium block mb-1">
                            Disponível a partir de qual plano?
                          </label>
                          <select
                            value={plan}
                            onChange={(e) => setPlan(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-[#1B2420] border border-[#DDD6C8] dark:border-[#2A3731] rounded-lg text-xs font-medium dark:text-white"
                          >
                            <option value="free">Gratuito (Todos os Alunos)</option>
                            <option value="basic">Plano Básico & Superior</option>
                            <option value="premium">Exclusivo Premium</option>
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="text-[10px] text-[#6A7B74] font-medium block mb-1">
                            Selecione o Aluno:
                          </label>
                          <select
                            value={targetStudentId}
                            onChange={(e) => setTargetStudentId(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-[#1B2420] border border-[#DDD6C8] dark:border-[#2A3731] rounded-lg text-xs font-medium dark:text-white"
                          >
                            <option value="">Selecione um aluno da lista...</option>
                            {studentsList.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name || 'Sem nome'} ({s.email}) — Plano {s.plan?.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview e Confirmação de Upload */}
                {results && (
                  <div className="bg-[#FAF8F5] dark:bg-[#141B18] rounded-xl p-5 border border-[#DDD6C8] dark:border-[#2A3731] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#2C6B53]" />
                        <h4 className="font-serif text-[#172622] dark:text-[#F1F5F3] text-sm">
                          Arquivo Analisado com Sucesso
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-2.5 py-0.5 bg-[#EDF3EF] dark:bg-[#1E2E27] text-[#245441] dark:text-[#8EBFAC] text-[11px] font-mono rounded-md border border-[#CFDFD7] dark:border-[#2F493E]">
                          {results.items.length} itens válidos
                        </span>
                        {results.errors?.length > 0 && (
                          <span className="px-2.5 py-0.5 bg-[#FDF0EC] text-[#9E3E24] text-[11px] font-mono rounded-md border border-[#F4D3C9]">
                            {results.errors.length} erros ignorados
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                      {results.items.slice(0, 4).map((item, i) => (
                        <div
                          key={i}
                          className="p-3 bg-white dark:bg-[#1A2320] rounded-lg border border-[#E8E2D6] dark:border-[#24312B] text-xs space-y-1"
                        >
                          <p className="font-semibold text-[#172622] dark:text-[#F1F5F3]">
                            {item.question}
                          </p>
                          <p className="text-[#6A7B74] text-[11px]">
                            {item.answer ? `R: ${item.answer}` : `Gabarito: Letra ${item.correct}`}
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
                      className="w-full bg-[#1A3835] hover:bg-[#234844] text-[#FAF8F5] font-semibold py-3 rounded-xl transition text-xs shadow-xs disabled:opacity-50"
                    >
                      {createDeckMutation.isPending || createQuizMutation.isPending
                        ? 'Publicando...'
                        : `Confirmar e Atribuir ${results.items.length} itens`}
                    </button>
                  </div>
                )}
              </div>

              {/* Lista de conteúdos cadastrados */}
              <div className="bg-[#FFFFFF] dark:bg-[#18211E] rounded-2xl p-6 border border-[#DDD6C8] dark:border-[#2A3731] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0] dark:border-[#222E28]">
                  <h4 className="font-serif text-[#172622] dark:text-[#F1F5F3] text-sm">
                    {activeTab === 'flashcards'
                      ? `Baralhos Ativos na Plataforma (${decks.length})`
                      : `Simulados Cadastrados (${quizzes.length})`}
                  </h4>
                  <span className="text-[11px] font-mono text-[#6A7B74]">
                    Total sincronizado no servidor
                  </span>
                </div>

                <div className="divide-y divide-[#F0EBE0] dark:divide-[#24312B] max-h-80 overflow-y-auto">
                  {(activeTab === 'flashcards' ? decks : quizzes).map((item) => {
                    const id = item.deckId || item.id;
                    const name = item.name || item.title;
                    const count = item.totalCards ?? item.questionCount ?? (item.cards?.length || item.questions?.length || 0);
                    const isGlobalDeck = item.isGlobal !== false;

                    return (
                      <div key={id} className="py-3 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-[#172622] dark:text-[#F1F5F3]">
                            {name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-[#6A7B74]">
                            <span>{item.category}</span>
                            <span>•</span>
                            <span className="font-mono">
                              {isGlobalDeck ? `Geral (${item.plan?.toUpperCase()})` : 'Atribuído / Aluno'}
                            </span>
                            <span>•</span>
                            <span>{count} itens</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (window.confirm(`Excluir "${name}" permanentemente?`)) {
                              if (activeTab === 'flashcards') deleteDeckMutation.mutate(id);
                              else deleteQuizMutation.mutate(id);
                            }
                          }}
                          className="p-2 text-[#8A9A93] hover:text-[#C47253] transition"
                          title="Excluir conteúdo"
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

          {/* Tab Usuários & Atribuição Personalizada */}
          {activeTab === 'users' && (
            <div className="bg-[#FFFFFF] dark:bg-[#18211E] rounded-2xl border border-[#DDD6C8] dark:border-[#2A3731] shadow-xs overflow-hidden">
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0EBE0] dark:border-[#222E28]">
                <div>
                  <h3 className="text-lg font-serif text-[#172622] dark:text-[#F1F5F3]">
                    Alunos & Atribuições Individuais ({users.length})
                  </h3>
                  <p className="text-xs text-[#6A7B74] mt-0.5">
                    Modifique planos, bloqueie acessos ou atribua baralhos clínicos específicos a cada aluno.
                  </p>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#8A9A93] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar aluno por nome ou e-mail..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-xl border border-[#DDD6C8] dark:border-[#2A3731] bg-[#FAF8F5] dark:bg-[#141B18] text-xs font-medium dark:text-white focus:outline-none focus:border-[#1A3835]"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#FAF8F5] dark:bg-[#141B18] text-[10px] font-mono font-semibold text-[#6A7B74] uppercase border-b border-[#E8E2D6] dark:border-[#24312B]">
                    <tr>
                      <th className="px-6 py-3.5">Aluno</th>
                      <th className="px-4 py-3.5">Plano de Estudo</th>
                      <th className="px-4 py-3.5">Papel</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Atribuição Rápida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE0] dark:divide-[#24312B] text-xs">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-[#6A7B74]">
                          Carregando cadastro de alunos...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-[#6A7B74]">
                          Nenhum aluno localizado para "{userSearch}".
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[#FAF8F5]/60 dark:hover:bg-[#141B18]/40 transition">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-[#172622] dark:text-[#F1F5F3]">
                              {u.name || 'Sem nome cadastrado'}
                            </div>
                            <div className="text-[11px] text-[#6A7B74] font-mono">{u.email}</div>
                          </td>
                          <td className="px-4 py-4">
                            <select
                              value={u.plan}
                              onChange={(e) =>
                                updateUserMutation.mutate({ id: u.id, plan: e.target.value })
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-[#DDD6C8] dark:border-[#2A3731] bg-white dark:bg-[#141B18] text-xs font-medium dark:text-white"
                            >
                              <option value="free">Gratuito</option>
                              <option value="basic">Básico</option>
                              <option value="premium">Premium</option>
                            </select>
                          </td>
                          <td className="px-4 py-4">
                            <select
                              value={u.role}
                              onChange={(e) =>
                                updateUserMutation.mutate({ id: u.id, role: e.target.value })
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-[#DDD6C8] dark:border-[#2A3731] bg-white dark:bg-[#141B18] text-xs font-medium dark:text-white"
                            >
                              <option value="student">Aluno</option>
                              <option value="admin">Coordenação / Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() =>
                                updateUserMutation.mutate({ id: u.id, isActive: !u.isActive })
                              }
                              className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold ${
                                u.isActive
                                  ? 'bg-[#EDF3EF] text-[#245441] dark:bg-[#1E2E27] dark:text-[#8EBFAC]'
                                  : 'bg-[#FDF0EC] text-[#9E3E24] dark:bg-[#2C1C18] dark:text-[#F1A28F]'
                              }`}
                            >
                              {u.isActive ? 'Ativo' : 'Bloqueado'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() =>
                                setAssignModal({
                                  user: u,
                                  type: 'deck',
                                  selectedId: decks[0]?.deckId || decks[0]?.id || '',
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#141B18] border border-[#DDD6C8] dark:border-[#2A3731] hover:border-[#1A3835] text-[#1A3835] dark:text-[#8EBFAC] font-medium text-xs transition"
                            >
                              <Send className="w-3 h-3 text-[#527063]" />
                              <span>Atribuir Conteúdo</span>
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

        {/* Sidebar com Métricas Reais & Ferramentas */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#1A3835] rounded-2xl p-6 text-[#FAF8F5] border border-[#254F4A] shadow-xs">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2D5852]">
              <div className="bg-[#254F4A] p-2 rounded-xl text-[#A1C5B5]">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-serif">Métricas da Plataforma</h3>
                <p className="text-[11px] text-[#A1C5B5] mt-0.5">Visão consolidada do banco</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <MetricRow label="Alunos Cadastrados" value={summary?.users ?? users.length} />
              <MetricRow label="Baralhos Clínicos" value={summary?.decks ?? decks.length} />
              <MetricRow label="Simulados Cadastrados" value={summary?.quizzes ?? quizzes.length} />
              <MetricRow label="Revisões com SM-2" value={summary?.reviews ?? 0} />
              <MetricRow label="Provas Submetidas" value={summary?.quizAttempts ?? 0} />
            </div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#18211E] rounded-2xl p-6 border border-[#DDD6C8] dark:border-[#2A3731] shadow-xs space-y-4">
            <div>
              <h4 className="font-serif text-[#172622] dark:text-[#F1F5F3] text-sm">
                Backup de Dados
              </h4>
              <p className="text-xs text-[#6A7B74] mt-1">
                Gera cópia completa de alunos, decks e simulados em JSON estruturado.
              </p>
            </div>
            <button
              onClick={handleExportBackup}
              className="w-full flex items-center justify-between p-3.5 bg-[#FAF8F5] dark:bg-[#141B18] border border-[#DDD6C8] dark:border-[#2A3731] rounded-xl hover:bg-[#F4F1EA] transition text-xs font-semibold text-[#172622] dark:text-[#F1F5F3]"
            >
              <span>Exportar Base Completa</span>
              <Download className="w-4 h-4 text-[#1A3835] dark:text-[#A1C5B5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Atribuição Direta para Aluno */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#18211E] border border-[#DDD6C8] dark:border-[#2A3731] rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#F0EBE0] dark:border-[#24312B] pb-4">
              <div>
                <h3 className="text-base font-serif text-[#172622] dark:text-[#F1F5F3]">
                  Atribuir Conteúdo ao Aluno
                </h3>
                <p className="text-xs text-[#6A7B74] mt-0.5">
                  Destinatário: <strong className="text-[#172622] dark:text-[#F1F5F3]">{assignModal.user.name || assignModal.user.email}</strong>
                </p>
              </div>
              <button
                onClick={() => setAssignModal(null)}
                className="p-1 rounded-lg text-[#6A7B74] hover:text-[#172622]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6A7B74] block mb-1">
                  Tipo de Material
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setAssignModal({
                        ...assignModal,
                        type: 'deck',
                        selectedId: decks[0]?.deckId || decks[0]?.id || '',
                      })
                    }
                    className={`py-2 px-3 rounded-lg border font-medium text-center transition ${
                      assignModal.type === 'deck'
                        ? 'bg-[#1A3835] text-[#FAF8F5] border-[#1A3835]'
                        : 'bg-[#FAF8F5] dark:bg-[#141B18] text-[#556760] border-[#DDD6C8] dark:border-[#2A3731]'
                    }`}
                  >
                    Baralho de Flashcards
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAssignModal({
                        ...assignModal,
                        type: 'quiz',
                        selectedId: quizzes[0]?.id || '',
                      })
                    }
                    className={`py-2 px-3 rounded-lg border font-medium text-center transition ${
                      assignModal.type === 'quiz'
                        ? 'bg-[#1A3835] text-[#FAF8F5] border-[#1A3835]'
                        : 'bg-[#FAF8F5] dark:bg-[#141B18] text-[#556760] border-[#DDD6C8] dark:border-[#2A3731]'
                    }`}
                  >
                    Simulado Clínico
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#6A7B74] block mb-1">
                  Selecione o {assignModal.type === 'deck' ? 'Baralho' : 'Simulado'}
                </label>
                <select
                  value={assignModal.selectedId}
                  onChange={(e) => setAssignModal({ ...assignModal, selectedId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD6C8] dark:border-[#2A3731] bg-[#FAF8F5] dark:bg-[#141B18] text-xs font-medium dark:text-white"
                >
                  {assignModal.type === 'deck'
                    ? decks.map((d) => (
                        <option key={d.deckId || d.id} value={d.deckId || d.id}>
                          {d.name} ({d.category} • {d.totalCards ?? d.cards?.length ?? 0} cards)
                        </option>
                      ))
                    : quizzes.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.title} ({q.category} • {q.questionCount ?? q.questions?.length ?? 0} questões)
                        </option>
                      ))}
                </select>
                <p className="text-[11px] text-[#6A7B74] mt-1.5">
                  O conteúdo será duplicado na conta do aluno com repetição espaçada SM-2 independente.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0EBE0] dark:border-[#24312B]">
              <button
                type="button"
                onClick={() => setAssignModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6A7B74] hover:text-[#172622] transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignment}
                disabled={assignDeckMutation.isPending || assignQuizMutation.isPending}
                className="px-5 py-2 rounded-xl bg-[#1A3835] hover:bg-[#234844] text-[#FAF8F5] text-xs font-semibold transition disabled:opacity-50"
              >
                {assignDeckMutation.isPending || assignQuizMutation.isPending
                  ? 'Atribuindo...'
                  : 'Confirmar Atribuição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="opacity-80 font-medium">{label}</span>
    <span className="text-lg font-mono font-bold">{value}</span>
  </div>
);

export default Admin;
