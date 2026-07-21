/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, Check, BarChart3, Sparkles, Loader2, 
  AlertTriangle, GitBranch, CheckSquare, Plus, Trash2, Trophy
} from 'lucide-react';
import { Task } from '../types';

interface HowItWorksProps {
  onTaskApproved: (task: Task) => void;
  guestXp: number;
  guestLevel: number;
  onIncrementXp: (amount: number) => void;
}

export default function HowItWorks({
  onTaskApproved,
  guestXp,
  guestLevel,
  onIncrementXp
}: HowItWorksProps) {
  // Demo interactive states
  const [activeStep, setActiveStep] = useState<number>(1);
  const [rawThoughts, setRawThoughts] = useState<string>(
    "Stalled again today on the Q3 Finance Reorganization because I need to compile raw database metrics first. Also I was supposed to consolidate my retirement portfolio but the form is too confusing."
  );
  const [isConsulting, setIsConsulting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Pending suggestions for approval
  const [suggestions, setSuggestions] = useState<any[]>([]);
  // Local list of active approved tasks for the demo tracker
  const [demoTasks, setDemoTasks] = useState<Task[]>([]);
  const [floatingXp, setFloatingXp] = useState<number | null>(null);

  const handleConsultOracle = async () => {
    setIsConsulting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawThoughts }),
      });
      const data = await res.json();
      if (res.ok && data.suggestions) {
        setSuggestions(data.suggestions);
        setActiveStep(2); // Advance to review step
      } else {
        throw new Error(data.error || "Failed to consult the Oracle.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Let's use local backup.");
      // Soft fallback matching the heuristic server model
      setSuggestions([
        {
          title: "Consolidate retirement portfolio",
          category: "Finance",
          priority: "high",
          dependency: "Review Q3 financial reports",
          isAvoided: true,
          reason: "Oracle detected 14 days of avoidance due to administrative friction."
        },
        {
          title: "Compile raw database metrics",
          category: "Finance",
          priority: "medium",
          dependency: null,
          isAvoided: false,
          reason: "Required blocker before starting Q3 reorganization."
        }
      ]);
      setActiveStep(2);
    } finally {
      setIsConsulting(false);
    }
  };

  const handleApproveSuggestion = (sug: any, index: number) => {
    const newTask: Task = {
      id: `demo-${Date.now()}-${index}`,
      title: sug.title,
      category: sug.category,
      priority: sug.priority,
      dependency: sug.dependency,
      isAvoided: sug.isAvoided,
      reason: sug.reason,
      isApproved: true,
      isCompleted: false,
      createdAt: new Date().toLocaleDateString()
    };

    // Add to demo tracker state
    setDemoTasks(prev => [newTask, ...prev]);
    // Notify parent
    onTaskApproved(newTask);
    
    // Play XP award sound / animation
    onIncrementXp(15);
    setFloatingXp(15);
    setTimeout(() => setFloatingXp(null), 1000);

    // Remove from pending suggestions
    setSuggestions(prev => prev.filter((_, i) => i !== index));

    if (suggestions.length <= 1) {
      setActiveStep(3); // Advance to tracking once approved
    }
  };

  const handleRejectSuggestion = (index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
    if (suggestions.length <= 1) {
      setActiveStep(1); // Go back to raw thoughts if empty
    }
  };

  const handleToggleComplete = (id: string) => {
    setDemoTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextState = !t.isCompleted;
        if (nextState) {
          onIncrementXp(25);
          setFloatingXp(25);
          setTimeout(() => setFloatingXp(null), 1000);
        }
        return { ...t, isCompleted: nextState };
      }
      return t;
    }));
  };

  return (
    <section 
      className="relative min-h-screen flex flex-col justify-center bg-brand-light-bg film-grain border-y border-brand-light-primary/5 py-24 px-6 overflow-hidden"
      id="how-it-works-section"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 grid-texture-light opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col gap-12">
        
        {/* Title and Subtitle */}
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-semibold text-brand-light-accent uppercase tracking-widest">
            The Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-sans font-extrabold tracking-tight text-brand-light-primary">
            How it works
          </h2>
          <p className="text-brand-light-secondary text-sm sm:text-base max-w-2xl mx-auto">
            The same three steps, every day, no loot, no timers, no artificial urgency.
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch mt-6">
          
          {/* Left Column: Numbered Steps List */}
          <div className="lg:col-span-5 flex flex-col justify-center gap-6" id="how-steps-list">
            
            {/* Step 1 */}
            <div 
              onClick={() => setActiveStep(1)}
              className={`p-5 rounded-xl border transition-all duration-300 cursor-pointer flex gap-4 ${
                activeStep === 1 
                  ? 'bg-brand-light-surface border-brand-light-primary/10 shadow-md scale-[1.01]' 
                  : 'bg-transparent border-transparent hover:bg-brand-light-primary/5'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                activeStep === 1 ? 'bg-brand-light-primary text-brand-light-surface' : 'bg-brand-light-primary/5 text-brand-light-primary'
              }`}>
                <Mic className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-brand-light-accent font-bold uppercase tracking-wider">Step 01</span>
                  <h3 className="text-sm font-sans font-bold text-brand-light-primary">Narrate your day</h3>
                </div>
                <p className="text-xs text-brand-light-secondary leading-relaxed">
                  Tell the Oracle what you did, what's stuck, and what's next, type it or say it.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div 
              onClick={() => suggestions.length > 0 ? setActiveStep(2) : null}
              className={`p-5 rounded-xl border transition-all duration-300 ${
                suggestions.length > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              } flex gap-4 ${
                activeStep === 2 
                  ? 'bg-brand-light-surface border-brand-light-primary/10 shadow-md scale-[1.01]' 
                  : 'bg-transparent border-transparent hover:bg-brand-light-primary/5'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                activeStep === 2 ? 'bg-brand-light-primary text-brand-light-surface' : 'bg-brand-light-primary/5 text-brand-light-primary'
              }`}>
                <Check className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-brand-light-accent font-bold uppercase tracking-wider">Step 02</span>
                  <h3 className="text-sm font-sans font-bold text-brand-light-primary">Review & approve</h3>
                </div>
                <p className="text-xs text-brand-light-secondary leading-relaxed">
                  The Oracle turns that into task suggestions. Nothing's saved until you approve, edit, or reject it.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div 
              onClick={() => demoTasks.length > 0 ? setActiveStep(3) : null}
              className={`p-5 rounded-xl border transition-all duration-300 ${
                demoTasks.length > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              } flex gap-4 ${
                activeStep === 3 
                  ? 'bg-brand-light-surface border-brand-light-primary/10 shadow-md scale-[1.01]' 
                  : 'bg-transparent border-transparent hover:bg-brand-light-primary/5'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                activeStep === 3 ? 'bg-brand-light-primary text-brand-light-surface' : 'bg-brand-light-primary/5 text-brand-light-primary'
              }`}>
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-brand-light-accent font-bold uppercase tracking-wider">Step 03</span>
                  <h3 className="text-sm font-sans font-bold text-brand-light-primary">Track real progress</h3>
                </div>
                <p className="text-xs text-brand-light-secondary leading-relaxed">
                  Categories, chains, and a quiet XP counter keep the full picture visible, without turning work into a game.
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Live Interactive Sandbox Console */}
          <div className="lg:col-span-7 flex flex-col justify-stretch" id="how-interactive-sandbox">
            <div className="bg-brand-light-surface border border-brand-light-primary/10 rounded-2xl shadow-xl overflow-hidden flex flex-col h-full min-h-[460px] relative">
              
              {/* Sandbox Top Bar */}
              <div className="bg-brand-light-primary/[0.02] border-b border-brand-light-primary/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                  <span className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                  <span className="text-xs font-mono text-brand-light-secondary ml-2 font-medium">
                    lifeQuest Simulator Terminal
                  </span>
                </div>
                
                {/* Floating XP Alert badge */}
                <div className="flex items-center gap-3">
                  <AnimatePresence>
                    {floatingXp !== null && (
                      <motion.span
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: -2, scale: 1.1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs font-mono font-bold text-brand-light-accent"
                      >
                        +{floatingXp} XP
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-light-accent/10 border border-brand-light-accent/10 rounded-md">
                    <Trophy className="w-3.5 h-3.5 text-brand-light-accent" />
                    <span className="text-xs font-mono font-bold text-brand-light-accent">
                      Lv.{guestLevel} ({guestXp}/100)
                    </span>
                  </div>
                </div>
              </div>

              {/* Sandbox Body Content */}
              <div className="p-6 flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  
                  {/* Step 1 Panel: Narrate Your Day */}
                  {activeStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 flex flex-col h-full justify-between"
                    >
                      <div className="space-y-2">
                        <label className="text-xs font-mono font-semibold text-brand-light-secondary uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-brand-light-accent" />
                          Narrate what is happening in plain English
                        </label>
                        <textarea
                          value={rawThoughts}
                          onChange={(e) => setRawThoughts(e.target.value)}
                          className="w-full h-40 p-4 border border-brand-light-primary/10 rounded-xl bg-brand-light-bg text-sm font-sans focus:outline-none focus:ring-1 focus:ring-brand-light-accent text-brand-light-primary leading-relaxed resize-none"
                          placeholder="What did you do, what is blocked, what are you hesitating on?"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
                        <span className="text-[11px] font-mono text-brand-light-secondary leading-normal max-w-sm">
                          💡 Write something about "finances" or "exercise" to see tailored structures.
                        </span>
                        
                        <button
                          onClick={handleConsultOracle}
                          disabled={isConsulting || !rawThoughts.trim()}
                          className="px-5 py-3 bg-brand-light-primary hover:bg-brand-light-primary/95 disabled:bg-brand-light-primary/40 text-brand-light-surface rounded-lg font-sans font-medium text-xs transition-custom flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          {isConsulting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              The Oracle is listening...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-brand-light-accent" />
                              Consult the Oracle
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2 Panel: Review & Approve */}
                  {activeStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="flex justify-between items-center pb-2">
                        <h4 className="text-xs font-mono font-semibold text-brand-light-secondary uppercase tracking-wider flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-brand-light-accent" />
                          Proposed Tasks Waiting For Approval ({suggestions.length})
                        </h4>
                        <button 
                          onClick={() => setActiveStep(1)}
                          className="text-xs font-mono text-brand-light-accent hover:underline"
                        >
                          ← Re-narrate
                        </button>
                      </div>

                      <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1">
                        {suggestions.map((sug, i) => (
                          <div 
                            key={i}
                            className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all bg-brand-light-bg ${
                              sug.isAvoided 
                                ? 'border-brand-light-accent/20 border-l-4 border-l-brand-light-accent' 
                                : 'border-brand-light-primary/5'
                            }`}
                          >
                            <div className="space-y-1.5 max-w-[70%]">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="font-sans font-bold text-xs text-brand-light-primary leading-tight">
                                  {sug.title}
                                </span>
                                <span className="px-1.5 py-0.5 text-[9px] font-mono bg-brand-light-primary/5 text-brand-light-primary rounded uppercase">
                                  {sug.category}
                                </span>
                                {sug.isAvoided && (
                                  <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono bg-brand-light-accent/10 text-brand-light-accent rounded-full font-bold">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    Avoiding
                                  </span>
                                )}
                              </div>
                              
                              {sug.dependency && (
                                <p className="text-[10px] font-mono text-brand-light-secondary flex items-center gap-1">
                                  <GitBranch className="w-3 h-3 text-brand-light-primary/30" />
                                  Depends on: <span className="font-semibold text-brand-light-primary">{sug.dependency}</span>
                                </p>
                              )}

                              <p className="text-[10px] text-brand-light-secondary leading-relaxed font-sans italic">
                                "{sug.reason}"
                              </p>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              <button
                                onClick={() => handleRejectSuggestion(i)}
                                className="px-3 py-1.5 text-[10px] font-medium border border-red-200 hover:bg-red-50 text-red-600 rounded-md transition-custom"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleApproveSuggestion(sug, i)}
                                className="px-3 py-1.5 text-[10px] font-medium bg-brand-light-primary text-brand-light-surface hover:bg-brand-light-primary/95 rounded-md transition-custom"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        ))}

                        {suggestions.length === 0 && (
                          <div className="text-center py-8 space-y-2">
                            <p className="text-xs text-brand-light-secondary font-sans">
                              All tasks have been processed!
                            </p>
                            <button
                              onClick={() => setActiveStep(3)}
                              className="px-4 py-2 bg-brand-light-primary text-brand-light-surface rounded-md text-xs font-medium"
                            >
                              Check Your Progress
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3 Panel: Track Real Progress */}
                  {activeStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="flex justify-between items-center pb-2">
                        <h4 className="text-xs font-mono font-semibold text-brand-light-secondary uppercase tracking-wider flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4 text-brand-light-primary" />
                          Approved Quest Log ({demoTasks.length} active)
                        </h4>
                        <button 
                          onClick={() => setActiveStep(1)}
                          className="text-xs font-mono text-brand-light-accent hover:underline"
                        >
                          + Narrate More
                        </button>
                      </div>

                      <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
                        {demoTasks.map((task) => (
                          <div 
                            key={task.id}
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                              task.isCompleted 
                                ? 'bg-brand-light-primary/[0.01] border-brand-light-primary/5 opacity-60' 
                                : 'bg-brand-light-bg border-brand-light-primary/10'
                            }`}
                          >
                            <div className="flex items-center gap-3 max-w-[80%]">
                              <input
                                type="checkbox"
                                checked={task.isCompleted}
                                onChange={() => handleToggleComplete(task.id)}
                                className="w-4.5 h-4.5 rounded border-brand-light-primary/20 accent-brand-light-accent cursor-pointer"
                              />
                              <div className="space-y-0.5">
                                <span className={`text-xs font-sans font-bold text-brand-light-primary block ${
                                  task.isCompleted ? 'line-through text-brand-light-secondary' : ''
                                }`}>
                                  {task.title}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-mono text-brand-light-secondary uppercase">
                                    {task.category}
                                  </span>
                                  {task.isAvoided && !task.isCompleted && (
                                    <span className="text-[9px] font-mono text-brand-light-accent font-semibold flex items-center gap-0.5">
                                      ● flagged
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className="text-[10px] font-mono text-brand-light-secondary shrink-0">
                              {task.isCompleted ? "Completed" : "+25 XP"}
                            </span>
                          </div>
                        ))}

                        {demoTasks.length === 0 && (
                          <div className="text-center py-12 space-y-3">
                            <p className="text-xs text-brand-light-secondary max-w-sm mx-auto font-sans">
                              Your approved quest list is currently empty. Head back to Step 1 to narrate your day and generate suggestions.
                            </p>
                            <button
                              onClick={() => setActiveStep(1)}
                              className="px-4 py-2 bg-brand-light-primary text-brand-light-surface rounded-md text-xs font-medium"
                            >
                              Go to Step 1
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Terminal Footer */}
              <div className="bg-brand-light-primary/[0.01] border-t border-brand-light-primary/5 px-6 py-3 flex justify-between items-center text-[10px] font-mono text-brand-light-secondary">
                <span>Oracle Version 1.0.0 (Lite)</span>
                <span>Active Session: Anonymous Questor</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
