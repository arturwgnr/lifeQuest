import { useEffect, useRef } from "react";
import { Trophy } from "lucide-react";
import { useToast } from "../context/ToastContext.jsx";
import { MAX_LEVEL } from "../constants/avatarStages.js";

// Level-ups go through the shared toast stack (so they never overlap other
// toasts). Stage evolutions get their own toast from AuthContext, which knows
// the before/after stage. Kept as a component with the same props so callers
// don't change.
export default function LevelUpNotification({ level, onClose }) {
  const toast = useToast();
  const shownRef = useRef(null);

  useEffect(() => {
    if (shownRef.current === level) return;
    shownRef.current = level;
    toast.level(`Reached Level ${level}!`, {
      icon: Trophy,
      description:
        level >= MAX_LEVEL ? "The top of the curve. Nothing left to climb." : "Your avatar's ring is filling up. Steady progress."
    });
    onClose();
  }, [level, onClose, toast]);

  return null;
}
