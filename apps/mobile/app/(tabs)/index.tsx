import { Link, router } from "expo-router";
import { Plus, Search } from "lucide-react-native";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Colors, Radii, Spacing } from "@/constants/theme";
import { PostCard } from "@/src/components/post-card";
import { Screen } from "@/src/components/screen";
import { useAuth } from "@/src/lib/auth";
import { usePostsInfinite } from "@/src/hooks/use-posts";
import { useState } from "react";

export default function FeedScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const numColumns = width >= 700 ? 2 : 1;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const query = usePostsInfinite({ status: "published", search: search || undefined });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
        {user && (
          <Pressable style={styles.fab} onPress={() => router.push("/posts/new")}>
            <Plus color={Colors.card} size={20} />
          </Pressable>
        )}
      </View>

      <View style={styles.searchBar}>
        <Search color={Colors.muted} size={16} />
        <TextInput
          placeholder="Search published posts…"
          placeholderTextColor={Colors.muted}
          style={styles.searchInput}
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={() => setSearch(searchInput.trim())}
          returnKeyType="search"
        />
        {searchInput ? (
          <Pressable
            onPress={() => {
              setSearchInput("");
              setSearch("");
            }}
          >
            <Text style={styles.clear}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        // The `key` forces FlatList to remount when columns change, RN limitation.
        key={`cols-${numColumns}`}
        data={items}
        keyExtractor={(p) => String(p.id)}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={numColumns > 1 ? styles.colItem : undefined}>
            <PostCard post={item} />
          </View>
        )}
        ListEmptyComponent={
          query.isLoading ? (
            <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.xxl }} />
          ) : (
            <Text style={styles.empty}>
              {query.isError ? "Could not load posts." : "No posts yet."}
            </Text>
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

      {!user && (
        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.signinPrompt}>
            <Text style={styles.signinPromptText}>Sign in to write a post →</Text>
          </Pressable>
        </Link>
      )}
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.foreground,
    paddingVertical: Spacing.md,
  },
  clear: { color: Colors.accent, fontSize: 13, fontWeight: "600" },
  list: { padding: Spacing.lg, paddingTop: 0, gap: Spacing.md },
  row: { gap: Spacing.md },
  colItem: { flex: 1 },
  empty: { textAlign: "center", color: Colors.muted, marginTop: Spacing.xxl },
  signinPrompt: {
    position: "absolute",
    bottom: Spacing.lg,
    alignSelf: "center",
    backgroundColor: Colors.foreground,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 999,
  },
  signinPromptText: { color: Colors.card, fontSize: 13, fontWeight: "600" },
});
