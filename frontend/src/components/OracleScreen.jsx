import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Mic, Sparkles, Check, X, Edit2, HelpCircle, ChevronDown, Square, ArrowDown } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCategories } from "../context/CategoriesContext.jsx";
import { useToast, errorToastFor } from "../context/ToastContext.jsx";
import {
  playMessageSent,
  playMessageReceived,
  playQuestProposed,
  playApprove,
  playReject,
} from "../utils/soundEffects.js";
import LoadingIndicator from "./LoadingIndicator.jsx";
import AvatarBadge from "./AvatarBadge.jsx";
import "../styles/OracleScreen.css";

const RECORDING_MAX_DURATION_MS = 60 * 1000;

// Within this many px of the bottom the reader counts as "following" the
// conversation, so new messages and late layout changes keep them pinned.
const PIN_THRESHOLD_PX = 80;
// How long after a smooth scroll starts we keep following it smoothly
// instead of snapping (covers the animation itself).
const SMOOTH_WINDOW_MS = 450;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

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

function OracleOrb({ size = 28 }) {
  return (
    <span className="oracle-orb" style={{ width: size, height: size }} aria-hidden="true">
      <Sparkles size={Math.round(size * 0.5)} />
    </span>
  );
}

export default function OracleScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { categories, getCategoryDisplay } = useCategories();
  const [busySuggestionId, setBusySuggestionId] = useState(null);
  const suggestionsRef = useRef(null);
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

  const streamRef = useRef(null);
  const streamContentRef = useRef(null);
  const isPinnedRef = useRef(true);
  const smoothUntilRef = useRef(0);
  const [showJump, setShowJump] = useState(false);
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

  // Scrolling only ever moves the stream itself. (scrollIntoView used to also
  // scroll the whole page on mobile and started from the top of history.)
  const scrollToBottom = useCallback((smooth) => {
    const el = streamRef.current;
    if (!el) return;
    if (smooth && !prefersReducedMotion()) {
      smoothUntilRef.current = Date.now() + SMOOTH_WINDOW_MS;
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
    isPinnedRef.current = true;
    setShowJump(false);
  }, []);

  const handleStreamScroll = () => {
    const el = streamRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    // Intermediate positions of our own smooth scroll must not unpin
    if (Date.now() < smoothUntilRef.current) return;
    const pinned = distance < PIN_THRESHOLD_PX;
    isPinnedRef.current = pinned;
    setShowJump(!pinned);
  };

  // Opening the Oracle: land on the latest message before the first paint,
  // with no visible scroll, then once more on the next frame in case the
  // history's final height settled late.
  useLayoutEffect(() => {
    if (isLoading) return undefined;
    scrollToBottom(false);
    const frame = requestAnimationFrame(() => scrollToBottom(false));
    return () => cancelAnimationFrame(frame);
  }, [isLoading, scrollToBottom]);

  // New messages (including the optimistic one and the typing indicator):
  // follow smoothly only if the reader is already near the bottom; otherwise
  // leave them where they are and offer "Jump to latest".
  const messageCount = messages.length;
  const streamSignature = `${messageCount}:${isSending}`;
  const lastSignatureRef = useRef(null);
  useLayoutEffect(() => {
    if (isLoading) return;
    const isFirstRender = lastSignatureRef.current === null;
    const changed = lastSignatureRef.current !== streamSignature;
    lastSignatureRef.current = streamSignature;
    // The opening position is handled above (instantly); only real changes animate
    if (isFirstRender || !changed) return;
    if (isPinnedRef.current) scrollToBottom(true);
    else setShowJump(true);
  }, [streamSignature, isLoading, scrollToBottom]);

  // Late layout changes (fonts, proposal cards, the mobile keyboard shrinking
  // the stream) re-pin to the bottom for anyone who was already following.
  useEffect(() => {
    if (isLoading || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => {
      if (!isPinnedRef.current) return;
      scrollToBottom(Date.now() < smoothUntilRef.current);
    });
    if (streamRef.current) observer.observe(streamRef.current);
    if (streamContentRef.current) observer.observe(streamContentRef.current);
    return () => observer.disconnect();
  }, [isLoading, scrollToBottom]);

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
    isPinnedRef.current = true;
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
    } catch (err) {
      // The backend persists an error message on the conversation even on failure; reload picks it up.
      await reloadConversation().catch(() => {});
      if (err.status === 502) {
        toast.error("The Oracle is unavailable", { description: "Your message was kept. Try again in a moment." });
      } else {
        errorToastFor(toast, err, "Message couldn't be sent");
      }
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

  // Approval is the only path from a suggestion to a real Task; the toast
  // confirms exactly what was created and links straight to it.
  const handleApprove = async (suggestion) => {
    setBusySuggestionId(suggestion.id);
    try {
      const { task } = await api.oracle.approveSuggestion(suggestion.id);
      updateSuggestionLocally(suggestion.id, { status: "APPROVED" });
      playApprove();
      toast.success(`Quest forged: ${task.title}`, {
        description: `Approved from the Oracle · +${task.xpValue} XP on completion`,
        action: { label: "View", onClick: () => navigate("/app", { state: { openTaskId: task.id } }) },
      });
    } catch (err) {
      errorToastFor(toast, err, "Couldn't approve this quest");
    } finally {
      setBusySuggestionId(null);
    }
  };

  // No Undo here: a rejected suggestion can't be reopened on the backend.
  const handleReject = async (suggestion) => {
    setBusySuggestionId(suggestion.id);
    try {
      await api.oracle.rejectSuggestion(suggestion.id);
      updateSuggestionLocally(suggestion.id, { status: "REJECTED" });
      playReject();
      toast.info("Proposal rejected", { description: suggestion.title });
    } catch (err) {
      errorToastFor(toast, err, "Couldn't reject this proposal");
    } finally {
      setBusySuggestionId(null);
    }
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
    setBusySuggestionId(id);
    try {
      await api.oracle.editSuggestion(id, patch);
      updateSuggestionLocally(id, patch);
      setEditingSuggestionId(null);
      toast.success("Proposal updated", { description: "Still pending, approve it when it looks right." });
    } catch (err) {
      errorToastFor(toast, err, "Couldn't save your edits");
    } finally {
      setBusySuggestionId(null);
    }
  };

  const pendingSuggestions = pendingSuggestionsFrom(messages);

  if (isLoading)
    return (
      <div className="oracle-screen__loading">
        <LoadingIndicator variant="panel" size="lg" label="Consulting the Oracle..." />
      </div>
    );

  const creditsLeft = aiUsage ? aiUsage.remaining : null;
  const creditsPct = aiUsage ? Math.max(0, Math.min(100, (aiUsage.remaining / aiUsage.limit) * 100)) : 0;
  const isOutOfCredits = aiUsage ? aiUsage.remaining <= 0 : false;

  return (
    <div className="oracle-screen">
      <div className="oracle-screen__chat">
        <div className="oracle-screen__chat-header">
          <div className="oracle-screen__identity">
            <OracleOrb size={34} />
            <div>
              <h3>The Oracle</h3>
              <p>Narrate your day. Nothing is filed until you approve it.</p>
            </div>
          </div>
          <div className="oracle-screen__chat-header-meta">
            {aiUsage && (
              <span
                className={`oracle-screen__ai-usage${isOutOfCredits ? " oracle-screen__ai-usage--empty" : ""}`}
                title={`${creditsLeft} of ${aiUsage.limit} AI credits left today`}
              >
                <span className="oracle-screen__ai-usage-track">
                  <span style={{ width: `${creditsPct}%` }} />
                </span>
                {creditsLeft}/{aiUsage.limit} today
              </span>
            )}
            {pendingSuggestions.length > 0 && (
              <button
                type="button"
                className="oracle-screen__jump"
                onClick={() => suggestionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                {pendingSuggestions.length} proposed
                <ChevronDown size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="oracle-screen__presets">
          <span>Try</span>
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

        <div className="oracle-screen__stream-wrap">
        <div className="oracle-screen__stream" ref={streamRef} onScroll={handleStreamScroll}>
          <div className="oracle-screen__stream-content" ref={streamContentRef}>
          {messages.length === 0 ? (
            <div className="oracle-screen__empty">
              <OracleOrb size={52} />
              <p className="oracle-screen__empty-title">The Oracle sits quietly, awaiting your entry.</p>
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
                    <div className="oracle-screen__question-head">
                      <span className="oracle-screen__question-icon">
                        <HelpCircle size={15} />
                      </span>
                      <h4>The Oracle seeks clarity</h4>
                    </div>
                    <p>{msg.text}</p>
                    <div className="oracle-screen__question-actions">
                      <button
                        type="button"
                        onClick={() =>
                          handleAnswerQuestion(
                            "Yes, please complete the existing task.",
                          )
                        }
                        disabled={isSending}
                      >
                        <Check size={13} />
                        Yes, resolve existing quest
                      </button>
                      <button
                        type="button"
                        className="oracle-screen__question-actions-secondary"
                        onClick={() =>
                          handleAnswerQuestion("No, this is a fresh new task.")
                        }
                        disabled={isSending}
                      >
                        No, forge a new quest
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
                  {!isUser && <OracleOrb size={28} />}
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
                  {isUser && (
                    <AvatarBadge
                      level={user.level}
                      xp={user.xp}
                      avatarStage={user.avatarStage}
                      gender={user.gender}
                      size={30}
                      showLevel={false}
                      showProgress={false}
                    />
                  )}
                </div>
              );
            })
          )}
          {isSending && (
            <div className="oracle-screen__bubble-row">
              <OracleOrb size={28} />
              <div className="oracle-screen__typing">
                <span />
                <span />
                <span />
                Meditating on your words...
              </div>
            </div>
          )}
          </div>
        </div>

          {showJump && messages.length > 0 && (
            <button type="button" className="oracle-screen__jump-latest" onClick={() => scrollToBottom(true)}>
              <ArrowDown size={13} />
              Jump to latest
            </button>
          )}
        </div>

        <div className="oracle-screen__input-bar">
          <form
            className={`oracle-screen__composer${isRecording ? " oracle-screen__composer--recording" : ""}`}
            onSubmit={(e) => {
              e.preventDefault();
              if (inputText.trim()) handleSubmitNarration(inputText);
            }}
          >
            {(isRecording || isTranscribing) && (
              <div className="oracle-screen__recording-overlay">
                {isRecording ? (
                  <>
                    <span className="oracle-screen__recording-dot" aria-hidden="true" />
                    <span
                      className="oracle-screen__recording-waveform"
                      aria-hidden="true"
                    >
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </span>
                    <span>Recording narration... tap the mic to stop</span>
                  </>
                ) : (
                  <LoadingIndicator size="sm" tone="light" label="Transcribing..." />
                )}
              </div>
            )}

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Speak naturally: 'I completed my health quest and should start a work report tomorrow...'"
              aria-label="Message the Oracle"
            />

            <button
              type="button"
              className={`oracle-screen__mic ${isRecording ? "oracle-screen__mic--active" : ""} ${
                isTranscribing ? "oracle-screen__mic--transcribing" : ""
              }`}
              onClick={handleToggleRecording}
              disabled={!SpeechRecognitionApi || isTranscribing}
              aria-label={isRecording ? "Stop recording" : "Dictate narration"}
              title={
                SpeechRecognitionApi
                  ? isRecording
                    ? "Stop recording"
                    : "Dictate narration"
                  : "Voice input is not supported in this browser"
              }
            >
              {isRecording ? <Square size={13} /> : <Mic size={16} />}
            </button>

            <button
              type="submit"
              className="oracle-screen__send"
              disabled={!inputText.trim() || isSending}
              aria-label="Send to the Oracle"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>

      <div className="oracle-screen__suggestions" ref={suggestionsRef}>
        <div className="oracle-screen__suggestions-heading">
          <Sparkles size={15} />
          <h3>Proposed Quests</h3>
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
              const isBusy = busySuggestionId === sug.id;
              const config = getCategoryDisplay(
                isEditing ? editCategoryId : sug.categoryId,
              );
              const Icon = config.icon;

              return (
                <div
                  key={sug.id}
                  className={`suggestion-card suggestion-card--${config.tone}${isBusy ? " suggestion-card--busy" : ""}`}
                >
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
                            {sug.priorityType === "MAIN" ? "Main" : "Side"}
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
                          className="suggestion-card__edit-btn"
                          onClick={() => handleStartEdit(sug)}
                          disabled={isBusy}
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="suggestion-card__reject"
                          onClick={() => handleReject(sug)}
                          disabled={isBusy}
                        >
                          <X size={14} />
                          Reject
                        </button>
                        <button
                          type="button"
                          className="suggestion-card__approve btn-lift"
                          onClick={() => handleApprove(sug)}
                          disabled={isBusy}
                        >
                          {isBusy ? (
                            <LoadingIndicator size="sm" tone="light" />
                          ) : (
                            <Check size={14} />
                          )}
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
                          disabled={isBusy}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="suggestion-card__save"
                          onClick={() => handleSaveEdit(sug.id)}
                          disabled={isBusy}
                        >
                          {isBusy ? "Saving..." : "Save"}
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
