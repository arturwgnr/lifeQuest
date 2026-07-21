/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Compass } from 'lucide-react';

export default function Footer() {
  return (
    <footer 
      className="bg-[#faf9f7] film-grain border-t border-brand-light-primary/5 py-16 px-6"
      id="footer"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          
          {/* Logo Column */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-brand-light-primary flex items-center justify-center">
                <Compass className="w-3.5 h-3.5 text-brand-light-surface" />
              </div>
              <span className="font-sans font-bold text-base tracking-tight text-brand-light-primary">
                lifeQuest
              </span>
            </div>
            <p className="text-xs text-brand-light-secondary leading-relaxed max-w-sm">
              A personal quest tracker for real accountability, with a light RPG layer that never gets in the way.
            </p>
          </div>

          {/* Product Column */}
          <div className="md:col-span-3 space-y-3.5">
            <h4 className="text-[10px] font-mono font-bold text-brand-light-primary uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-2.5 text-xs text-brand-light-secondary">
              <li>
                <a href="#how-it-works-section" className="hover:text-brand-light-primary transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="#features-section" className="hover:text-brand-light-primary transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#signin-section" className="hover:text-brand-light-primary transition-colors">
                  Sign In
                </a>
              </li>
            </ul>
          </div>

          {/* Principles Column */}
          <div className="md:col-span-3 space-y-3.5">
            <h4 className="text-[10px] font-mono font-bold text-brand-light-primary uppercase tracking-wider">
              Principles
            </h4>
            <ul className="space-y-2.5 text-[11px] text-brand-light-secondary font-mono leading-relaxed">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-brand-light-accent rounded-full shrink-0" />
                No automatic AI task creation
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-brand-light-accent rounded-full shrink-0" />
                XP is cosmetic, never functional
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-brand-light-accent rounded-full shrink-0" />
                Clarity over gamification
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright bar */}
        <div className="border-t border-brand-light-primary/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono text-brand-light-secondary">
          <span>
            &copy; Artur Wagner 2026. All rights preserved.
          </span>
          <span>
            lifeQuest, a personal productivity tool.
          </span>
        </div>

      </div>
    </footer>
  );
}
