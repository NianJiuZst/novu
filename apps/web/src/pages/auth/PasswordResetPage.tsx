import { Button, colors, PageMeta, Text } from '@novu/design-system';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthLayout from '../../components/layout/components/AuthLayout';
import { ROUTES } from '../../constants/routes';
import { PasswordResetForm } from './components/PasswordResetForm';
import { PasswordResetRequestForm } from './components/PasswordResetRequestForm';

const title = 'Reset password';

export function PasswordResetPage() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [showSentSuccess, setShowSentSuccess] = useState<boolean>();

  if (showSentSuccess) {
    return (
      <AuthLayout title="Reset Sent!">
        <PageMeta title={title} />
        <Text size="lg" color={colors.B60} mb={60} mt={20}>
          We've sent a password reset link to the account associated with your email
        </Text>
        <Button data-test-id="success-screen-reset" onClick={() => navigate(ROUTES.AUTH_LOGIN)} inherit>
          Go Back
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={title}>
      <PageMeta title={title} />
      {!token && <PasswordResetRequestForm onSent={() => setShowSentSuccess(true)} />}
      {token && <PasswordResetForm token={token} />}
    </AuthLayout>
  );
}
