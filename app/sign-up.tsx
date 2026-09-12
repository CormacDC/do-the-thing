import { useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';

import { AuthLink, AuthScreenLayout } from '@/components/AuthScreen';
import { Banner } from '@/components/ui/Banner';
import { PrimaryButton } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/hooks/useAuth';

const MIN_PASSWORD_LENGTH = 6;

export default function SignUpScreen() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!auth.loading && auth.session && !auth.isAnonymous) {
    return <Redirect href="/" />;
  }

  const handleSignUp = async () => {
    setFormError(null);

    if (!email.trim()) {
      setFormError('Enter your email address.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`Choose a password with at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setSubmitting(true);
    const { error } = await auth.signUpWithEmail(email, password);
    setSubmitting(false);

    if (error) {
      setFormError(error);
      return;
    }

    router.replace('/');
  };

  return (
    <AuthScreenLayout
      title="Create account"
      subtitle={
        auth.isAnonymous
          ? 'Save your progress by creating a permanent account.'
          : 'Start holding yourself accountable.'
      }
      loading={auth.loading || submitting}
      footer={<AuthLink prompt="Already have an account?" href="/sign-in" label="Sign in" />}
    >
      <TextField
        label="Email"
        icon={Mail}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
      />

      <TextField
        label="Password"
        icon={Lock}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
      />

      {formError ? (
        <Banner tone="error" body={formError} onPress={() => setFormError(null)} />
      ) : null}

      <PrimaryButton
        label="Create account"
        loading={auth.loading || submitting}
        onPress={() => {
          void handleSignUp();
        }}
      />
    </AuthScreenLayout>
  );
}
