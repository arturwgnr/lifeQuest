import { useState, useRef, useEffect } from "react";
import { ChatMessage, Task, AISuggestionCard, TaskCategory, TaskPriority } from "../types";
import { CATEGORY_CONFIG } from "./AttentionToday";
import { Send, Mic, Sparkles, Check, X, Edit2, AlertCircle, HelpCircle, CheckCircle } from "lucide-react";

interface OracleScreenProps {
  tasks: Task[];
  chatHistory: ChatMessage[];
  onAddMessage: (message: ChatMessage) => void;
  onApproveSuggestion: (suggestion: AISuggestionCard) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const NARRATION_PRESETS = [
  {
    label: "Log Finance & Health",
    text: "I finished auditing my weekly subscriptions today. Also, I need to schedule my dental cleaning tomorrow and start a 15-minute daily cardio quest."
  },
  {
    label: "Work & Bureaucracy",
    text: "I've drafted the monthly technical status report! It was tough. Next, I need to renew my international passport before it expires."
  },
  {
    label: "Personal Development",
    text: "I read Chapter 4 of Atomic Habits today! It was super inspiring. I want to plan a weekend dinner for my partner's birthday too."
  }
];

export default function OracleScreen({
  tasks,
  chatHistory,
  onAddMessage,
  onApproveSuggestion,
  isLoading,
  setIsLoading
}: OracleScreenProps) {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [activeSuggestions, setActiveSuggestions] = useState<AISuggestionCard[]>([]);
  
  // Suggestion editing states
  const [editingSuggestionId, setEditingSuggestionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<TaskCategory>("Finance");
  const [editPriority, setEditPriority] = useState<TaskPriority>("Side");
  const [editNotes, setEditNotes] = useState("");
  const [editXp, setEditXp] = useState(20);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading]);

  // Voice recording simulation
  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording and prefill with a random narration template
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      setIsRecording(false);
      setRecordingSeconds(0);
      
