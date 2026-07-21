import { useEffect, useState } from "react";
import { Flame, Save, User } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCategories } from "../context/CategoriesContext.jsx";
import { PROFILE_ICON_OPTIONS } from "../constants/profileIcons.js";
import AvatarBadge from "./AvatarBadge.jsx";
import ProfilePictureBadge from "./ProfilePictureBadge.jsx";
import CategoryManager from "./CategoryManager.jsx";
import "../styles/Profile.css";

export default function Profile() {
  const { user, updateLocalUser } = useAuth();
  const { getCategoryDisplay } = useCategories();

  const [summary, setSummary] = useState(null);
  const [name, setName] = useState(user.name);
  const [gender, setGender] = useState(user.gender);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isSavingIcon, setIsSavingIcon] = useState(false);

  useEffect(() => {
    api.profile.summary().then(setSummary);
  }, []);

  const handleSaveProfile = async e => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const { user: updated } = await api.auth.updateProfile({ name, gender });
      updateLocalUser(updated);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSelectIcon = async iconKey => {
    if (iconKey === user.profileIcon || isSavingIcon) return;
    setIsSavingIcon(true);
    try {
      const { user: updated } = await api.auth.updateProfile({ profileIcon: iconKey });
      updateLocalUser(updated);
    } finally {
      setIsSavingIcon(false);
    }
  };

  return (
    <div className="profile">
      <div className="profile__header">
        <h2>Profile</h2>
      </div>

      <div className="profile__grid">
        <section className="profile__card">
          <h3>Progression Overview</h3>
          <div className="profile__progress-row">
            <AvatarBadge level={user.level} xp={user.xp} size={72} />
            <div className="profile__progress-stats">
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
                  {summary ? summary.currentStreak : "-"}
                </span>
                <span className="profile__stat-label">Day Streak</span>
              </div>
            </div>
          </div>
          <div className="profile__xp-track">
            <div className="profile__xp-fill" style={{ width: `${user.xp % 100}%` }} />
          </div>
          <p className="profile__xp-caption">
            {user.xp % 100} / 100 XP to level {user.level + 1}. XP is purely cosmetic and never unlocks functionality.
          </p>
        </section>

        <section className="profile__card">
          <h3>Profile Picture</h3>
          <p className="profile__card-sub">
            A personal identity choice, separate from your XP-based avatar stage above.
          </p>
          <div className="profile__icon-grid">
            {PROFILE_ICON_OPTIONS.map(option => (
              <button
                key={option.key}
                type="button"
                className={`profile__icon-option ${user.profileIcon === option.key ? "profile__icon-option--active" : ""}`}
                onClick={() => handleSelectIcon(option.key)}
                title={option.label}
                disabled={isSavingIcon}
              >
                <ProfilePictureBadge iconKey={option.key} size={40} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="profile__card">
          <h3>Pending Work</h3>
          {!summary ? (
            <p className="profile__loading">Loading...</p>
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
                  <span className="profile__stat-value">{summary.totalCompleted}</span>
                  <span className="profile__stat-label">Completed All-Time</span>
                </div>
              </div>

              <div className="profile__category-breakdown">
                {summary.pendingByCategory.length === 0 ? (
                  <p className="profile__empty">Nothing pending &mdash; clear horizon.</p>
                ) : (
                  summary.pendingByCategory
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

        <section className="profile__card">
          <h3>
            <User size={15} />
            Account Settings
          </h3>
          <form className="profile__settings-form" onSubmit={handleSaveProfile}>
            <div className="profile__field">
              <label>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="profile__field">
              <label>Avatar Gender Aesthetic</label>
              <select value={gender} onChange={e => setGender(e.target.value)}>
                <option value="NEUTRAL">Neutral</option>
                <option value="FEMININE">Feminine</option>
                <option value="MASCULINE">Masculine</option>
              </select>
            </div>
            <button type="submit" className="profile__save-button" disabled={isSavingProfile}>
              <Save size={14} />
              {isSavingProfile ? "Saving..." : "Save Changes"}
            </button>
            {savedNotice && <span className="profile__saved-notice">Saved</span>}
          </form>
        </section>

        <section className="profile__card profile__card--wide">
          <CategoryManager />
        </section>
      </div>
    </div>
  );
}
