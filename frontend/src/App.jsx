import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { CategoriesProvider } from "./context/CategoriesContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import Landing from "./components/Landing.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import AppShell from "./components/AppShell.jsx";
import Dashboard from "./components/Dashboard.jsx";
import OracleScreen from "./components/OracleScreen.jsx";
import Profile from "./components/Profile.jsx";
import Journal from "./components/Journal.jsx";
import JournalStats from "./components/JournalStats.jsx";
import Stats from "./components/Stats.jsx";
import Planning from "./components/Planning.jsx";
import Pillars from "./components/Pillars.jsx";
import EditPillars from "./components/EditPillars.jsx";

function FullScreenLoader() {
  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--slate-400)" }}>
      Loading lifeQuest...
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RedirectIfAuthed({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullScreenLoader />;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  const { isLoading } = useAuth();

  if (isLoading) return <FullScreenLoader />;

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthed>
            <Register />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <ThemeProvider>
              <CategoriesProvider>
                <AppShell />
              </CategoriesProvider>
            </ThemeProvider>
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="planning" element={<Planning />} />
        <Route path="pillars" element={<Pillars />} />
        <Route path="pillars/edit" element={<EditPillars />} />
        <Route path="oracle" element={<OracleScreen />} />
        <Route path="profile" element={<Profile />} />
        <Route path="journal" element={<Journal />} />
        <Route path="journal/stats" element={<JournalStats />} />
        <Route path="stats" element={<Stats />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
