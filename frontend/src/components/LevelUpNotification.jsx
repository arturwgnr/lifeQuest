import { useEffect, useRef } from "react";
import { Trophy } from "lucide-react";
import { useToast } from "../context/ToastContext.jsx";
import { AVATAR_STAGES, stageForLevel } from "../constants/avatarStages.js";

// Level-ups go through the shared toast stack (so they never overlap other
// toasts). Kept as a component with the same props so callers don't change.
export default function LevelUpNotification({ level, onClose }) {
  const toast = useToast();
  const shownRef = useRef(null);

  useEffect(() => {
    if (shownRef.current === level) return;
    shownRef.current = level;
    const stage = stageForLevel(level);
    const isNewStage = stage.minLevel === level && stage.stage > 1;
    toast.level(`Reached Level ${level}!`, {
      icon: Trophy,
      description: isNewStage
        ? `Your avatar evolved into ${stage.name} (stage ${stage.stage} of ${AVATAR_STAGES.length}).`
        : "Your avatar's ring is filling up. Steady progress."
    });
    onClose();
  }, [level, onClose, toast]);

  return null;
}
