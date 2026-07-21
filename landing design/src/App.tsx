/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import SignInSection from './components/SignInSection';
import Footer from './components/Footer';
import QuestLogDashboard from './components/QuestLogDashboard';
import { Task, UserProfile } from './types';

export default function App() {
  // Global user XP and level state that synchronizes across components
  const [guestXp, setGuestXp] = useState<number>(35);
  const [guestLevel, setGuestLevel] = useState<number>(1);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    xp: 35,
    level: 1,
    isLoggedIn: false
  });

  // Prepopulated high-fidelity seed tasks
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'task-1',
      title: "Review Q3 financial reports",
      category: "Finance",
      priority: "medium",
      dependency: null,
      isAvoided: false,
      reason: "Necessary prerequisite. Clean data prevents structural errors.",
      isApproved: true,
      isCompleted: false,
      createdAt: "2026-07-20"
    },
    {
      id: 'task-2',
      title: "Consolidate retirement portfolio",
      category: "Finance",
      priority: "high",
      dependency: "Review Q3 financial reports",
      isAvoided: true,
      reason: "Oracle flagged: Avoided for 14 days straight. Bob is waiting on this draft.",
      isApproved: true,
      isCompleted: false,
      createdAt: "2026-07-14"
    },
    {
      id: 'task-3',
      title: "Schedule physical gym evaluation",
      category: "Health",
      priority: "medium",
      dependency: null,
      isAvoided: true,
      reason: "Procrastination detected; initial physical fitness booking delayed.",
      isApproved: true,
      isCompleted: false,
      createdAt: "2026-07-19"
    }
  ]);

  // Synchronize XP levels
  const handleIncrementXp = (amount: number) => {
    setGuestXp(prev => {
      const nextXp = prev + amount;
      if (nextXp >= 100) {
        setGuestLevel(lvl => lvl + 1);
        return nextXp - 100;
      }
      return nextXp;
    });
  };

  useEffect(() => {
    setUserProfile(prev => ({
      ...prev,
      xp: guestXp,
      level: guestLevel
    }));
  }, [guestXp, guestLevel]);

  // Appending task from any part of landing page / demo oracle to master tasks
  const handleTaskApproved = (newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
  };

  const handleLoginSuccess = (name: string, email: string) => {
    setIsLoggedIn(true);
    setUserProfile({
      name,
      email,
      xp: guestXp,
      level: guestLevel,
      isLoggedIn: true
    });
    // Scroll window smoothly to top upon sign-in
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserProfile({
      name: '',
      email: '',
      xp: 35,
      level: 1,
      isLoggedIn: false
    });
    setGuestXp(35);
    setGuestLevel(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSignIn = () => {
    const section = document.getElementById('signin-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-brand-light-bg text-brand-light-primary selection:bg-brand-light-accent/20 overflow-x-hidden">
      {/* Premium background texture */}
      <div className="paper-texture-overlay" />
      
      {/* Shared Navigation Bar */}
      <NavBar 
        onSignInClick={scrollToSignIn}
        onRegisterClick={scrollToSignIn}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        userName={userProfile.name}
      />

      {isLoggedIn ? (
        /* Immersive Task Workspace Dashboard */
        <QuestLogDashboard 
          user={userProfile}
          initialTasks={tasks}
          onLogout={handleLogout}
          guestXp={guestXp}
          guestLevel={guestLevel}
          onIncrementXp={handleIncrementXp}
        />
      ) : (
        /* Marketing Redesign Landing Page */
        <main className="flex flex-col">
          {/* Hero Section */}
          <Hero onCtaClick={scrollToSignIn} />

          {/* How It Works Section with sandbox oracle simulator */}
          <HowItWorks 
            onTaskApproved={handleTaskApproved}
            guestXp={guestXp}
            guestLevel={guestLevel}
            onIncrementXp={handleIncrementXp}
          />

          {/* Features Section (Strict Dark Theme anchor) */}
          <Features />

          {/* Sign In & Setup Section */}
          <SignInSection onLoginSuccess={handleLoginSuccess} />

          {/* Footer block */}
          <Footer />
        </main>
      )}

    </div>
  );
}
