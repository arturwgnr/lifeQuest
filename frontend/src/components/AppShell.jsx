import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Compass, LayoutGrid, Sparkles, LogOut, UserCircle, BookHeart, BarChart3, Menu, X, Route, CalendarCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import AvatarBadge from "./AvatarBadge.jsx";
import ProfilePictureBadge from "./ProfilePictureBadge.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import "../styles/AppShell.css";

const TIER_LABELS = [
  { min: 9, label: "Sovereign Tier" },
  { min: 7, label: "Champion Class" },
  { min: 5, label: "Pathfinder Class" },
  { min: 3, label: "Initiate Class" },
  { min: 0, label: "Novice Chronicle" }
];

function tierLabel(level) {
  return TIER_LABELS.find(t => level >= t.min).label;
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = () => setDrawerOpen(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="app-shell" data-theme={theme}>
      {drawerOpen && <div className="app-shell__drawer-backdrop" onClick={closeDrawer} />}

      <aside className={`app-shell__sidebar${drawerOpen ? " app-shell__sidebar--open" : ""}`}>
        <div className="app-shell__brand">
          <span className="app-shell__brand-icon">
            <Compass size={18} />
          </span>
          <div className="app-shell__brand-text">
            <h1>lifeQuest</h1>
            <p>Quest Intelligence</p>
          </div>
          <ThemeToggle />
          <button type="button" className="app-shell__sidebar-close" onClick={closeDrawer} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className="app-shell__profile">
          <div className="app-shell__profile-row">
            <ProfilePictureBadge iconKey={user.profileIcon} size={32} />
            <AvatarBadge level={user.level} xp={user.xp} size={44} />
            <div className="app-shell__profile-text">
              <h2>{user.name}</h2>
              <p>{tierLabel(user.level)}</p>
            </div>
          </div>
          <div className="app-shell__xp-track">
            <div className="app-shell__xp-fill" style={{ width: `${user.xp % 100}%` }} />
          </div>
          <div className="app-shell__xp-labels">
            <span>{user.xp} Total XP</span>
            <span>{Math.floor(user.xp / 100) * 100 + 100} Target</span>
          </div>
        </div>

        <nav className="app-shell__nav">
          <NavLink to="/app" end onClick={closeDrawer} className={({ isActive }) => `app-shell__nav-link${isActive ? " app-shell__nav-link--active" : ""}`}>
            <LayoutGrid size={16} />
            Dashboard
          </NavLink>
          <NavLink to="/app/planning" onClick={closeDrawer} className={({ isActive }) => `app-shell__nav-link${isActive ? " app-shell__nav-link--active" : ""}`}>
            <Route size={16} />
            Planning Mode
          </NavLink>
          <NavLink to="/app/pillars" onClick={closeDrawer} className={({ isActive }) => `app-shell__nav-link${isActive ? " app-shell__nav-link--active" : ""}`}>
            <CalendarCheck size={16} />
            Pillars Mode
          </NavLink>
          <NavLink to="/app/oracle" onClick={closeDrawer} className={({ isActive }) => `app-shell__nav-link${isActive ? " app-shell__nav-link--active" : ""}`}>
            <Sparkles size={16} />
            The Oracle
            <span className="app-shell__nav-dot" />
          </NavLink>
          <NavLink to="/app/journal" onClick={closeDrawer} className={({ isActive }) => `app-shell__nav-link${isActive ? " app-shell__nav-link--active" : ""}`}>
            <BookHeart size={16} />
            Journal
          </NavLink>
          <NavLink to="/app/stats" onClick={closeDrawer} className={({ isActive }) => `app-shell__nav-link${isActive ? " app-shell__nav-link--active" : ""}`}>
            <BarChart3 size={16} />
            Stats
          </NavLink>
          <NavLink to="/app/profile" onClick={closeDrawer} className={({ isActive }) => `app-shell__nav-link${isActive ? " app-shell__nav-link--active" : ""}`}>
            <UserCircle size={16} />
            Profile
          </NavLink>

          <div className="app-shell__nav-footer">
            <button type="button" className="app-shell__logout" onClick={handleLogout}>
              <LogOut size={14} />
              Log Out
            </button>
          </div>
        </nav>
      </aside>

      <header className="app-shell__mobile-header">
        <div className="app-shell__mobile-top">
          <button type="button" className="app-shell__hamburger" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="app-shell__brand">
            <span className="app-shell__brand-icon">
              <Compass size={16} />
            </span>
            <h1>lifeQuest</h1>
          </div>
          <div className="app-shell__mobile-actions">
            <ThemeToggle />
            <button type="button" className="app-shell__mobile-logout" onClick={handleLogout}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
