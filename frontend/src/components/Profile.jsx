import { useEffect, useState } from "react";
import { Check, Flame, Lock, Save, ShieldAlert, Sparkles, Trash2, User } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCategories } from "../context/CategoriesContext.jsx";
import { useToast, errorToastFor } from "../context/ToastContext.jsx";
import { PROFILE_ICON_OPTIONS } from "../constants/profileIcons.js";
import { AVATAR_STAGES, MAX_LEVEL, nextStageAfter, stageForUser, stageLevelRange } from "../constants/avatarStages.js";
import AvatarBadge from "./AvatarBadge.jsx";
import ProfilePictureBadge from "./ProfilePictureBadge.jsx";
import CategoryManager from "./CategoryManager.jsx";
import LoadingIndicator from "./LoadingIndicator.jsx";
import DeleteAccountModal from "./DeleteAccountModal.jsx";
import "../styles/Profile.css";

const GENDER_OPTIONS = [
  { value: "NEUTRAL", label: "Neutral" },
  { value: "FEMININE", label: "Feminine" },
  { value: "MASCULINE", label: "Masculine" }
];

const XP_PER_LEVEL = 100;

export default function Profile() {
  const { user, updateLocalUser } = useAuth();
  const { getCategoryDisplay } = useCategories();
  const toast = useToast();

  const [summary, setSummary] = useState(null);
  const [aiUsage, setAiUsage] = useState(null);
  const [name, setName] = useState(user.name);
  const [gender, setGender] = useState(user.gender);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [savingIconKey, setSavingIconKey] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    api.profile
      .summary()
      .then(setSummary)
      .catch(err => errorToastFor(toast, err, "Couldn't load your summary"));
    api.profile
      .aiUsage()
      .then(setAiUsage)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stage = stageForUser(user);
  const nextStage = nextStageAfter(stage);
  const isMaxLevel = user.level >= MAX_LEVEL;
  const xpIntoLevel = isMaxLevel ? XP_PER_LEVEL : user.xp % XP_PER_LEVEL;
  const levelsToNextStage = nextStage ? nextStage.minLevel - user.level : 0;
  const xpToNextStage = nextStage ? (nextStage.minLevel - 1) * XP_PER_LEVEL - user.xp : 0;
  const isDirty = name.trim() !== user.name || gender !== user.gender;

  const handleSaveProfile = async e => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSavingProfile(true);
    try {
      const { user: updated } = await api.auth.updateProfile({ name: name.trim(), gender });
      updateLocalUser(updated);
      setName(updated.name);
      toast.success("Profile updated", {
        description: gender !== user.gender ? "Your avatar now uses the new look everywhere." : `Saved as ${updated.name}`
      });
    } catch (err) {
      errorToastFor(toast, err, "Profile couldn't be saved");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSelectIcon = async option => {
    if (option.key === user.profileIcon || savingIconKey) return;
    setSavingIconKey(option.key);
    try {
      const { user: updated } = await api.auth.updateProfile({ profileIcon: option.key });
      updateLocalUser(updated);
      toast.success("Profile picture updated", { description: option.label });
    } catch (err) {
      errorToastFor(toast, err, "Couldn't change your picture");
    } finally {
      setSavingIconKey(null);
    }
  };

  return (
    <div className="profile">
      <header className="profile__header">
        <span className="profile__eyebrow">
          <User size={13} />
          Profile
        </span>
        <h2>Your character &amp; account</h2>
      </header>

      {/* ---------- Hero: avatar, stage, XP, next-stage teaser ---------- */}
      <section className="profile__hero">
        <div className="profile__hero-main">
          <div className="profile__hero-avatar">
            <AvatarBadge level={user.level} xp={user.xp} avatarStage={user.avatarStage} gender={user.gender} size={112} />
          </div>
          <div className="profile__hero-text">
            <div className="profile__identity">
              <ProfilePictureBadge iconKey={user.profileIcon} size={28} />
              <h3>{user.name}</h3>
            </div>
            <p className="profile__stage-name">
              <Sparkles size={14} />
              {stage.name}
              <span>
                Stage {stage.stage} of {AVATAR_STAGES.length} · {stageLevelRange(stage)}
              </span>
            </p>
            <p className="profile__stage-blurb">{stage.blurb}</p>

            <div className="profile__xp">
              <div className="profile__xp-head">
                <span>Level {user.level}</span>
                <span>{isMaxLevel ? "Max level" : `${xpIntoLevel} / ${XP_PER_LEVEL} XP`}</span>
              </div>
              <div className="profile__xp-track">
                <div className="profile__xp-fill" style={{ width: `${xpIntoLevel}%` }} />
              </div>
              <p className="profile__xp-caption">XP is purely cosmetic and never unlocks functionality.</p>
            </div>
          </div>
        </div>

        <div className="profile__next">
          {nextStage ? (
            <>
              <span className="profile__next-eyebrow">Next evolution</span>
              <div className="profile__next-body">
                <div className="profile__next-avatar">
                  <AvatarBadge stage={nextStage.stage} gender={user.gender} size={72} locked showLevel={false} />
                  <span className="profile__next-lock">
                    <Lock size={11} />
                  </span>
                </div>
                <div>
                  <strong>{nextStage.name}</strong>
                  <p>{nextStage.blurb}</p>
                  <span className="profile__next-req">
                    Reach level {nextStage.minLevel} · {levelsToNextStage} level{levelsToNextStage === 1 ? "" : "s"} ({xpToNextStage} XP) to go
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="profile__next-max">
              <span className="profile__next-eyebrow">Progression complete</span>
              <strong>
                <Sparkles size={16} />
                {stage.name}, the final form
              </strong>
              <p>
                All {AVATAR_STAGES.length} stages unlocked. The aura and the open third eye are yours. XP keeps counting, but
                there is nothing left to evolve.
              </p>
            </div>
          )}
        </div>

        <div className="profile__stats">
          <div className="profile__stat">
            <span className="profile__stat-value">{user.level}</span>
            <span className="profile__stat-label">Level</span>
          </div>
          <div className="profile__stat">
            <span className="profile__stat-value">{user.xp}</span>
            <span className="profile__stat-label">Total XP</span>
          </div>
          <div className="profile__stat profile__stat--streak">
            <span className="profile__stat-value">
              <Flame size={16} />
              {summary ? summary.currentStreak : "–"}
            </span>
            <span className="profile__stat-label">Day Streak</span>
          </div>
          <div className="profile__stat">
            <span className="profile__stat-value">{summary ? summary.totalCompleted : "–"}</span>
            <span className="profile__stat-label">Completed</span>
          </div>
        </div>
      </section>

      {/* ---------- Stage track ---------- */}
      <section className="profile__card profile__track-card">
        <div className="profile__card-head">
          <h3>Avatar progression</h3>
          {aiUsage && (
            <span className="profile__ai-usage">
              {aiUsage.remaining}/{aiUsage.limit} Oracle AI credits left today
            </span>
          )}
        </div>
        <p className="profile__card-sub">{AVATAR_STAGES.length} stages from level 1 to {MAX_LEVEL}, each one earned slowly. Your avatar never regresses.</p>
        <ol className="profile__track">
          {AVATAR_STAGES.map(s => {
            const state = s.stage < stage.stage ? "done" : s.stage === stage.stage ? "current" : "locked";
            return (
              <li key={s.key} className={`profile__track-step profile__track-step--${state}`}>
                <div className="profile__track-avatar">
                  <AvatarBadge
                    stage={s.stage}
                    gender={user.gender}
                    size={52}
                    locked={state === "locked"}
                    showLevel={false}
                    showProgress={false}
                  />
                  {state === "done" && (
                    <span className="profile__track-check">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <strong>{s.name}</strong>
                <span>{stageLevelRange(s)}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="profile__grid">
        <section className="profile__card">
          <h3>
            <User size={15} />
            Account Settings
          </h3>
          <p className="profile__card-sub">Your name and the avatar silhouette used everywhere.</p>
          <form className="profile__settings-form" onSubmit={handleSaveProfile}>
            <div className="profile__field">
              <label htmlFor="profile-name">Name</label>
              <input id="profile-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <fieldset className="profile__field">
              <legend>Avatar Gender Aesthetic</legend>
              <div className="profile__segmented" role="radiogroup">
                {GENDER_OPTIONS.map(option => (
                  <label
                    key={option.value}
                    className={`profile__segmented-option${gender === option.value ? " profile__segmented-option--active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="profile-gender"
                      value={option.value}
                      checked={gender === option.value}
                      onChange={() => setGender(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="profile__settings-footer">
              <AvatarBadge level={user.level} xp={user.xp} avatarStage={user.avatarStage} gender={gender} size={40} showLevel={false} />
              <button type="submit" className="profile__save-button btn-lift" disabled={isSavingProfile || !isDirty || !name.trim()}>
                {isSavingProfile ? (
                  <LoadingIndicator size="sm" tone="light" label="Saving..." />
                ) : (
                  <>
                    <Save size={14} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        <section className="profile__card">
          <h3>Profile Picture</h3>
          <p className="profile__card-sub">A personal identity choice, separate from your XP-based avatar stage.</p>
          <div className="profile__icon-grid">
            {PROFILE_ICON_OPTIONS.map(option => (
              <button
                key={option.key}
                type="button"
                className={`profile__icon-option ${user.profileIcon === option.key ? "profile__icon-option--active" : ""}`}
                onClick={() => handleSelectIcon(option)}
                title={option.label}
                aria-pressed={user.profileIcon === option.key}
                disabled={Boolean(savingIconKey)}
              >
                <ProfilePictureBadge iconKey={option.key} size={40} />
                <span>{savingIconKey === option.key ? "Saving..." : option.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="profile__card profile__card--wide">
          <h3>Pending Work</h3>
          {!summary ? (
            <div className="profile__loading">
              <LoadingIndicator size="sm" label="Loading..." />
            </div>
          ) : (
            <>
              <div className="profile__priority-split">
                <div>
                  <span className="profile__stat-value">{summary.pendingByPriority.MAIN}</span>
                  <span className="profile__stat-label">Main Quests Open</span>
                </div>
                <div>
                  <span className="profile__stat-value">{summary.pendingByPriority.SIDE}</span>
                  <span className="profile__stat-label">Side Quests Open</span>
                </div>
                <div>
                  <span className="profile__stat-value">{summary.totalActive}</span>
                  <span className="profile__stat-label">Total Active</span>
                </div>
              </div>

              <div className="profile__category-breakdown">
                {summary.pendingByCategory.length === 0 ? (
                  <p className="profile__empty">Nothing pending. Clear horizon.</p>
                ) : (
                  summary.pendingByCategory
                    .slice()
                    .sort((a, b) => b.count - a.count)
                    .map(row => {
                      const config = getCategoryDisplay(row.categoryId);
                      const Icon = config.icon;
                      return (
                        <div className="profile__category-row" key={row.categoryId}>
                          <span className={`profile__category-icon profile__category-icon--${config.tone}`}>
                            <Icon size={14} />
                          </span>
                          <span className="profile__category-name">{config.name}</span>
                          <span className="profile__category-count">{row.count}</span>
                        </div>
                      );
                    })
                )}
              </div>
            </>
          )}
        </section>

        <section className="profile__card profile__card--wide">
          <CategoryManager />
        </section>

        <section className="profile__danger profile__card--wide">
          <div className="profile__danger-text">
            <h3>
              <ShieldAlert size={15} />
              Danger zone
            </h3>
            <p>
              Permanently delete your account and everything in it: quests, chains, categories, Oracle history, pillars and
              journal entries. This cannot be undone.
            </p>
          </div>
          <button type="button" className="profile__delete-button" onClick={() => setShowDeleteModal(true)}>
            <Trash2 size={14} />
            Delete account
          </button>
        </section>
      </div>

      {showDeleteModal && <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />}
    </div>
  );
}
