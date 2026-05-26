import { Link, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { Colors, Radii, Spacing } from "@/constants/theme";
import { GradientButton } from "@/src/components/gradient-button";
import { Screen } from "@/src/components/screen";
import { ApiError } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!name.trim() || !email.trim() || password.length < 8) {
      setError("Name, email, and a password of at least 8 chars are required.");
      return;
    }
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim().toLowerCase(), password });
      router.replace("/(tabs)");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Sign-up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.brand}>
          <Text style={styles.brandText}>
            Blog<Text style={styles.brandDot}>.</Text>
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>It&apos;s free and takes a minute.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              autoComplete="name"
              placeholder="Jane Doe"
              placeholderTextColor={Colors.muted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={Colors.muted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              placeholder="••••••••"
              placeholderTextColor={Colors.muted}
            />
            <Text style={styles.hint}>At least 8 characters.</Text>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <GradientButton label="Create account" onPress={handleSubmit} loading={loading} />

          <View style={styles.footerLink}>
            <Text style={styles.muted}>Already have an account? </Text>
            <Link href="/(auth)/login" style={styles.linkText}>
              Sign in
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.lg, justifyContent: "center" },
  brand: { alignItems: "center", marginBottom: Spacing.xl },
  brandText: { fontSize: 28, fontWeight: "700", color: Colors.foreground },
  brandDot: { color: Colors.accent },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: { fontSize: 24, fontWeight: "700", color: Colors.foreground },
  subtitle: { fontSize: 14, color: Colors.muted, marginTop: -Spacing.md },
  field: { gap: Spacing.xs },
  label: { fontSize: 13, fontWeight: "600", color: Colors.foreground },
  input: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
    color: Colors.foreground,
  },
  hint: { fontSize: 12, color: Colors.muted },
  error: {
    color: Colors.danger,
    fontSize: 13,
    backgroundColor: "#fef2f2",
    padding: Spacing.md,
    borderRadius: Radii.md,
  },
  footerLink: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  muted: { color: Colors.muted, fontSize: 13 },
  linkText: { color: Colors.accent, fontSize: 13, fontWeight: "600" },
});
