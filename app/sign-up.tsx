import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Redirect, router } from 'expo-router';

import { AuthLink, AuthScreenLayout, authFieldStyles } from '@/components/AuthScreen';
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
          textContentType="newPassword"
          autoComplete="new-password"
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
        onPress={handleSignUp}
      >
        <Text style={authFieldStyles.primaryLabel}>Create account</Text>
      </Pressable>
    </AuthScreenLayout>
  );
}
