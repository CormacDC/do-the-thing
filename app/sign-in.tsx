import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Redirect, router } from 'expo-router';

import { AuthLink, AuthScreenLayout, authFieldStyles } from '@/components/AuthScreen';
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
      <View style={authFieldStyles.field}>
        <Text style={authFieldStyles.label}>Email</Text>
        <TextInput
          style={authFieldStyles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
        />
      </View>

      <View style={authFieldStyles.field}>
        <Text style={authFieldStyles.label}>Password</Text>
        <TextInput
          style={authFieldStyles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          autoComplete="password"
        />
      </View>

      {formError ? (
        <Pressable
          accessibilityRole="button"
          style={authFieldStyles.errorBanner}
          onPress={() => setFormError(null)}
        >
          <Text style={authFieldStyles.errorText}>{formError}</Text>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={auth.loading || submitting}
        style={({ pressed }) => [
          authFieldStyles.primaryButton,
          (auth.loading || submitting) && authFieldStyles.primaryButtonDisabled,
          pressed && !auth.loading && !submitting && authFieldStyles.primaryButtonPressed,
        ]}
        onPress={handleSignIn}
      >
        <Text style={authFieldStyles.primaryLabel}>Sign in</Text>
      </Pressable>
    </AuthScreenLayout>
  );
}
