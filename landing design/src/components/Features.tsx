/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, GitBranch, Sparkles, Shield } from 'lucide-react';

export default function Features() {
  const cards = [
    {
      icon: AlertTriangle,
      title: "Needs attention today",
      description: "Overdue tasks and anything quietly stuck get flagged automatically, procrastination stops hiding at the bottom of a long list."
    },
    {
      icon: GitBranch,
      title: "Real dependency chains",
      description: "Break a goal into steps that actually depend on each other, and see the whole chain's progress at a glance, not just isolated checkboxes."
    },
    {
      icon: Sparkles,
      title: "The Oracle turns talk into tasks",
      description: "Narrate your day like you would to a person. The Oracle turns it into structured, categorized tasks, and asks before assuming anything's already done."
    },
    {
      icon: Shield,
      title: "You approve everything",
      description: "No task, edit, or status change happens without you. The Oracle proposes, you decide."
    }
  ];

  return (
    <section 
      className="relative min-h-screen flex flex-col justify-center bg-brand-dark-bg film-grain py-24 px-6 overflow-hidden"
      id="features-section"
    >
      {/* Background Subtle Grid Texture */}
      <div className="absolute inset-0 grid-texture-dark opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col gap-16">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-xs font-mono font-semibold text-brand-dark-accent uppercase tracking-widest">
            A Better Paradigm
          </span>
          <h2 className="text-3xl sm:text-4xl font-sans font-extrabold tracking-tight text-brand-dark-primary leading-tight">
            Built to catch what a checklist can't
          </h2>
          <p className="text-brand-dark-secondary text-sm sm:text-base leading-relaxed">
            A checklist tells you what's left. It doesn't tell you what you're stuck on, or why. This does.
          </p>
        </div>

        {/* Feature Bento Grid (Single-column on mobile, two-column or four-column on desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="features-cards-grid">
          {cards.map((card, i) => {
            const IconComponent = card.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-brand-dark-surface border border-brand-dark-primary/5 rounded-2xl p-8 flex flex-col justify-between group hover:border-brand-dark-accent/20 transition-all duration-300"
              >
                <div className="space-y-4">
                  {/* Icon container */}
                  <div className="w-12 h-12 rounded-xl bg-brand-dark-primary/5 flex items-center justify-center border border-brand-dark-primary/10 group-hover:border-brand-dark-accent/20 group-hover:bg-brand-dark-accent/5 transition-colors duration-300">
                    <IconComponent className="w-5 h-5 text-brand-dark-secondary group-hover:text-brand-dark-accent transition-colors duration-300" />
                  </div>

                  <h3 className="text-lg font-sans font-bold text-brand-dark-primary tracking-tight">
                    {card.title}
                  </h3>
                  
                  <p className="text-sm text-brand-dark-secondary leading-relaxed font-sans">
                    {card.description}
                  </p>
                </div>

                {/* Aesthetic bottom flourish accent */}
                <div className="w-6 h-[2px] bg-brand-dark-primary/10 group-hover:bg-brand-dark-accent/65 transition-colors duration-300 mt-6 rounded" />
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
