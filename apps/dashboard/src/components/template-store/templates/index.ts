import { accessTokenTemplate } from './access-token';
import { usageLimitTemplate } from './usage-limit';

import { appointmentReminderTemplate } from './appointment-reminder';
import { otpTemplate } from './otp';
import { paymentConfirmedTemplate } from './payment-confirmed';
import { recentLoginTemplate } from './recent-login';
import { renewalNoticeTemplate } from './renewal-notice';
import { WorkflowTemplate } from './types';
import { welcomeTemplate } from './authentication/welcome';
import { invitationTemplate } from './authentication/invitation';
import { magicLinkSignInTemplate } from './authentication/magic-link-sign-in';
import { orgInviteTemplate } from './authentication/org-invite';
import { verificationCodeTemplate } from './authentication/verification-code';
import { resetPasswordTemplate } from './authentication/reset-password';
export function getTemplates(): WorkflowTemplate[] {
  return [
    accessTokenTemplate,
    usageLimitTemplate,
    otpTemplate,
    renewalNoticeTemplate,
    appointmentReminderTemplate,
    recentLoginTemplate,
    paymentConfirmedTemplate,
    welcomeTemplate,
    invitationTemplate,
    magicLinkSignInTemplate,
    orgInviteTemplate,
    verificationCodeTemplate,
    resetPasswordTemplate,
  ];
}

export * from './types';
