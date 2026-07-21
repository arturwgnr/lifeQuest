import { getProfileIconOption } from "../constants/profileIcons.js";
import "../styles/ProfilePictureBadge.css";

export default function ProfilePictureBadge({ iconKey, size = 44 }) {
  const option = getProfileIconOption(iconKey);
  const Icon = option.icon;

  return (
    <span
      className={`profile-picture-badge profile-picture-badge--${option.tone}`}
      style={{ width: size, height: size }}
      title={option.label}
    >
      <Icon size={Math.round(size * 0.5)} />
    </span>
  );
}
