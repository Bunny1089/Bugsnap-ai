import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Cpu, Layers, ArrowRight, ShieldCheck, Terminal, Sparkles, CheckCircle2 } from 'lucide-react';
import { BsGithub } from 'react-icons/bs';

export const Landing = ({ onLaunch }) => {
  const shouldReduceMotion = useReducedMotion();

  const fadeInVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: (custom = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : 0.5,
        delay: shouldReduceMotion ? 0 : custom * 0.1,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-zinc-100 flex flex-col justify-between selection:bg-[#8B70E6]/30 selection:text-white relative overflow-hidden">
      {/* Background Subtle Gradient & Grid Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-b from-violet-600/20 via-indigo-600/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-900/5 blur-[160px] rounded-full" />
      </div>

      {/* Top Navigation */}
      <header className="relative z-10 border-b border-zinc-800/80 bg-[#0B0E14]/80 backdrop-blur-md">
        <div className="mx-auto w-full max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-mono font-black text-sm text-white shadow-md shadow-violet-500/20">
              BS
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">BugSnap AI</span>
              <span className="ml-2 hidden sm:inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800/90 text-zinc-400 border border-zinc-700/60">
                v1.0 Local
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              100% Local Inference
            </div>
            <button
              type="button"
              onClick={onLaunch}
              className="px-4 py-2 text-sm rounded-full border font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700 hover:border-zinc-600 transition-colors cursor-pointer"
            >
              Open Workbench
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 mx-auto w-full max-w-6xl px-6 pt-16 pb-20 flex flex-col items-center text-center justify-center">
        {/* Release Pill Badge */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-950/50 border border-violet-500/30 text-violet-300 text-xs font-medium mb-8 shadow-sm backdrop-blur-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Local Vision Model Reasoning for Developers</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400 font-mono text-[11px]">gemma4:e2b</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.15] text-zinc-100"
        >
          Screenshot to GitHub issue,{' '}
          <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            100% local
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
          className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed"
        >
          Turn UI bugs, stack crashes, and route failures into structured GitHub issue specifications.
          Zero cloud data leakage, private local vision reasoning, and human-in-the-loop verification.
        </motion.p>

        {/* CTA Launch Workbench Button (Gradient Style) */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
          className="mt-8 flex flex-col sm:flex-row items-center gap-4"
        >
          <button
            type="button"
            onClick={onLaunch}
            className="group relative inline-flex items-center gap-3 px-7 py-3.5 text-base rounded-full font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-500 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-600/30 hover:shadow-violet-600/40 border border-violet-400/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Launch Workbench</span>
            <ArrowRight className="w-4 h-4 text-violet-200 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>

        {/* Key Features 3-Card Row */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
          className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left"
        >
          {/* Feature 1: Local Gemma 4 E2B */}
          <div className="group rounded-2xl border border-zinc-800/90 bg-[#11151F]/90 p-6 backdrop-blur-sm hover:border-violet-500/40 hover:bg-[#141926] transition-all shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-[#8B70E6] mb-4 group-hover:scale-105 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-zinc-100 mb-2">Local Gemma 4 E2B</h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                100% private offline vision analysis via Ollama. No third-party API keys, no data egress, and no recurring SaaS token fees.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero cloud data leakage</span>
            </div>
          </div>

          {/* Feature 2: Multimodal */}
          <div className="group rounded-2xl border border-zinc-800/90 bg-[#11151F]/90 p-6 backdrop-blur-sm hover:border-indigo-500/40 hover:bg-[#141926] transition-all shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-zinc-100 mb-2">Multimodal</h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Multi-screenshot sequential triage (up to 4 images), canvas annotation & blur redaction tools, and automatic browser environment detection.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-image + Canvas redaction</span>
            </div>
          </div>

          {/* Feature 3: Open source */}
          <div className="group rounded-2xl border border-zinc-800/90 bg-[#11151F]/90 p-6 backdrop-blur-sm hover:border-purple-500/40 hover:bg-[#141926] transition-all shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-zinc-100 mb-2">Open source</h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Strict schema separating verified on-screen evidence from speculative root-cause hypotheses, with direct one-click GitHub issue Markdown export.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>GitHub-ready Markdown</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/80 bg-[#0B0E14] py-4 text-xs text-zinc-500">
        <div className="mx-auto w-full max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>BugSnap AI</span>
            <span>•</span>
            <span>Local Screenshot to GitHub Issue Drafter</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <BsGithub className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
