import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Brain,
  Plus,
  Play,
  Trash2,
  BookOpen,
  Clock,
  Lock,
  Upload,
  X,
  Globe,
} from 'lucide-react';
import { useDecks, useCreateDeck, useDeleteDeck } from '../../hooks/useDecks';
import { CATEGORIES, parseFlashcardTxt } from '../../utils/parsers';
import StudySession from '../../components/StudySession';

const Flashcards = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: decks = [], isLoading, isError, error } = useDecks();
  const createDeckMutation = useCreateDeck();
  const deleteDeckMutation = useDeleteDeck();

  const [selectedDeck, setSelectedDeck] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const studyParam = searchParams.get('study');
  useEffect(() => {
    if (studyParam && decks.length > 0 && !selectedDeck) {
      const found = decks.find((d) => d.deckId === studyParam && !d.locked);
      if (found) setSelectedDeck(found);
    }
  }, [studyParam, decks, selectedDeck]);

  const closeStudy = () => {
    setSelectedDeck(null);
    if (searchParams.has('study')) {
      searchParams.delete('study');
      setSearchParams(searchParams, { replace: true });
    }
  };

  if (selectedDeck) {
    return (
      <div className="space-y-6">
        <button
          onClick={closeStudy}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600"
        >
          &larr; Voltar para Decks
        </button>
        <StudySession deck={selectedDeck} onFinish={closeStudy} />
      </div>
    );
  }

  const categories = ['Todas', ...new Set(decks.map((d) => d.category || 'Geral'))];
  const filteredDecks =
    categoryFilter === 'Todas'
      ? decks
      : decks.filter((d) => (d.category || 'Geral') === categoryFilter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Seus Flashcards
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gerencie seus baralhos e estude com repetição espaçada (SM-2).
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Deck</span>
        </button>
      </div>

      {categories.length > 2 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-white dark:bg-slate-900 rounded-3xl animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16 bg-red-50 dark:bg-red-950/30 rounded-3xl border border-red-200 dark:border-red-900/40">
          <p className="text-red-600 dark:text-red-400 font-bold text-lg">
            Erro ao carregar seus flashcards
          </p>
          <p className="text-red-500/80 text-sm mt-1">{error?.message}</p>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="bg-blue-50 dark:bg-blue-950/50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Nenhum deck encontrado
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto text-sm">
            Crie seu primeiro baralho manualmente ou importe um arquivo .txt no formato
            &ldquo;Pergunta | Resposta&rdquo;.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline"
          >
            Criar meu primeiro deck &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => (
            <div
              key={deck.deckId}
              className="bg-white dark:bg-slate-900 rounded-3xl p-7 border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 transition shadow-sm flex flex-col relative"
            >
              <div className="flex items-start justify-between gap-2 mb-5">
                <div className="bg-blue-50 dark:bg-blue-950/60 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Brain className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5">
                  {deck.isGlobal && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300">
                      <Globe className="w-3 h-3" /> Oficial
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {deck.category || 'Geral'}
                  </span>
                  {deck.canEdit && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Excluir o deck "${deck.name}"?`)) {
                          deleteDeckMutation.mutate(deck.deckId);
                        }
                      }}
                      title="Excluir deck"
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1.5 line-clamp-1">
                {deck.name}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 flex-grow line-clamp-2">
                {deck.description || 'Baralho de revisão espaçada.'}
              </p>

              <div className="flex items-center gap-5 text-xs text-slate-500 dark:text-slate-400 mb-6 font-bold">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  {deck.totalCards} cards
                </span>
                {!deck.locked && (
                  <span
                    className={`flex items-center gap-1.5 ${
                      deck.dueCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    {deck.dueCount > 0 ? `${deck.dueCount} para hoje` : 'Em dia'}
                  </span>
                )}
              </div>

              {deck.locked ? (
                <div className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Exclusivo do plano {deck.plan.toUpperCase()}</span>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedDeck(deck)}
                  disabled={deck.totalCards === 0}
                  className="w-full py-3.5 rounded-2xl font-extrabold text-sm transition flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 disabled:opacity-40"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{deck.dueCount > 0 ? 'ESTUDAR AGORA' : 'REVISAR DECK'}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateDeckModal
          onClose={() => setShowCreateModal(false)}
          createMutation={createDeckMutation}
        />
      )}
    </div>
  );
};

const CreateDeckModal = ({ onClose, createMutation }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [rawCards, setRawCards] = useState('');
  const [error, setError] = useState('');

  const handleTxtFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawCards(String(ev.target?.result || ''));
      if (!name) setName(file.name.replace(/\.txt$/i, ''));
    };
    reader.readAsText(file);
  };

  const parsed = parseFlashcardTxt(rawCards);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (parsed.items.length === 0) {
      setError('Adicione pelo menos 1 card válido no formato "Pergunta | Resposta".');
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        category,
        description: description.trim(),
        cards: parsed.items,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao criar deck.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 md:p-8 border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Criar Novo Deck
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Nome do Deck</label>
              <input
                type="text"
                required
                placeholder="Ex: Semiologia Cardíaca"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold dark:text-white"
              />
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
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Descrição (opcional)
            </label>
            <input
              type="text"
              placeholder="Resumo do conteúdo deste deck"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Cards (1 por linha: Pergunta | Resposta | Explicação)
              </label>
              <label className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 cursor-pointer hover:underline">
                <Upload className="w-3.5 h-3.5" /> Importar .txt
                <input type="file" accept=".txt" className="hidden" onChange={handleTxtFile} />
              </label>
            </div>
            <textarea
              rows={6}
              value={rawCards}
              onChange={(e) => setRawCards(e.target.value)}
              placeholder={
                'Qual artéria irriga o nó sinoatrial na maioria dos indivíduos? | Artéria coronária direita | Em ~60% das pessoas o ramo do nó SA origina-se da ACD.'
              }
              className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs dark:text-white"
            />
            <p className="text-xs text-slate-500 mt-1">
              <strong>{parsed.items.length}</strong> card(s) válido(s)
              {parsed.errors.length > 0 && (
                <span className="text-amber-600 ml-2">
                  • {parsed.errors.length} linha(s) ignorada(s)
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
              {createMutation.isPending ? 'Salvando...' : 'Salvar Deck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Flashcards;
