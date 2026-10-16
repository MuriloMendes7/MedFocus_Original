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
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5D6D67] dark:text-[#9FB0A9] hover:text-[#1A3835] dark:hover:text-[#E8EFEA] transition"
        >
          &larr; Voltar para Baralhos
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D6] dark:border-[#24312B]">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-[#172622] dark:text-[#F1F5F3] tracking-tight">
            Baralhos de Revisão Espaçada
          </h1>
          <p className="text-[#6A7B74] dark:text-[#93A59E] text-xs md:text-sm mt-1">
            Revisão ativa baseada no algoritmo SuperMemo SM-2 para retenção de longo prazo.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-[#1A3835] hover:bg-[#254F4A] text-[#FAF8F5] px-5 py-2.5 rounded-xl font-medium shadow-sm transition text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Baralho</span>
        </button>
      </div>

      {categories.length > 2 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                categoryFilter === cat
                  ? 'bg-[#1A3835] text-[#FAF8F5] shadow-xs'
                  : 'bg-[#FFFFFF] dark:bg-[#18211E] text-[#5D6D67] dark:text-[#93A59E] border border-[#DDD6C8] dark:border-[#2A3731] hover:bg-[#F4F1EA]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 bg-[#FFFFFF] dark:bg-[#18211E] rounded-2xl animate-pulse border border-[#DDD6C8] dark:border-[#2A3731]"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12 bg-[#FBF0EE] dark:bg-[#2A1D1A] rounded-2xl border border-[#F2D0C8] dark:border-[#4B2922]">
          <p className="text-[#A13A28] dark:text-[#E27D60] font-medium text-sm">
            Erro ao carregar baralhos de flashcards
          </p>
          <p className="text-xs text-[#8A4A3E] mt-1">{error?.message}</p>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="text-center py-16 bg-[#FFFFFF] dark:bg-[#18211E] rounded-2xl border border-dashed border-[#DDD6C8] dark:border-[#2A3731]">
          <div className="bg-[#F4F1EA] dark:bg-[#1F2B26] w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-[#1A3835] dark:text-[#A1C5B5]">
            <Brain className="w-6 h-6" />
          </div>
          <h3 className="text-base font-serif text-[#172622] dark:text-[#F1F5F3]">
            Nenhum baralho encontrado
          </h3>
          <p className="text-[#6A7B74] dark:text-[#93A59E] mt-1 max-w-sm mx-auto text-xs leading-relaxed">
            Crie seu próprio baralho clínico ou importe um arquivo .txt estruturado.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-[#1A3835] dark:text-[#A1C5B5] font-semibold text-xs hover:underline"
          >
            Criar primeiro baralho &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDecks.map((deck) => (
            <div
              key={deck.deckId}
              className="bg-[#FFFFFF] dark:bg-[#18211E] rounded-2xl p-6 border border-[#DDD6C8] dark:border-[#2A3731] hover:border-[#1A3835] dark:hover:border-[#4D7B6A] transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#F4F1EA] dark:bg-[#202C27] text-[#556961] dark:text-[#95A8A0] border border-[#E5DFD4] dark:border-[#293630]">
                    {deck.category || 'Geral'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {deck.isGlobal && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#EDF3EF] dark:bg-[#1E2E27] text-[#24503F] dark:text-[#8EBFAC] border border-[#CFDFD7] dark:border-[#2F493E]">
                        <Globe className="w-2.5 h-2.5" /> Oficial
                      </span>
                    )}
                    {deck.canEdit && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Excluir o deck "${deck.name}"?`)) {
                            deleteDeckMutation.mutate(deck.deckId);
                          }
                        }}
                        title="Excluir deck"
                        className="text-[#889892] hover:text-[#A13A28] p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-serif text-[#172622] dark:text-[#F1F5F3] mb-1.5 line-clamp-1">
                  {deck.name}
                </h3>
                <p className="text-[#6A7B74] dark:text-[#93A59E] text-xs mb-5 line-clamp-2 leading-relaxed">
                  {deck.description || 'Baralho clínico estruturado para revisão espaçada.'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-[#5D6D67] dark:text-[#8E9F98] pt-3 pb-4 border-t border-[#F0EBE2] dark:border-[#24312B] font-mono text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#889892]" />
                    {deck.totalCards} cards
                  </span>
                  {!deck.locked && (
                    <span
                      className={`flex items-center gap-1.5 font-medium ${
                        deck.dueCount > 0 ? 'text-[#C47253]' : 'text-[#3B6955] dark:text-[#8EBFAC]'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {deck.dueCount > 0 ? `${deck.dueCount} para hoje` : 'Em dia'}
                    </span>
                  )}
                </div>

                {deck.locked ? (
                  <div className="w-full py-2.5 px-3 rounded-lg font-medium text-xs bg-[#FAF5E8] dark:bg-[#252216] text-[#8C6D1F] dark:text-[#DFC377] flex items-center justify-center gap-2 border border-[#EADBBD] dark:border-[#3D371E]">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Plano {deck.plan.toUpperCase()}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedDeck(deck)}
                    disabled={deck.totalCards === 0}
                    className="w-full py-2.5 px-3 rounded-lg font-medium text-xs transition flex items-center justify-center gap-2 bg-[#1A3835] hover:bg-[#254F4A] text-[#FAF8F5] disabled:opacity-40"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{deck.dueCount > 0 ? 'Iniciar Revisão de Hoje' : 'Revisar Baralho'}</span>
                  </button>
                )}
              </div>
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
    <div className="fixed inset-0 z-50 bg-[#121615]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] dark:bg-[#18211E] rounded-2xl max-w-xl w-full p-6 md:p-8 border border-[#DDD6C8] dark:border-[#2A3731] space-y-5 max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE2] dark:border-[#24312B]">
          <h3 className="text-xl font-serif text-[#172622] dark:text-[#F1F5F3]">
            Criar Novo Baralho
          </h3>
          <button onClick={onClose} className="text-[#889892] hover:text-[#172622] dark:hover:text-[#F1F5F3]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#5D6D67] dark:text-[#9FB0A9]">Nome do Baralho</label>
              <input
                type="text"
                required
                placeholder="Ex: Semiologia Cardíaca"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full px-3.5 py-2.5 rounded-lg border border-[#D5CDC0] dark:border-[#2E3E37] bg-[#FAF8F5] dark:bg-[#141B18] text-sm text-[#1C2A26] dark:text-[#EAEFEA] focus:outline-none focus:border-[#1A3835]"
              />
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
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#5D6D67] dark:text-[#9FB0A9]">
              Descrição Clínica (opcional)
            </label>
            <input
              type="text"
              placeholder="Foco de estudo e conceitos abordados"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full px-3.5 py-2.5 rounded-lg border border-[#D5CDC0] dark:border-[#2E3E37] bg-[#FAF8F5] dark:bg-[#141B18] text-sm text-[#1C2A26] dark:text-[#EAEFEA] focus:outline-none focus:border-[#1A3835]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#5D6D67] dark:text-[#9FB0A9]">
                Cards (1 por linha: Pergunta | Resposta | Explicação)
              </label>
              <label className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A3835] dark:text-[#A1C5B5] cursor-pointer hover:underline">
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
              className="w-full p-3.5 rounded-lg border border-[#D5CDC0] dark:border-[#2E3E37] bg-[#FAF8F5] dark:bg-[#141B18] font-mono text-xs text-[#1C2A26] dark:text-[#EAEFEA] focus:outline-none focus:border-[#1A3835]"
            />
            <p className="text-xs text-[#6A7B74] mt-1 font-mono text-[11px]">
              <strong>{parsed.items.length}</strong> card(s) identificado(s)
              {parsed.errors.length > 0 && (
                <span className="text-[#C47253] ml-2">
                  • {parsed.errors.length} linha(s) ignorada(s)
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
              {createMutation.isPending ? 'Salvando...' : 'Salvar Baralho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Flashcards;
