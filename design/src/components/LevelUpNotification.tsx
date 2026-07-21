import { useEffect } from "react";
import { Sparkles, Trophy } from "lucide-react";

interface LevelUpNotificationProps {
  level: number;
  onClose: () => void;
}

export default function LevelUpNotification({ level, onClose }: LevelUpNotificationProps) {
  // Automatically close toast after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 border border-slate-850 text-white rounded-xl p-4 shadow-xl flex items-start gap-3 animate-slide-in-up"
      id="level-up-toast"
    >
      <div className="inline-flex items-center justify-center p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5 shadow-md">
        <Trophy className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-xs font-bold font-mono text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
          LEVEL ADVANCEMENT
        </div>
        <h4 className="text-sm font-bold font-sans mt-0.5 text-slate-100">
          Reached Level {level}!
        </h4>
        <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
          Your chronicle sentinel has upgraded. Your productivity remains steady and clear.
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="text-slate-400 hover:text-slate-200 transition-colors text-xs font-bold px-1 py-0.5 rounded cursor-pointer"
      >
        Dismiss
      </button>
    </div>
  );
}
