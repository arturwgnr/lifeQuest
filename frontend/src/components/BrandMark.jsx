import { Compass } from "lucide-react";
import "../styles/BrandMark.css";

// The lifeQuest logo mark: the compass tile used in the landing nav (ink)
// and the app sidebar (amber). One component so the mark never drifts.
export default function BrandMark({ size = 32, tone = "ink", withName = false }) {
  return (
    <span className={`brand-mark brand-mark--${tone}`}>
      <span className="brand-mark__tile" style={{ width: size, height: size }} aria-hidden="true">
        <Compass size={Math.round(size * 0.56)} />
      </span>
      {withName ? <span className="brand-mark__name">lifeQuest</span> : <span className="brand-mark__sr">lifeQuest</span>}
    </span>
  );
}
