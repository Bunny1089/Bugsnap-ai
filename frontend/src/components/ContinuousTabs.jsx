import { useState, useEffect } from 'react';
import { motion, LayoutGroup } from 'motion/react';

export const ContinuousTabs = ({
  tabs = [
    { id: 'editor', label: 'Structured Editor' },
    { id: 'preview', label: 'Markdown Preview' },
    { id: 'raw', label: 'Raw Markdown' },
  ],
  activeId = 'editor',
  onChange,
}) => {
  const [active, setActive] = useState(activeId);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (activeId !== undefined && activeId !== active) {
      setActive(activeId);
    }
  }, [activeId]);

  const handleChange = (id) => {
    setActive(id);
    onChange?.(id);
  };

  if (!isMounted) {
    return (
      <div className="inline-flex items-center gap-0.5 sm:gap-1 p-1 rounded-full border border-zinc-800 bg-[#11151F]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border-none inline-flex items-center justify-center whitespace-nowrap leading-tight ${
              activeId === tab.id ? 'bg-[#8B70E6] text-white font-semibold' : 'bg-transparent text-zinc-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <LayoutGroup>
      <nav
        role="tablist"
        aria-label="View Mode Tabs"
        className="relative inline-flex items-center gap-0.5 sm:gap-1 p-1 rounded-full border border-zinc-800/80 bg-[#11151F] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_8px_rgba(0,0,0,0.5)] transition-all"
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => handleChange(tab.id)}
              className="relative px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full outline-none border-none bg-transparent inline-flex items-center justify-center transition-colors select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#8B70E6]"
            >
              {/* Active pill with violet accent */}
              {isActive && (
                <motion.div
                  layoutId="continuous-tab-active-pill"
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 30,
                    mass: 0.9,
                  }}
                  className="absolute inset-0 rounded-full bg-[#8B70E6] shadow-[0_2px_10px_rgba(139,112,230,0.35)]"
                />
              )}

              {/* Text */}
              <motion.span
                layout="position"
                className={`relative z-10 inline-flex items-center whitespace-nowrap leading-tight text-xs sm:text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </motion.span>
            </button>
          );
        })}
      </nav>
    </LayoutGroup>
  );
};

export default ContinuousTabs;
