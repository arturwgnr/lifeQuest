import { useState, FormEvent } from "react";
import { UserProfile } from "../types";
import AvatarBadge from "./AvatarBadge";
import { Shield, Sparkles, User, Mail, Lock, CheckCircle2 } from "lucide-react";

interface LoginSetupProps {
  onComplete: (user: UserProfile) => void;
}

export default function LoginSetup({ onComplete }: LoginSetupProps) {
  // Steps: 'login' | 'setup'
  const [step, setStep] = useState<'login' | 'setup'>('login');

  // Login inputs
  const [email, setEmail] = useState("maia.odetes@gmail.com");
  const [password, setPassword] = useState("••••••••••••");

  // Setup inputs
  const [name, setName] = useState("Maia Odetes");

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setStep('setup');
  };

  const handleSetupSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newUser: UserProfile = {
      name: name.trim() || "Maia Odetes",
      xp: 0,
      level: 1,
      avatarState: 1,
      isSetup: true,
      isLoggedIn: true
    };
    onComplete(newUser);
  };

  if (step === 'login') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-stone-50/50" id="login-container">
        <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900 font-sans">
              Personal Quest Tracker
            </h1>
            <p className="text-xs text-stone-500 font-mono">
              Secure Accountability Log & Productivity Engine
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold font-mono text-stone-500 uppercase mb-1">
                Account Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 bg-white focus:outline-none focus:border-stone-400 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold font-mono text-stone-500 uppercase mb-1">
                Secret Phrase / Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 bg-white focus:outline-none focus:border-stone-400 font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-stone-900 hover:bg-stone-800 text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              Sign In to Quest Log
            </button>
          </form>

          <div className="pt-4 border-t border-stone-100 text-center">
            <p className="text-[10px] font-mono text-stone-400">
              Welcome back, chronicler. Align your day with purpose.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // First-Time Onboarding / Setup
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-stone-50/50" id="onboarding-container">
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Sparkles className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-stone-900 font-sans">
            First-Time Setup
          </h1>
          <p className="text-xs text-stone-500 font-sans">
            Configure your personal chronicle sentinel.
          </p>
        </div>

        {/* Minimal Avatar Starting State */}
        <div className="flex flex-col items-center justify-center p-4 bg-stone-50 border border-stone-150 rounded-xl space-y-2">
          <AvatarBadge level={1} xp={0} className="w-16 h-16" />
          <div className="text-center">
            <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
              Level 1 Sentinel State
            </span>
            <span className="text-xs font-semibold text-stone-700 font-sans block mt-0.5">
              Silent Silhouette
            </span>
          </div>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSetupSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold font-mono text-stone-500 uppercase mb-1">
              Your Chronicler Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Maia Odetes"
                className="w-full text-xs border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 bg-white focus:outline-none focus:border-stone-400 font-sans font-medium"
              />
            </div>
          </div>

          {/* Explanation of XP */}
          <div className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-xl space-y-2 select-none">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-indigo-800">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              Mechanism of Quest Progression
            </div>
            <p className="text-xs text-indigo-900/80 leading-relaxed font-sans">
              Complete tasks to earn Experience Points (XP) and advance levels. Gaining levels unlocks visual enhancements for your core profile avatar, reflecting your real-world progress.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-stone-900 hover:bg-stone-800 text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            Forge Character & Embark
          </button>
        </form>
      </div>
    </div>
  );
}
