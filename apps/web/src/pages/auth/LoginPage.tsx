import { colors, PageMeta, Text } from '@novu/design-system';
import AuthLayout from '../../components/layout/components/AuthLayout';
import { LoginForm } from './components/LoginForm';

const title = 'Sign In';

export default function LoginPage() {
  return (
    <AuthLayout title={title}>
      <PageMeta title={title} />
      <LoginForm />
    </AuthLayout>
  );
}
