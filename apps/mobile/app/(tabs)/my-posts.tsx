import { Link, router } from "expo-router";
import { Plus } from "lucide-react-native";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Colors, Radii, Spacing } from "@/constants/theme";
import { PostCard } from "@/src/components/post-card";
import { Screen } from "@/src/components/screen";
import { GradientButton } from "@/src/components/gradient-button";
import { useAuth } from "@/src/lib/auth";
import { usePostsInfinite } from "@/src/hooks/use-posts";

export default function MyPostsScreen() {
  const { user, loading } = useAuth();

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
          <Text style={styles.gateTitle}>Sign in to manage your posts</Text>
          <Text style={styles.gateSub}>Track drafts, edit titles, and publish from your phone.</Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <GradientButton label="Sign in" onPress={() => router.push("/(auth)/login")} />
            </Pressable>
          </Link>
        </View>
      </Screen>
    );
  }

  return <MyPostsList userId={user.id} />;
}

function MyPostsList({ userId }: { userId: string }) {
  // No status filter — show drafts + published together.
  const query = usePostsInfinite({ authorId: userId });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>My posts</Text>
        <Pressable style={styles.fab} onPress={() => router.push("/posts/new")}>
          <Plus color={Colors.card} size={20} />
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View>
            <View style={styles.statusRow}>
              <Text
                style={[
                  styles.statusBadge,
                  item.status === "published" ? styles.statusPublished : styles.statusDraft,
                ]}
              >
                {item.status.toUpperCase()}
              </Text>
            </View>
            <PostCard post={item} />
          </View>
        )}
        ListEmptyComponent={
          query.isLoading ? (
            <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.xxl }} />
          ) : (
            <Text style={styles.empty}>You haven&apos;t written anything yet.</Text>
          )
        }
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        refreshing={query.isRefetching}
        onRefresh={() => query.refetch()}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.lg }} />
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: { fontSize: 24, fontWeight: "700", color: Colors.foreground },
  fab: {
    backgroundColor: Colors.accent,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { padding: Spacing.lg, paddingTop: 0, gap: Spacing.lg },
  statusRow: { flexDirection: "row", marginBottom: Spacing.sm },
  statusBadge: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  statusPublished: { backgroundColor: "#dcfce7", color: "#15803d" },
  statusDraft: { backgroundColor: "#fef3c7", color: "#b45309" },
  empty: { textAlign: "center", color: Colors.muted, marginTop: Spacing.xxl },
  gate: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl, gap: Spacing.md },
  gateTitle: { fontSize: 18, fontWeight: "700", color: Colors.foreground, textAlign: "center" },
  gateSub: { fontSize: 14, color: Colors.muted, textAlign: "center", marginBottom: Spacing.md },
});
