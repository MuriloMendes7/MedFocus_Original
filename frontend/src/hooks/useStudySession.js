import { useCallback, useEffect, useRef, useState } from 'react';
import { calculateSM2, getIntervalPreviews } from '../utils/sm2';
import { useReviewCard } from './useDecks';

export const useStudySession = (deck) => {
  const [sessionCards, setSessionCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [studiedCount, setStudiedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const cardStartedAt = useRef(Date.now());
  const reviewMutation = useReviewCard();

  useEffect(() => {
    if (!deck?.cards) return;
    const now = new Date();
    const due = deck.cards.filter((card) => !card.nextReview || new Date(card.nextReview) <= now);
    const pool = due.length > 0 ? due : deck.cards;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    setSessionCards(shuffled);
    setCurrentIndex(0);
    setIsFinished(shuffled.length === 0);
    setStudiedCount(0);
    setCorrectCount(0);
    setElapsedSeconds(0);
    cardStartedAt.current = Date.now();
  }, [deck?.deckId]);

  useEffect(() => {
    if (isFinished) return undefined;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isFinished]);

  const currentCard = sessionCards[currentIndex] || null;
  const intervalPreviews = currentCard ? getIntervalPreviews(currentCard) : null;

  const handleRate = useCallback(
    async (quality) => {
      if (!currentCard || reviewMutation.isPending) return;

      const durationMs = Math.max(0, Date.now() - cardStartedAt.current);
      const localStats = calculateSM2(currentCard, quality);
      const updatedCard = { ...currentCard, ...localStats };

      setStudiedCount((n) => n + 1);
      if (quality >= 3) setCorrectCount((n) => n + 1);

      reviewMutation.mutate({
        deckId: deck.deckId,
        cardId: currentCard.id,
        quality,
        durationMs,
      });

      const nextQueue = [...sessionCards];
      if (quality < 2) {
        nextQueue.push(updatedCard);
        setSessionCards(nextQueue);
      }

      if (currentIndex < nextQueue.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        cardStartedAt.current = Date.now();
      } else {
        setIsFinished(true);
      }
    },
    [currentCard, currentIndex, deck?.deckId, reviewMutation, sessionCards],
  );

  return {
    currentCard,
    currentIndex,
    totalCards: sessionCards.length,
    isFinished,
    studiedCount,
    correctCount,
    elapsedSeconds,
    intervalPreviews,
    handleRate,
    isSaving: reviewMutation.isPending,
  };
};
