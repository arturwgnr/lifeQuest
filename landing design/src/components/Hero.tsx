/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, AlertTriangle, GitBranch, ShieldAlert } from 'lucide-react';

interface HeroProps {
  onCtaClick: () => void;
}

export default function Hero({ onCtaClick }: HeroProps) {
  return (
    <section 
      className="relative min-h-[calc(100vh-4rem)] flex items-center bg-brand-light-bg film-grain overflow-hidden py-16 px-6"
      id="hero-section"
    >
      {/* Background Subtle Grid Texture */}
      <div className="absolute inset-0 grid-texture-light opacity-60 pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Column: Copywriting & Actions */}
        <div className="lg:col-span-7 space-y-6" id="hero-left-content">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-brand-light-accent/10 rounded-full border border-brand-light-accent/15"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-brand-light-accent" />
            <span className="text-[11px] font-mono font-medium tracking-wider text-brand-light-accent uppercase">
              Built for accountability, not gamification
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-sans font-extrabold tracking-tight text-brand-light-primary leading-[1.1]"
          >
            Know exactly what you're avoiding{" "}
            <span className="text-brand-light-accent relative">
              today.
              <span className="absolute bottom-1 left-0 w-full h-[3px] bg-brand-light-accent/20 rounded" />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base sm:text-lg text-brand-light-secondary font-normal leading-relaxed max-w-2xl"
          >
            lifeQuest tracks tasks by category, priority, and how they depend on each other, then quietly flags whatever you've been putting off. Tell the Oracle what's going on in plain language and it turns that into structured tasks, nothing gets created without you approving it first.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
          >
            <button
              onClick={onCtaClick}
              className="px-6 py-3.5 bg-brand-light-primary hover:bg-brand-light-primary/95 text-brand-light-surface rounded-lg font-sans font-medium text-sm transition-custom flex items-center justify-center gap-2 group shadow-md hover:shadow-lg"
              id="btn-hero-cta"
            >
              Start Your Quest Log
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <a 
              href="#how-it-works-section"
              className="px-6 py-3.5 border border-brand-light-primary/10 hover:bg-brand-light-primary/5 rounded-lg text-brand-light-primary text-sm font-medium transition-custom text-center"
            >
              How it works
            </a>
          </motion.div>
        </div>

        {/* Right Column: Visual Product-Grade Floating Cards */}
        <div className="lg:col-span-5 relative flex items-center justify-center min-h-[350px]" id="hero-right-visual">
          
          {/* Subtle surrounding light aura */}
          <div className="absolute w-72 h-72 bg-brand-light-accent/5 rounded-full filter blur-3xl -z-10" />

          <div className="relative w-full max-w-[400px] h-[300px]">
            {/* Background floating card (Chain complete) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ 
                opacity: 1, 
                y: [30, 10, 20, 10]
              }}
              transition={{ 
                opacity: { duration: 0.8, delay: 0.4 },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }
              }}
              className="absolute left-4 bottom-6 w-[280px] bg-brand-light-surface border border-brand-light-primary/10 rounded-xl p-5 shadow-sm z-10"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-brand-light-secondary flex items-center gap-1">
                  <GitBranch className="w-3 h-3 text-brand-light-primary/40" />
                  Chain 2/3 complete
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono bg-brand-light-primary/5 text-brand-light-primary rounded">
                  Work
                </span>
              </div>
              <h4 className="text-xs font-sans font-bold text-brand-light-primary leading-tight mb-2">
                Q3 Finance Reorganization
              </h4>
              <div className="w-full bg-brand-light-primary/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-brand-light-primary h-full w-2/3 rounded-full" />
              </div>
            </motion.div>

            {/* Foreground floating card (Needs Attention) */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ 
                opacity: 1, 
                y: [-20, 5, -5, 5]
              }}
              transition={{ 
                opacity: { duration: 0.8, delay: 0.2 },
                y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }
              }}
              className="absolute right-4 top-6 w-[290px] bg-brand-light-surface border-l-4 border-l-brand-light-accent border-y border-r border-brand-light-primary/10 rounded-xl p-5 shadow-lg z-20"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-brand-light-accent font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-brand-light-accent animate-pulse" />
                  Needs Attention Today
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono bg-brand-light-accent/10 text-brand-light-accent rounded">
                  Finance
                </span>
              </div>
              <h4 className="text-sm font-sans font-bold text-brand-light-primary leading-snug mb-3">
                Consolidate retirement portfolio
              </h4>
              <p className="text-[11px] text-brand-light-secondary leading-relaxed mb-4">
                Flagged: Avoided for 14 days straight. Bob is waiting on this draft.
              </p>
              <div className="flex items-center justify-between border-t border-brand-light-primary/5 pt-3">
                <span className="text-[10px] font-mono text-brand-light-secondary">
                  Hesitation factor: High
                </span>
                <span className="text-[10px] font-mono font-medium text-brand-light-accent">
                  XP +25
                </span>
              </div>
            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
}
