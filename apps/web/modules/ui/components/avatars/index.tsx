/**
 * Deterministic avatar components for people and profiles using the boring-avatars library.
 * PersonAvatar uses "beam" variant; ProfileAvatar uses "bauhaus" variant.
 * Avatars are consistent per ID (no image upload needed).
 */
import Avatar from "boring-avatars";

const colors = ["#00C4B8", "#ccfbf1", "#334155"];

interface PersonAvatarProps {
  personId: string;
}

export const PersonAvatar: React.FC<PersonAvatarProps> = ({ personId }) => {
  return <Avatar size={40} name={personId} variant="beam" colors={colors} />;
};

interface ProfileAvatar {
  userId: string;
}

export const ProfileAvatar: React.FC<ProfileAvatar> = ({ userId }) => {
  return <Avatar size={40} name={userId} variant="bauhaus" colors={colors} />;
};
