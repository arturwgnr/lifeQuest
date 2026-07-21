import { useEffect } from "react";
import { Sparkles, Trophy } from "lucide-react";
import "../styles/LevelUpNotification.css";

export default function LevelUpNotification({ level, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="level-up animate-slide-in-up">
      <div className="level-up__icon">
        <Trophy size={20} />
      </div>

      <div className="level-up__body">
        <div className="level-up__eyebrow">
          <Sparkles size={14} />
          LEVEL ADVANCEMENT
        </div>
        <h4 className="level-up__title">Reached Level {level}!</h4>
        <p className="level-up__copy">Your chronicle sentinel has upgraded. Your productivity remains steady and clear.</p>
      </div>

      <button type="button" className="level-up__dismiss" onClick={onClose}>
        Dismiss
      </button>
    </div>
  );
}
