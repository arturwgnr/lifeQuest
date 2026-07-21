/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Compass } from 'lucide-react';

interface NavBarProps {
  onSignInClick: () => void;
  onRegisterClick: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  userName?: string;
}

export default function NavBar({
  onSignInClick,
  onRegisterClick,
  isLoggedIn,
  onLogout,
  userName,
}: NavBarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-brand-light-bg/85 dark:bg-brand-dark-bg/85 backdrop-blur-md border-b border-brand-light-primary/5 dark:border-brand-dark-primary/5 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left Side: Logo & Name */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          id="nav-logo-container"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-light-primary dark:bg-brand-dark-accent flex items-center justify-center transition-colors duration-300">
            <Compass className="w-4 h-4 text-brand-light-surface dark:text-brand-dark-bg group-hover:rotate-45 transition-transform duration-500 ease-out" />
          </div>
          <span className="font-sans font-bold text-lg tracking-tight text-brand-light-primary dark:text-brand-dark-primary transition-colors">
            lifeQuest
          </span>
        </div>

        {/* Right Side: CTA Buttons */}
        <div className="flex items-center gap-4" id="nav-actions-container">
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-brand-light-secondary dark:text-brand-dark-secondary hidden sm:inline">
                Quest Log: <span className="text-brand-light-primary dark:text-brand-dark-primary font-semibold">{userName}</span>
              </span>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-xs font-medium border border-brand-light-primary/10 dark:border-brand-dark-primary/10 rounded-md hover:bg-brand-light-primary/5 dark:hover:bg-brand-dark-primary/5 text-brand-light-primary dark:text-brand-dark-primary transition-custom"
                id="btn-logout"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={onSignInClick}
                className="px-4 py-2 text-xs font-medium text-brand-light-secondary dark:text-brand-dark-secondary hover:text-brand-light-primary dark:hover:text-brand-dark-primary transition-custom"
                id="btn-nav-signin"
              >
                Sign In
              </button>
              <button
                onClick={onRegisterClick}
                className="px-4 py-2 text-xs font-medium bg-brand-light-primary dark:bg-brand-dark-accent text-brand-light-surface dark:text-brand-dark-bg rounded-md hover:bg-brand-light-primary/90 dark:hover:bg-brand-dark-accent/90 transition-custom shadow-sm font-sans"
                id="btn-nav-register"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
