import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Button, Field, Segmented, Txt } from '@/components/ui';
import { AuthErrors as Errors, AuthMode as Mode, validateAuth as validate } from '@/lib/auth';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme';

export default function SignIn() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: Mode }>();
  const { signIn, accountExists } = useStore();
  const [mode, setMode] = useState<Mode>(params.mode === 'signup' ? 'signup' : 'signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const submit = () => {
    const e = validate(mode, { name, email, password }, accountExists(email));
    setErrors(e);
    if (Object.keys(e).length) return;
    signIn({ name: mode === 'signup' ? name : email.split('@')[0], email, phone });
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingTop: Platform.OS === 'ios' ? 20 : insets.top + 12, gap: 18, paddingBottom: insets.bottom + 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={[styles.close, { backgroundColor: t.card, borderColor: t.line }]}>
            <Icon name="close" color={t.ink} />
          </Pressable>
        </View>
        <View style={{ gap: 6 }}>
          <Txt variant="display">{mode === 'signup' ? 'Bienvenue sur le court' : 'Bon retour'}</Txt>
          <Txt muted>
            {mode === 'signup'
              ? 'Un compte pour réserver dans tous les clubs de Bruxelles.'
              : 'Connectez-vous pour retrouver vos réservations.'}
          </Txt>
        </View>
        <Segmented
          value={mode}
          onChange={(m) => {
            setMode(m);
            setErrors({});
          }}
          options={[
            { value: 'signin', label: 'Connexion' },
            { value: 'signup', label: 'Inscription' },
          ]}
        />
        {mode === 'signup' && (
          <Field
            label="Prénom et nom"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            textContentType="name"
            placeholder="Camille Dubois"
            error={errors.name}
          />
        )}
        <Field
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="vous@exemple.be"
          error={errors.email}
        />
        {mode === 'signup' && (
          <Field
            label="Téléphone (facultatif)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder="+32 470 12 34 56"
          />
        )}
        <Field
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          placeholder="••••••"
          error={errors.password}
          onSubmitEditing={submit}
        />
        {errors.form && (
          <View style={[styles.formError, { backgroundColor: t.redWash }]}>
            <Txt variant="label" color={t.red}>
              {errors.form}
            </Txt>
          </View>
        )}
        <Button title={mode === 'signup' ? 'Créer mon compte' : 'Se connecter'} onPress={submit} />
        <Txt variant="caption" muted style={{ textAlign: 'center' }}>
          Compte de démonstration : il reste sur ce téléphone et le mot de passe n'est pas conservé.
        </Txt>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  close: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  formError: { padding: 14, borderRadius: 16 },
});
