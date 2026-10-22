import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { Pin, ChevronsUpDown, X, FileText } from 'lucide-react';

const PINNED_STORAGE_KEY = 'bugsnap_pinned_draft_ids';

function getStoredPinnedIds() {
  try {
    const raw = localStorage.getItem(PINNED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredPinnedIds(ids) {
  try {
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage errors
  }
}

const springConfig = {
  type: 'spring',
  stiffness: 400,
  damping: 38,
};

export const ShufflePinnedList = ({
  draftHistory = [],
  onLoadDraft,
  onDeleteDraft,
  onClearAll,
}) => {
  const [pinnedIds, setPinnedIds] = useState(() => getStoredPinnedIds());
  const [activePinnedIndex, setActivePinnedIndex] = useState(0);
  const [showFade, setShowFade] = useState(false);
  const scrollRef = useRef(null);

  // Sync pinned state and items when draftHistory or pinnedIds change
  const items = useMemo(() => {
    return draftHistory.map((d) => ({
      id: d.id,
      text: d.title || 'Untitled Bug Draft',
      isPinned: pinnedIds.includes(d.id),
      draft: d.draft,
      savedAt: d.savedAt,
      severity: d.severity,
      category: d.category,
    }));
  }, [draftHistory, pinnedIds]);

  const pinnedItems = useMemo(
    () => items.filter((item) => item.isPinned),
    [items]
  );

  const togglePin = useCallback((id, e) => {
    if (e) e.stopPropagation();
    setPinnedIds((prev) => {
      const isPinned = prev.includes(id);
      const next = isPinned ? prev.filter((pId) => pId !== id) : [id, ...prev];
      saveStoredPinnedIds(next);
      return next;
    });
  }, []);

  const shufflePinned = useCallback((e) => {
    if (e) e.stopPropagation();
    if (pinnedItems.length <= 1) return;
    setActivePinnedIndex((prev) => (prev + 1) % pinnedItems.length);
  }, [pinnedItems.length]);

  const currentHeroItem = pinnedItems[activePinnedIndex % (pinnedItems.length || 1)];

  // Scroll detection for fade overlay
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkScroll = () => {
      const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 6;
      setShowFade(!isAtBottom && el.scrollHeight > el.clientHeight);
    };

    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="w-full rounded-xl border border-zinc-800 bg-[#11151F] p-3 text-zinc-200">
        <div className="flex items-center justify-between px-1 pb-2 border-b border-zinc-800/80 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Local Drafts (0)
          </span>
        </div>
        <p className="text-xs text-zinc-400 text-center py-3">
          No drafts saved locally yet. Generated drafts persist in localStorage.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[320px] max-h-[320px] overflow-hidden rounded-xl border border-zinc-800/90 bg-[#11151F] p-3 text-zinc-200 shadow-md">
      <MotionConfig transition={springConfig}>
        <motion.div
          ref={scrollRef}
          layout
          className="relative h-full overflow-y-auto pr-1 scroll-smooth"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="space-y-2 pb-6">
            {/* Pinned Hero Card */}
            <motion.div
              layout
              className="overflow-hidden"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <AnimatePresence mode="popLayout">
                {pinnedItems.length > 0 && currentHeroItem && (
                  <motion.div
                    key="pinned-hero"
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-violet-500/30 bg-[#171C28] p-2.5 transition-colors hover:border-violet-500/50"
                    onClick={() => onLoadDraft?.(currentHeroItem.draft)}
                    title="Click to load pinned draft into workbench"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-[#8B70E6]">
                        <Pin className="h-4 w-4" fill="currentColor" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <AnimatePresence mode="popLayout">
                          <motion.div
                            key={currentHeroItem.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="truncate text-xs font-semibold text-zinc-100">
                              {currentHeroItem.text}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                              <span>Pinned</span>
                              <span>•</span>
                              <span>{currentHeroItem.savedAt}</span>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {pinnedItems.length > 1 && (
                        <button
                          type="button"
                          onClick={shufflePinned}
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-[#222938] text-zinc-400 hover:text-zinc-100 hover:bg-[#2A3345] transition-colors"
                          title="Shuffle pinned items"
                        >
                          <ChevronsUpDown className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => togglePin(currentHeroItem.id, e)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-violet-400 hover:text-zinc-400 hover:bg-[#222938] transition-colors"
                        title="Unpin draft"
                      >
                        <Pin className="h-3.5 w-3.5" fill="currentColor" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* List Header */}
            <div className="flex items-center justify-between px-1 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                All Local Drafts ({items.length})
              </span>
              {onClearAll && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-[10px] font-medium text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* List Items */}
            <div className="w-full space-y-1">
              <AnimatePresence mode="popLayout" initial={false}>
                {items.map((item) => {
                  const isHighlighted = currentHeroItem?.id === item.id && item.isPinned;
                  return (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                      }}
                      className={`group relative flex cursor-pointer items-center justify-between overflow-hidden rounded-lg border p-2 transition-all ${
                        isHighlighted
                          ? 'border-violet-500/40 bg-[#1A1F2D]'
                          : 'border-transparent bg-[#141822] hover:border-zinc-700/80 hover:bg-[#1B212E]'
                      }`}
                      onClick={() => onLoadDraft?.(item.draft)}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-700/60 bg-[#1E2433] text-zinc-400">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-zinc-200 group-hover:text-white">
                            {item.text}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                            <span>{item.savedAt}</span>
                            {item.severity && (
                              <>
                                <span>•</span>
                                <span>{item.severity.replace(' (Suggested)', '')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0 ml-1">
                        <button
                          type="button"
                          onClick={(e) => togglePin(item.id, e)}
                          title={item.isPinned ? 'Unpin draft' : 'Pin draft'}
                          className={`flex h-7 w-7 items-center justify-center rounded-md transition-all ${
                            item.isPinned
                              ? 'text-[#8B70E6]'
                              : 'text-zinc-500 opacity-60 group-hover:opacity-100 hover:text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          <Pin className="h-3.5 w-3.5" fill={item.isPinned ? 'currentColor' : 'none'} />
                        </button>
                        {onDeleteDraft && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteDraft(item.id);
                            }}
                            title="Delete draft"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 opacity-60 group-hover:opacity-100 hover:text-rose-400 hover:bg-zinc-800 transition-all"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </MotionConfig>

      {/* Subtle fade overlay at bottom when scrollable */}
      <AnimatePresence>
        {showFade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute right-0 bottom-0 left-0 z-20 h-10 bg-gradient-to-t from-[#11151F] via-[#11151F]/80 to-transparent"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShufflePinnedList;
