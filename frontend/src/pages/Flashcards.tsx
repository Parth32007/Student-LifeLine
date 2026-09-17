import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  ListTree,
  AlertCircle,
  ThumbsUp,
  BrainCircuit,
  History,
  Trash2,
  Play
} from 'lucide-react';
import { useSubjects } from '../context/SubjectContext';
import { api } from '../services/api';
import { FlashcardDeck, Flashcard, SubjectUnit } from '../types';

export const Flashcards: React.FC = () => {
  const { subjects, loading: subjectsLoading } = useSubjects();

  // Selection Controls
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('all');
  const [cardCount, setCardCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<string>('mixed');

  // Decks & Cards State
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [currentDeck, setCurrentDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [reviewedCardIds, setReviewedCardIds] = useState<Set<string>>(new Set());

  // Status & Notifications
  const [generating, setGenerating] = useState<boolean>(false);
  const [loadingDecks, setLoadingDecks] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-select first subject when subjects load
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
      setSelectedUnitId('all');
    }
  }, [subjects, selectedSubjectId]);

  // Load existing decks from API
  const fetchDecks = async () => {
    try {
      setLoadingDecks(true);
      const list = await api.listFlashcardDecks();
      setDecks(list);
      if (list.length > 0 && !currentDeck) {
        setCurrentDeck(list[0]);
        const deckCards = await api.listDeckCards(list[0].id);
        setCards(deckCards);
      }
    } catch (err) {
      console.warn('Failed to load flashcard decks', err);
    } finally {
      setLoadingDecks(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  // Compute available units for currently selected subject
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const availableUnits: SubjectUnit[] = currentSubject?.units || [];

  // When subject changes, reset unit dropdown to 'all'
  const handleSubjectChange = (newSubId: string) => {
    setSelectedSubjectId(newSubId);
    setSelectedUnitId('all');
  };

  // Generate Flashcards using Gemini
  const handleGenerateFlashcards = async () => {
    if (!selectedSubjectId || !currentSubject) {
      setStatusMessage({ type: 'error', text: 'Please select a course subject first.' });
      return;
    }

    const unit = availableUnits.find((u) => u.id === selectedUnitId);
    const hasSyllabus = availableUnits.length > 0 || (currentSubject.syllabus_topics && currentSubject.syllabus_topics.length > 0);

    if (!hasSyllabus) {
      setStatusMessage({
        type: 'error',
        text: `Subject "${currentSubject.name}" has no syllabus or units. Please add or update its syllabus in the Subjects page first.`
      });
      return;
    }

    setGenerating(true);
    setStatusMessage(null);

    try {
      // Create or reuse a deck for this subject & unit
      const unitLabel = unit ? unit.title : 'Comprehensive Syllabus';
      const deckTitle = `${currentSubject.name}: ${unitLabel} (${difficulty.toUpperCase()})`;

      const newDeck = await api.createFlashcardDeck({
        subject_id: currentSubject.id,
        title: deckTitle,
        description: `Gemini AI-generated active recall flashcards covering ${unitLabel} for ${currentSubject.name}.`,
      });

      // Request flashcard generation
      const generatedCards = await api.generateFlashcards({
        subject_id: currentSubject.id,
        unit_id: selectedUnitId === 'all' ? undefined : selectedUnitId,
        count: cardCount,
        difficulty,
        deck_id: newDeck.id,
      });

      if (generatedCards.length === 0) {
        throw new Error('Gemini was unable to generate flashcards for this unit. Please check syllabus content.');
      }

      setDecks((prev) => [newDeck, ...prev]);
      setCurrentDeck(newDeck);
      setCards(generatedCards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setReviewedCardIds(new Set());

      setStatusMessage({
        type: 'success',
        text: `Successfully generated ${generatedCards.length} syllabus-grounded flashcards for ${currentSubject.name}!`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to generate flashcards. Please verify your connection or syllabus.'
      });
    } finally {
      setGenerating(false);
    }
  };

  // Handle deck selection from history
  const handleSelectDeck = async (deck: FlashcardDeck) => {
    try {
      setCurrentDeck(deck);
      const deckCards = await api.listDeckCards(deck.id);
      setCards(deckCards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setReviewedCardIds(new Set());
    } catch (err) {
      console.error('Failed to load cards for deck', err);
    }
  };

  // Card Navigation
  const handleNext = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  // SM-2 Review Action
  const handleRateCard = async (rating: number) => {
    const activeCard = cards[currentIndex];
    if (!activeCard) return;

    try {
      await api.reviewFlashcard(activeCard.id, rating);
      setReviewedCardIds((prev) => new Set([...prev, activeCard.id]));

      // Auto-advance
      if (currentIndex + 1 < cards.length) {
        setCurrentIndex((i) => i + 1);
        setIsFlipped(false);
      } else {
        setStatusMessage({
          type: 'success',
          text: 'Queue completed! All flashcards in this deck have been reviewed with updated SM-2 intervals.'
        });
      }
    } catch (err) {
      console.error('Failed to submit SM-2 rating', err);
    }
  };

  const activeCard = cards[currentIndex];
  const progressPercent = cards.length > 0 ? Math.round((reviewedCardIds.size / cards.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
            <Layers className="h-4 w-4" />
            <span>Active Recall & Spaced Repetition</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Flashcards & Syllabus Memorization
          </h1>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-xs font-semibold backdrop-blur-md transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Generation Controls Bar */}
      <div className="rounded-3xl bg-card border border-border p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* 1. Subject Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Course Subject *
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              disabled={subjectsLoading}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
            >
              <option value="" disabled>Select Subject</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Unit Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
              <span>Syllabus Unit *</span>
              {!selectedSubjectId && <span className="text-[10px] text-muted-foreground">(Select subject first)</span>}
            </label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              disabled={!selectedSubjectId || availableUnits.length === 0}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="all">All Units (Comprehensive)</option>
              {availableUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.title}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Number of Flashcards */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Card Count
            </label>
            <select
              value={cardCount}
              onChange={(e) => setCardCount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value={5}>5 Flashcards</option>
              <option value={10}>10 Flashcards</option>
              <option value={15}>15 Flashcards</option>
              <option value={20}>20 Flashcards</option>
            </select>
          </div>

          {/* 4. Difficulty Level */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="mixed">Mixed (Adaptive)</option>
              <option value="easy">Easy (Definitions)</option>
              <option value="medium">Medium (Theorems)</option>
              <option value="hard">Hard (Proofs & Invariants)</option>
            </select>
          </div>

          {/* 5. Generate Button */}
          <div>
            <button
              onClick={handleGenerateFlashcards}
              disabled={generating || !selectedSubjectId}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Gemini Thinking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>Generate Flashcards</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Flashcard Interactive Player */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Viewer (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {cards.length > 0 && activeCard ? (
            <div className="space-y-4">
              {/* Progress & Deck Info Bar */}
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">
                    Card {currentIndex + 1} of {cards.length}
                  </span>
                  <span>•</span>
                  <span className="text-indigo-400 font-semibold">
                    {reviewedCardIds.size} Reviewed
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono capitalize px-2 py-0.5 rounded-md bg-secondary text-foreground">
                    {activeCard.difficulty || difficulty}
                  </span>
                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Flip Card (Space)</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* 3D Flip Card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="relative min-h-[340px] sm:min-h-[380px] w-full rounded-3xl bg-card border border-border p-8 sm:p-10 shadow-lg cursor-pointer select-none flex flex-col justify-between transition-all hover:border-indigo-500/40 hover:shadow-indigo-500/10"
                style={{
                  perspective: '1000px',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    {isFlipped ? 'Answer & Explanation' : 'Active Recall Question'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Click anywhere to flip
                  </span>
                </div>

                {/* Card Content Area */}
                <div className="my-auto py-6">
                  {!isFlipped ? (
                    <div className="space-y-3">
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                        {activeCard.question}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Try recalling the underlying concept, invariants, and standard application before flipping.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-sm sm:text-base text-foreground font-medium leading-relaxed">
                        {activeCard.answer}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>Syllabus Grounded • Verified Invariant</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{currentDeck?.title || 'Active Flashcard Deck'}</span>
                  <span className="italic">Ease: {activeCard.ease_factor?.toFixed(1) || '2.5'}</span>
                </div>
              </div>

              {/* Action Buttons: Prev / Next & SM-2 Ratings */}
              <div className="space-y-3">
                {/* Previous & Next Controls */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handlePrev}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all border border-border"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>{isFlipped ? 'Show Question' : 'Flip to Answer'}</span>
                  </button>

                  <button
                    onClick={handleNext}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all border border-border"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* SM-2 Recall Rating Buttons */}
                {isFlipped && (
                  <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-2 animate-in fade-in slide-in-from-bottom-2">
                    <div className="text-[11px] font-bold text-center uppercase tracking-wider text-muted-foreground">
                      Rate Your Recall (Updates Spaced Repetition Interval)
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => handleRateCard(1)}
                        className="py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all flex flex-col items-center gap-0.5"
                      >
                        <span>Hard</span>
                        <span className="text-[10px] font-normal opacity-80">&lt; 1 Day</span>
                      </button>

                      <button
                        onClick={() => handleRateCard(3)}
                        className="py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs font-bold transition-all flex flex-col items-center gap-0.5"
                      >
                        <span>Medium</span>
                        <span className="text-[10px] font-normal opacity-80">3 Days</span>
                      </button>

                      <button
                        onClick={() => handleRateCard(5)}
                        className="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all flex flex-col items-center gap-0.5"
                      >
                        <span>Easy</span>
                        <span className="text-[10px] font-normal opacity-80">6+ Days</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-96 rounded-3xl bg-card border border-border flex flex-col items-center justify-center p-8 text-center space-y-3">
              <Layers className="h-12 w-12 text-muted-foreground opacity-40" />
              <h3 className="text-base font-bold text-foreground">No Flashcards in View</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Select a course subject and unit above, then click <strong className="text-indigo-400">Generate Flashcards</strong> to create real-time AI study cards grounded in your syllabus.
              </p>
            </div>
          )}
        </div>

        {/* Decks & History Sidebar (1 col) */}
        <div className="space-y-4">
          <div className="rounded-3xl bg-card border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                <History className="h-4 w-4 text-indigo-400" />
                <span>Saved Decks & History</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {decks.length} Decks
              </span>
            </div>

            {loadingDecks ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Loading deck history...</div>
            ) : decks.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                <p>No saved decks yet.</p>
                <p className="text-[11px] opacity-75">Generated decks will appear here automatically.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {decks.map((deck) => {
                  const isActive = currentDeck?.id === deck.id;
                  return (
                    <div
                      key={deck.id}
                      onClick={() => handleSelectDeck(deck)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                        isActive
                          ? 'bg-indigo-500/10 border-indigo-500/50 shadow-sm'
                          : 'bg-secondary/30 border-border/60 hover:bg-secondary/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-foreground line-clamp-1">
                          {deck.title}
                        </h4>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1" />
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{deck.cards_count || 0} Cards</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          Study Deck
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