      const randomTexts = [
        "I just finished my dental checkup appointment, and tomorrow I have to balance our household budget spreadsheet.",
        "Today I spent 45 minutes on personal development reading. I also need to buy groceries for our relationship anniversary dinner.",
        "I completed the technical report draft! I also need to consolidate my tax forms as soon as possible."
      ];
      const randomText = randomTexts[Math.floor(Math.random() * randomTexts.length)];
      setInputText(randomText);
    } else {
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimer.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  // Submit Narration to Gemini
  const handleSubmitNarration = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    // 1. Add user message to history
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toISOString()
    };
    onAddMessage(userMsg);
    setInputText("");
    setIsLoading(true);

    try {
      // 2. Fetch from our Express Gemini endpoint
      const response = await fetch("/api/gemini/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          existingTasks: tasks
        })
      });

      const data = await response.json();
      
      // 3. Populate suggestions deck
      if (data.suggestions && Array.isArray(data.suggestions)) {
        const suggestionsWithId = data.suggestions.map((s: any, idx: number) => ({
          ...s,
          id: `sug-${Date.now()}-${idx}`
        }));
        setActiveSuggestions(suggestionsWithId);
      }

      // 4. Populate conversational response in chat
      const oracleMsg: ChatMessage = {
        id: `ora-${Date.now()}`,
        sender: "assistant",
        text: data.text || "I have received your narrative, traveler. Let us structure your quests.",
        timestamp: new Date().toISOString(),
        suggestions: data.suggestions || []
      };
      onAddMessage(oracleMsg);

      // 5. Populate clarifying question if exists
      if (data.question) {
        setTimeout(() => {
          const questionMsg: ChatMessage = {
            id: `q-${Date.now()}`,
            sender: "oracle-question",
            text: data.question,
            timestamp: new Date().toISOString()
          };
          onAddMessage(questionMsg);
        }, 800);
      }

    } catch (err) {
      console.error("Narration error:", err);
      const errorMsg: ChatMessage = {
        id: `ora-err-${Date.now()}`,
        sender: "assistant",
        text: "The mystical winds of connection are turbulent. I could not parse your narration. Please try again or check your server status.",
        timestamp: new Date().toISOString()
      };
      onAddMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Approve Suggestion
  const handleApprove = (suggestion: AISuggestionCard) => {
    onApproveSuggestion(suggestion);
    setActiveSuggestions(prev => prev.filter(s => s.id !== suggestion.id));

    // Append confirmation log to the message feed
    const confirmMsg: ChatMessage = {
      id: `ora-conf-${Date.now()}`,
      sender: "assistant",
      text: "",
      timestamp: new Date().toISOString(),
      confirmedAction: {
        type: "added",
        summary: `Quest cataloged: "${suggestion.title}" under ${suggestion.category} (+${suggestion.xp} XP)`
      }
    };
    onAddMessage(confirmMsg);
  };

  // Reject Suggestion
  const handleReject = (id: string) => {
    setActiveSuggestions(prev => prev.filter(s => s.id !== id));
  };

  // Edit Suggestion Setup
  const handleStartEdit = (sug: AISuggestionCard) => {
    setEditingSuggestionId(sug.id);
    setEditTitle(sug.title);
    setEditCategory(sug.category);
    setEditPriority(sug.priority);
    setEditNotes(sug.notes);
    setEditXp(sug.xp);
  };

  // Save edited suggestion
  const handleSaveEdit = (id: string) => {
    setActiveSuggestions(prev => prev.map(s => {
      if (s.id === id) {
        return {
          id,
          title: editTitle,
          category: editCategory,
          priority: editPriority,
          notes: editNotes,
          xp: editXp
        };
      }
      return s;
    }));
    setEditingSuggestionId(null);
  };

  // Answer Clarifying Question
  const handleAnswerQuestion = (answer: string) => {
    handleSubmitNarration(answer);
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 h-full max-h-[82vh]" id="oracle-screen-layout">
      {/* Left Panel: Chat Feed */}
      <div className="lg:col-span-7 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            <h3 className="text-sm font-semibold text-slate-900 font-mono">
              The Oracle's Whispers
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Powered by Gemini 3.5 Flash
          </span>
        </div>

        {/* Narrative Presets Panel */}
        <div className="px-4 py-2 border-b border-slate-100/60 bg-slate-50/20 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold font-mono text-slate-400 mr-1 uppercase">Narrations:</span>
          {NARRATION_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputText(preset.text);
              }}
              className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/30 text-slate-600 hover:text-indigo-700 transition-all cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[50vh] lg:max-h-[52vh]">
          {chatHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400 select-none space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-indigo-300" />
              <p className="text-xs font-sans">The Oracle sits quietly, awaiting your entry.</p>
              <p className="text-[10px] font-mono max-w-sm mx-auto">
                Narrate your daily progress or future plans naturally. I will help organize and formulate structured quests.
              </p>
            </div>
          ) : (
            chatHistory.map(msg => {
              if (msg.confirmedAction) {
                return (
                  <div key={msg.id} className="flex justify-center" id={`confirm-${msg.id}`}>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-750 border border-emerald-100 text-[10.5px] font-mono font-medium shadow-sm">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {msg.confirmedAction.summary}
                    </div>
                  </div>
                );
              }

              if (msg.sender === "oracle-question") {
                return (
                  <div key={msg.id} className="flex flex-col items-center max-w-md mx-auto" id={`question-${msg.id}`}>
                    <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-4 text-center space-y-3 shadow-sm">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-amber-900 font-sans">The Oracle seeks clarity:</h4>
                      <p className="text-xs text-amber-800 leading-relaxed font-sans">{msg.text}</p>
                      
                      <div className="flex items-center justify-center gap-1.5 pt-1.5">
                        <button
                          type="button"
                          onClick={() => handleAnswerQuestion("Yes, please complete the existing task.")}
                          className="px-3 py-1 text-[10px] font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all shadow-sm cursor-pointer"
                        >
                          "Yes, resolve existing quest"
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAnswerQuestion("No, this is a fresh new task.")}
                          className="px-3 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer"
                        >
                          "No, forge a new quest"
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              const isUser = msg.sender === "user";
              return (
                <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-md p-3.5 rounded-xl text-xs leading-relaxed ${
                    isUser
                      ? "bg-slate-900 text-white font-sans rounded-tr-none shadow-sm"
                      : "bg-slate-50 border border-slate-200 text-slate-800 font-sans rounded-tl-none"
                  }`}>
                    <p>{msg.text}</p>
                    <span className="block text-[9px] font-mono text-slate-400 mt-1 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl rounded-tl-none max-w-xs flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] font-mono text-slate-400">Meditating on your words...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputText.trim()) handleSubmitNarration(inputText);
            }}
            className="flex items-center gap-2 relative"
          >
            {/* Recording State Overlay */}
            {isRecording && (
              <div className="absolute inset-y-0 left-0 right-14 bg-slate-950/95 text-white flex items-center justify-between px-4 rounded-xl z-10 animate-fade-in">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <span className="text-xs font-mono font-medium">Recording Narrative: {recordingSeconds}s</span>
                  {/* CSS Voice wave animation */}
                  <div className="flex items-end gap-0.5 h-4">
                    <div className="w-0.5 bg-indigo-400 animate-pulse h-2" />
                    <div className="w-0.5 bg-indigo-400 animate-pulse h-4" style={{ animationDelay: "100ms" }} />
                    <div className="w-0.5 bg-indigo-400 animate-pulse h-1" style={{ animationDelay: "200ms" }} />
                    <div className="w-0.5 bg-indigo-400 animate-pulse h-3" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  className="text-xs font-mono font-bold bg-rose-600 hover:bg-rose-700 px-3 py-1 rounded-lg transition-all cursor-pointer"
                >
                  TRANSCRIBE
                </button>
              </div>
            )}

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Speak naturally: 'I completed my health quest and should start a work report tomorrow...'"
              className="flex-1 border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-slate-400 font-sans shadow-inner"
            />
            
            <button
              type="button"
              onClick={handleToggleRecording}
              className={`p-2.5 rounded-xl border transition-all shrink-0 cursor-pointer ${
                isRecording 
                  ? "bg-rose-50 text-rose-600 border-rose-200" 
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              }`}
              title="Dictate narration"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white transition-all shrink-0 shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Panel: AI Suggestions Deck */}
      <div className="lg:col-span-5 flex flex-col h-full overflow-hidden" id="ai-suggestions-deck">
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
            Oracle's Proposed Quests
          </h3>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 ml-auto">
            {activeSuggestions.length} Pending
          </span>
        </div>

        {activeSuggestions.length === 0 ? (
          <div className="flex-1 border border-dashed border-slate-200 rounded-xl bg-slate-50/40 p-6 flex flex-col items-center justify-center text-center select-none space-y-2 max-h-[50vh] lg:max-h-[52vh]">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-semibold text-slate-600 font-sans">No Pending Proposals</h4>
            <p className="text-[10px] font-mono text-slate-400 max-w-xs leading-relaxed">
              When you submit narrations, the Oracle's recommended task structures will align here for review before filing.
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[50vh] lg:max-h-[52vh] pr-1">
            {activeSuggestions.map(sug => {
              const isEditing = editingSuggestionId === sug.id;
              const config = CATEGORY_CONFIG[isEditing ? editCategory : sug.category];
              const CategoryIcon = config.icon;

              return (
                <div
                  key={sug.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all hover:border-slate-300"
                  id={`sug-card-${sug.id}`}
                >
                  {!isEditing ? (
                    // Read Card State
                    <>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${config.bgColor} ${config.color} border ${config.border}`}>
                          <CategoryIcon className="w-3 h-3" />
                          {sug.category}
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-slate-400">
                          <span className="bg-slate-100 px-1 py-0.2 rounded border border-slate-200 text-slate-600 capitalize">
                            {sug.priority}
                          </span>
                          <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-extrabold">
                            +{sug.xp} XP
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold font-sans text-slate-900 leading-tight">
                        {sug.title}
                      </h4>

                      <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                        {sug.notes || "No extra context parsed."}
                      </p>

                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100/60">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(sug)}
                          className="px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded border border-transparent transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(sug.id)}
                          className="px-2.5 py-1 text-[10px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(sug)}
                          className="px-3 py-1 text-[10px] font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve Quest
                        </button>
                      </div>
                    </>
                  ) : (
                    // Edit Card Form
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold font-mono text-slate-500 uppercase mb-0.5">Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-slate-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold font-mono text-slate-500 uppercase mb-0.5">Category</label>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value as TaskCategory)}
                            className="w-full text-[11px] border border-slate-200 rounded px-1.5 py-1 bg-white focus:outline-none focus:border-slate-400 cursor-pointer"
                          >
                            <option value="Finance">Finance</option>
                            <option value="Personal Development">Personal Development</option>
                            <option value="Work">Work</option>
                            <option value="Bureaucracy">Bureaucracy</option>
                            <option value="Health">Health</option>
                            <option value="Relationships">Relationships</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold font-mono text-slate-500 uppercase mb-0.5">Priority</label>
                          <select
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                            className="w-full text-[11px] border border-slate-200 rounded px-1.5 py-1 bg-white focus:outline-none focus:border-slate-400 cursor-pointer"
                          >
                            <option value="Main">Main</option>
                            <option value="Side">Side</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold font-mono text-slate-500 uppercase mb-0.5">Reward (XP)</label>
                          <input
                            type="number"
                            value={editXp}
                            onChange={(e) => setEditXp(Number(e.target.value))}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold font-mono text-slate-500 uppercase mb-0.5">Notes</label>
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          rows={2}
                          className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setEditingSuggestionId(null)}
                          className="px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-50 rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(sug.id)}
                          className="px-3 py-1 text-[10px] font-semibold bg-slate-900 text-white rounded cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
