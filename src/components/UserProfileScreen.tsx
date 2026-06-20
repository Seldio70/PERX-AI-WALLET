import { AccountSettingsHub } from "./AccountSettingsHub";
import { User } from "../types";

type Props = {
  user: User;
  onClose?: () => void;
  onLogout: () => void;
};

export function UserProfileScreen({ user, onLogout }: Props) {
  return <AccountSettingsHub user={user} onLogout={onLogout} showHero />;
}
