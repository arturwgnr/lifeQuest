import { useEffect, useRef, useState } from "react";
import { Send, Mic, Sparkles, Check, X, Edit2, HelpCircle } from "lucide-react";
import { api } from "../api/client.js";
import { useCategories } from "../context/CategoriesContext.jsx";
import {
  playMessageSent,
  playMessageReceived,
  playQuestProposed,
  playApprove,
  playReject,
} from "../utils/soundEffects.js";
import LoadingIndicator from "./LoadingIndicator.jsx";
import "../styles/OracleScreen.css";

const RECORDING_MAX_DURATION_MS = 60 * 1000;

const NARRATION_PRESETS = [
  {
    label: "Log Finance & Health",
    text: "I finished auditing my weekly subscriptions today. Also, I need to schedule my dental cleaning tomorrow and start a 15-minute daily cardio quest.",
  },
  {
    label: "Work & Bureaucracy",
    text: "I've drafted the monthly technical status report! It was tough. Next, I need to renew my international passport before it expires.",
  },
  {
    label: "Personal Development",
    text: "I read Chapter 4 of Atomic Habits today! It was super inspiring. I want to plan a weekend dinner for my partner's birthday too.",
  },
];

const SpeechRecognitionApi =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

function pendingSuggestionsFrom(messages) {
  return messages.flatMap((m) =>
    (m.suggestions || [])
      .filter((s) => s.status === "PENDING")
      .map((s) => ({ ...s, messageId: m.id })),
  );
}

