import { useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';

import { AuthLink, AuthScreenLayout } from '@/components/AuthScreen';
import { Banner } from '@/components/ui/Banner';
import { PrimaryButton } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/hooks/useAuth';

export default function SignInScreen() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!auth.loading && auth.session && !auth.isAnonymous) {
    return <Redirect href="/" />;
  }

  const handleSignIn = async () => {
    setFormError(null);

    if (!email.trim()) {
      setFormError('Enter your email address.');
      return;
    }
    if (!password) {
      setFormError('Enter your password.');
      return;
    }

    setSubmitting(true);
    const { error } = await auth.signInWithEmail(email, password);
    setSubmitting(false);

    if (error) {
      setFormError(error);
      return;
    }

    router.replace('/');
  };

  return (
    <AuthScreenLayout
      title="Sign in"
      subtitle="Pick up where you left off."
      loading={auth.loading || submitting}
      footer={<AuthLink prompt="New here?" href="/sign-up" label="Create an account" />}
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
        textContentType="password"
        autoComplete="password"
      />

      {formError ? (
        <Banner tone="error" body={formError} onPress={() => setFormError(null)} />
      ) : null}

      <PrimaryButton
        label="Sign in"
        loading={auth.loading || submitting}
        onPress={() => {
          void handleSignIn();
        }}
      />
    </AuthScreenLayout>
  );
}
