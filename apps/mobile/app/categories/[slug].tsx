import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Colors, Spacing } from "@/constants/theme";
import { PostCard } from "@/src/components/post-card";
import { Screen } from "@/src/components/screen";
import { usePostsInfinite } from "@/src/hooks/use-posts";

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const numColumns = width >= 700 ? 2 : 1;

  const query = usePostsInfinite({ status: "published", categorySlug: slug });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  return (
    <Screen edges={["left", "right", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CATEGORY</Text>
        <Text style={styles.title}>{prettyName(slug)}</Text>
        <Text style={styles.count}>{total.toLocaleString()} posts</Text>
      </View>

      <FlatList
        key={`cols-${numColumns}`}
        data={items}
        keyExtractor={(p) => String(p.id)}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={numColumns > 1 ? styles.col : undefined}>
            <PostCard post={item} />
          </View>
        )}
        ListEmptyComponent={
          query.isLoading ? (
            <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.xxl }} />
          ) : (
            <Text style={styles.empty}>No posts in this category yet.</Text>
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

function prettyName(slug: string | undefined): string {
  if (!slug) return "";
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

const styles = StyleSheet.create({
  header: { padding: Spacing.lg },
  eyebrow: { fontSize: 11, fontWeight: "700", color: Colors.accent, letterSpacing: 1, marginBottom: Spacing.xs },
  title: { fontSize: 28, fontWeight: "800", color: Colors.foreground },
  count: { fontSize: 13, color: Colors.muted, marginTop: Spacing.xs },
  list: { padding: Spacing.lg, paddingTop: 0, gap: Spacing.md },
  row: { gap: Spacing.md },
  col: { flex: 1 },
  empty: { textAlign: "center", color: Colors.muted, marginTop: Spacing.xxl },
});
