import { passwordConstraints } from '@novu/shared';
import PasswordStrength from 'react-password-strength-bar';

export function PasswordStrengthBar({ password }: { password: string }) {
  return <PasswordStrength password={password} minLength={passwordConstraints.minLength} />;
}