export default function OracleScreen() {
  const { categories, getCategoryDisplay } = useCategories();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [aiUsage, setAiUsage] = useState(null);

  const [editingSuggestionId, setEditingSuggestionId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editPriorityType, setEditPriorityType] = useState("SIDE");
  const [editNotes, setEditNotes] = useState("");
  const [editXp, setEditXp] = useState(20);

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const recordingTimeoutRef = useRef(null);

  const reloadConversation = async () => {
    const { messages: loaded } = await api.oracle.conversation();
    setMessages(loaded);
    return loaded;
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await reloadConversation();
      setIsLoading(false);
    })();
    api.profile.aiUsage().then(setAiUsage);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const clearRecordingTimeout = () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
  };

  // Recording should only ever end for two reasons: the user clicks the mic
  // again, or the 1-minute cap below fires. `continuous: true` disables the
  // browser's own built-in silence/pause auto-stop so neither sneaks in as a
  // third, unwanted stop condition.
  const handleToggleRecording = () => {
    if (!SpeechRecognitionApi) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setIsTranscribing(true);
      clearRecordingTimeout();
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => {
      setIsRecording(false);
      setIsTranscribing(false);
      clearRecordingTimeout();
    };
    recognition.onerror = () => {
      setIsRecording(false);
      setIsTranscribing(false);
      clearRecordingTimeout();
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setIsTranscribing(false);

    recordingTimeoutRef.current = setTimeout(() => {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setIsTranscribing(true);
    }, RECORDING_MAX_DURATION_MS);
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      clearRecordingTimeout();
    };
  }, []);

  const handleSubmitNarration = async (textToSend) => {
    if (!textToSend.trim() || isSending) return;

    const beforeCount = pendingSuggestionsFrom(messages).length;

    // Optimistic UI: render the user's own bubble immediately instead of
    // waiting on the Oracle's reply, which is swapped in wholesale (replacing
    // this temporary entry) once reloadConversation resolves below.
    const optimisticMessage = {
      id: `optimistic-${Date.now()}`,
      sender: "USER",
      text: textToSend,
      createdAt: new Date().toISOString(),
      suggestions: [],
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText("");
    playMessageSent();
    setIsSending(true);

    try {
      await api.oracle.sendMessage(textToSend);
      const loaded = await reloadConversation();
      const afterCount = pendingSuggestionsFrom(loaded).length;
      if (afterCount > beforeCount) playQuestProposed();
      else playMessageReceived();
    } catch {
      // The backend persists an error message on the conversation even on failure; reload picks it up.
      await reloadConversation();
    } finally {
      setIsSending(false);
      api.profile.aiUsage().then(setAiUsage);
    }
  };

  const handleAnswerQuestion = (answer) => handleSubmitNarration(answer);

  const updateSuggestionLocally = (id, patch) => {
    setMessages((prev) =>
      prev.map((m) => ({
        ...m,
        suggestions: (m.suggestions || []).map((s) =>
          s.id === id ? { ...s, ...patch } : s,
        ),
      })),
    );
  };

  const handleApprove = async (suggestion) => {
    await api.oracle.approveSuggestion(suggestion.id);
    updateSuggestionLocally(suggestion.id, { status: "APPROVED" });
    playApprove();
  };

  const handleReject = async (suggestion) => {
    await api.oracle.rejectSuggestion(suggestion.id);
    updateSuggestionLocally(suggestion.id, { status: "REJECTED" });
    playReject();
  };

  const handleStartEdit = (suggestion) => {
    setEditingSuggestionId(suggestion.id);
    setEditTitle(suggestion.title);
    setEditCategoryId(suggestion.categoryId);
    setEditPriorityType(suggestion.priorityType);
    setEditNotes(suggestion.notes || "");
    setEditXp(suggestion.xpValue);
  };

  const handleSaveEdit = async (id) => {
    const patch = {
      title: editTitle,
      categoryId: editCategoryId,
      priorityType: editPriorityType,
      notes: editNotes,
      xpValue: editXp,
    };
    await api.oracle.editSuggestion(id, patch);
    updateSuggestionLocally(id, patch);
    setEditingSuggestionId(null);
  };

  const pendingSuggestions = pendingSuggestionsFrom(messages);

  if (isLoading)
    return (
      <div className="oracle-screen__loading">
        <LoadingIndicator variant="panel" size="lg" label="Consulting the Oracle..." />
      </div>
    );

  return (
    <div className="oracle-screen">
      <div className="oracle-screen__chat">
        <div className="oracle-screen__chat-header">
          <div>
            <Sparkles size={16} />
            <h3>The Oracle's Whispers</h3>
          </div>
          <span className="oracle-screen__chat-header-meta">
            Powered by the Oracle
            {aiUsage && (
              <span className="oracle-screen__ai-usage">
                {aiUsage.remaining}/{aiUsage.limit} today
              </span>
            )}
          </span>
        </div>

        <div className="oracle-screen__presets">
          <span>Narrations:</span>
          {NARRATION_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setInputText(preset.text)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="oracle-screen__stream">
          {messages.length === 0 ? (
            <div className="oracle-screen__empty">
              <Sparkles size={28} />
              <p>The Oracle sits quietly, awaiting your entry.</p>
              <p className="oracle-screen__empty-sub">
                Narrate your daily progress or future plans naturally. I will
                help organize and formulate structured quests.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              if (msg.sender === "ORACLE_QUESTION") {
                return (
                  <div key={msg.id} className="oracle-screen__question">
                    <div className="oracle-screen__question-icon">
                      <HelpCircle size={16} />
                    </div>
                    <h4>The Oracle seeks clarity:</h4>
                    <p>{msg.text}</p>
                    <div className="oracle-screen__question-actions">
                      <button
                        type="button"
                        onClick={() =>
                          handleAnswerQuestion(
                            "Yes, please complete the existing task.",
                          )
                        }
                      >
                        "Yes, resolve existing quest"
                      </button>
                      <button
                        type="button"
                        className="oracle-screen__question-actions-secondary"
                        onClick={() =>
                          handleAnswerQuestion("No, this is a fresh new task.")
                        }
                      >
                        "No, forge a new quest"
                      </button>
                    </div>
                  </div>
                );
              }

              const isUser = msg.sender === "USER";
              return (
                <div
                  key={msg.id}
                  className={`oracle-screen__bubble-row ${isUser ? "oracle-screen__bubble-row--user" : ""}`}
                >
                  <div
                    className={`oracle-screen__bubble ${isUser ? "oracle-screen__bubble--user" : "oracle-screen__bubble--assistant"}`}
                  >
                    <p>{msg.text}</p>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          {isSending && (
            <div className="oracle-screen__bubble-row">
              <div className="oracle-screen__typing">
                <span />
                <span />
                <span />
                Meditating on your words...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="oracle-screen__input-bar">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputText.trim()) handleSubmitNarration(inputText);
            }}
          >
            {(isRecording || isTranscribing) && (
              <div className="oracle-screen__recording-overlay">
                {isRecording ? (
                  <>
                    <span
                      className="oracle-screen__recording-waveform"
                      aria-hidden="true"
                    >
                      <span />
                      <span />
                      <span />
                      <span />
                    </span>
                    <span>Recording narration...</span>
                  </>
                ) : (
                  <span>Transcribing...</span>
                )}
              </div>
            )}

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Speak naturally: 'I completed my health quest and should start a work report tomorrow...'"
            />

            <button
              type="button"
              className={`oracle-screen__mic ${isRecording ? "oracle-screen__mic--active" : ""} ${
                isTranscribing ? "oracle-screen__mic--transcribing" : ""
              }`}
              onClick={handleToggleRecording}
              disabled={!SpeechRecognitionApi || isTranscribing}
              title={
                SpeechRecognitionApi
                  ? "Dictate narration"
                  : "Voice input is not supported in this browser"
              }
            >
              <Mic size={16} />
            </button>

            <button type="submit" disabled={!inputText.trim() || isSending}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      <div className="oracle-screen__suggestions">
        <div className="oracle-screen__suggestions-heading">
          <Sparkles size={16} />
          <h3>Oracle's Proposed Quests</h3>
          <span>{pendingSuggestions.length} Pending</span>
        </div>

        {pendingSuggestions.length === 0 ? (
          <div className="oracle-screen__suggestions-empty">
            <Check size={20} />
            <h4>No Pending Proposals</h4>
            <p>
              When you submit narrations, the Oracle's recommended task
              structures will align here for review before filing.
            </p>
          </div>
        ) : (
          <div className="oracle-screen__suggestions-list">
            {pendingSuggestions.map((sug) => {
              const isEditing = editingSuggestionId === sug.id;
              const config = getCategoryDisplay(
                isEditing ? editCategoryId : sug.categoryId,
              );
              const Icon = config.icon;

              return (
                <div key={sug.id} className="suggestion-card">
                  {!isEditing ? (
                    <>
                      <div className="suggestion-card__top">
                        <span
                          className={`suggestion-card__category suggestion-card__category--${config.tone}`}
                        >
                          <Icon size={12} />
                          {config.name}
                        </span>
                        <div className="suggestion-card__meta">
                          <span className="suggestion-card__priority">
                            {sug.priorityType}
                          </span>
                          <span className="suggestion-card__xp">
                            +{sug.xpValue} XP
                          </span>
                        </div>
                      </div>

                      <h4 className="suggestion-card__title">{sug.title}</h4>
                      <p className="suggestion-card__notes">
                        {sug.notes || "No extra context parsed."}
                      </p>

                      <div className="suggestion-card__actions">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(sug)}
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="suggestion-card__reject"
                          onClick={() => handleReject(sug)}
                        >
                          <X size={14} />
                          Reject
                        </button>
                        <button
                          type="button"
                          className="suggestion-card__approve"
                          onClick={() => handleApprove(sug)}
                        >
                          <Check size={14} />
                          Approve Quest
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="suggestion-card__edit">
                      <div className="suggestion-card__field">
                        <label>Title</label>
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                      </div>
                      <div className="suggestion-card__grid">
                        <div className="suggestion-card__field">
                          <label>Category</label>
                          <select
                            value={editCategoryId}
                            onChange={(e) => setEditCategoryId(e.target.value)}
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="suggestion-card__field">
                          <label>Priority</label>
                          <select
                            value={editPriorityType}
                            onChange={(e) =>
                              setEditPriorityType(e.target.value)
                            }
                          >
                            <option value="MAIN">Main</option>
                            <option value="SIDE">Side</option>
                          </select>
                        </div>
                      </div>
                      <div className="suggestion-card__field">
                        <label>Reward (XP)</label>
                        <input
                          type="number"
                          value={editXp}
                          onChange={(e) => setEditXp(Number(e.target.value))}
                        />
                      </div>
                      <div className="suggestion-card__field">
                        <label>Notes</label>
                        <textarea
                          rows={2}
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                        />
                      </div>
                      <div className="suggestion-card__edit-actions">
                        <button
                          type="button"
                          onClick={() => setEditingSuggestionId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="suggestion-card__save"
                          onClick={() => handleSaveEdit(sug.id)}
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
