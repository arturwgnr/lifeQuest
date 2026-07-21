/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, Mail, User, ArrowRight } from 'lucide-react';

interface SignInSectionProps {
  onLoginSuccess: (name: string, email: string) => void;
}

export default function SignInSection({ onLoginSuccess }: SignInSectionProps) {
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (isRegistering && !name)) {
      setErrorMsg('Please complete all fields.');
      return;
    }
    setErrorMsg(null);
    // Standard successful log in
    onLoginSuccess(isRegistering ? name : name || email.split('@')[0], email);
  };

  return (
    <section 
      className="relative bg-[#faf9f7] film-grain py-24 px-6 overflow-hidden border-t border-brand-light-primary/5"
      id="signin-section"
    >
      {/* Background Subtle Grid Texture */}
      <div className="absolute inset-0 grid-texture-light opacity-50 pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Side: Copy */}
        <div className="lg:col-span-6 space-y-6" id="signin-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-light-accent/10 rounded-full border border-brand-light-accent/10">
            <Shield className="w-3.5 h-3.5 text-brand-light-accent" />
            <span className="text-[10px] font-mono font-medium tracking-wider text-brand-light-accent uppercase">
              100% Sovereign productivity
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-sans font-extrabold tracking-tight text-brand-light-primary">
            Your day, organized honestly.
          </h2>

          <p className="text-brand-light-secondary text-sm sm:text-base leading-relaxed max-w-lg">
            Free to run on your own infrastructure, nothing locked behind a paywall. Sign in and see what actually needs you today.
          </p>

          <div className="pt-2 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-light-accent" />
              <span className="text-xs font-sans text-brand-light-secondary">
                No telemetry, no analytics cookies, no trackers.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-light-accent" />
              <span className="text-xs font-sans text-brand-light-secondary">
                XP levels are purely aesthetic; work is never turned into a slot machine.
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Sign In / Register Card */}
        <div className="lg:col-span-6 flex justify-center" id="signin-right-card">
          <motion.div 
            className="w-full max-w-[420px] bg-brand-light-surface border border-brand-light-primary/10 rounded-2xl p-8 shadow-xl relative"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
          >
            {/* Soft Warm Background Blur */}
            <div className="absolute -inset-1 bg-brand-light-accent/5 rounded-3xl filter blur-xl -z-10" />

            <div className="space-y-2 mb-6">
              <h3 className="text-lg font-sans font-bold text-brand-light-primary tracking-tight">
                Ready when you are
              </h3>
              <p className="text-xs text-brand-light-secondary leading-relaxed">
                {isRegistering 
                  ? "Set up your Quest Log workspace with your name and email in under a minute."
                  : "Sign in to your existing quest log, or set one up, name, email, done, in under a minute."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-brand-light-secondary uppercase tracking-wider">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-light-secondary/60" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Avery Vance"
                      className="w-full pl-10 pr-4 py-2.5 border border-brand-light-primary/10 rounded-lg bg-brand-light-bg text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-light-accent text-brand-light-primary"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-brand-light-secondary uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-light-secondary/60" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. avery@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-brand-light-primary/10 rounded-lg bg-brand-light-bg text-xs font-sans focus:outline-none focus:ring-1 focus:ring-brand-light-accent text-brand-light-primary"
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-[11px] font-mono text-red-600">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-brand-light-primary hover:bg-brand-light-primary/95 text-brand-light-surface rounded-lg font-sans font-medium text-xs transition-custom flex items-center justify-center gap-2 group shadow-sm"
              >
                {isRegistering ? "Create Quest Log" : "Sign In to Quest Log"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            {/* Switch Mode Link */}
            <div className="mt-5 text-center border-t border-brand-light-primary/5 pt-4">
              <button
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setErrorMsg(null);
                }}
                className="text-[11px] font-mono text-brand-light-accent hover:underline font-medium"
              >
                {isRegistering 
                  ? "Already have a quest log? Sign In" 
                  : "New here? Start your quest log"}
              </button>
            </div>

          </motion.div>
        </div>

      </div>
    </section>
  );
}
