import { router } from "expo-router";
import { LogOut, Shield } from "lucide-react-native";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Colors, Radii, Spacing } from "@/constants/theme";
import { GradientButton } from "@/src/components/gradient-button";
import { Screen } from "@/src/components/screen";
import { useAuth } from "@/src/lib/auth";
import { formatDate } from "@/src/lib/format";

export default function ProfileScreen() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.xxl }} />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <View style={styles.gate}>
          <Text style={styles.gateTitle}>You&apos;re not signed in</Text>
          <Text style={styles.gateSub}>
            Create an account or sign in to track your posts and write new ones from your phone.
          </Text>
          <GradientButton label="Sign in" onPress={() => router.push("/(auth)/login")} />
          <Pressable onPress={() => router.push("/(auth)/register")} style={styles.linkBtn}>
            <Text style={styles.linkText}>Create account</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.name}</Text>
            {user.role === "admin" && (
              <View style={styles.adminBadge}>
                <Shield color="#fff" size={11} />
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}
          </View>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.joined}>Joined {formatDate(user.createdAt)}</Text>
        </View>
      </View>

      <Pressable
        onPress={async () => {
          await logout();
          router.replace("/(tabs)");
        }}
        style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
      >
        <LogOut color={Colors.danger} size={16} />
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: 24, fontWeight: "700", color: Colors.foreground },
  card: {
    margin: Spacing.lg,
    padding: Spacing.xl,
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontSize: 28, fontWeight: "700", color: "#fff" },
  info: { flex: 1, gap: Spacing.xs },
  nameRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  name: { fontSize: 18, fontWeight: "700", color: Colors.foreground },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  adminText: { color: "#fff", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  email: { fontSize: 13, color: Colors.muted },
  joined: { fontSize: 12, color: Colors.muted },
  logoutBtn: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: Radii.md,
  },
  logoutText: { color: Colors.danger, fontSize: 15, fontWeight: "600" },
  gate: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl, gap: Spacing.md },
  gateTitle: { fontSize: 20, fontWeight: "700", color: Colors.foreground, textAlign: "center" },
  gateSub: { fontSize: 14, color: Colors.muted, textAlign: "center", marginBottom: Spacing.md },
  linkBtn: { padding: Spacing.sm },
  linkText: { color: Colors.accent, fontSize: 14, fontWeight: "600" },
});
