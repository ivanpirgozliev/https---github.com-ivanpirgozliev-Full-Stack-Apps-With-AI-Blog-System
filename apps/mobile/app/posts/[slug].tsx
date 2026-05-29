import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Colors, Radii, Spacing } from "@/constants/theme";
import { Avatar } from "@/src/components/avatar";
import { Screen } from "@/src/components/screen";
import { ApiError } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth";
import { formatDate, formatNumber } from "@/src/lib/format";
import { useAddComment, useComments, usePost } from "@/src/hooks/use-posts";

export default function PostDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const post = usePost(slug);
  const comments = useComments(slug);
  const { user } = useAuth();
  const addComment = useAddComment(slug);
  const [draft, setDraft] = useState("");

  if (post.isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.xxl }} />
      </Screen>
    );
  }
  if (!post.data) {
    return (
      <Screen>
        <Text style={styles.center}>Post not found.</Text>
      </Screen>
    );
  }

  const p = post.data;
  const items = comments.data?.items ?? [];

  return (
    <Screen edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <FlatList
          data={items}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View>
              {p.coverImageUrl ? (
                <Image source={{ uri: p.coverImageUrl }} style={styles.cover} resizeMode="cover" />
              ) : null}
              <View style={styles.meta}>
                {p.category ? (
                  <Link href={{ pathname: "/categories/[slug]", params: { slug: p.category.slug } }} style={styles.category}>
                    {p.category.name.toUpperCase()}
                  </Link>
                ) : null}
                {p.category ? <Text style={styles.dot}>·</Text> : null}
                <Text style={styles.date}>{formatDate(p.publishedAt ?? p.createdAt)}</Text>
              </View>
              <Text style={styles.title}>{p.title}</Text>
              {p.excerpt ? <Text style={styles.excerpt}>{p.excerpt}</Text> : null}

              <View style={styles.bylineRow}>
                <View style={styles.bylineAuthor}>
                  <Avatar name={p.author.name} avatarUrl={p.author.avatarUrl} size={24} />
                  <Text style={styles.byline}>{p.author.name}</Text>
                </View>
                <Text style={styles.views}>{formatNumber(p.viewCount)} views</Text>
              </View>

              {/* Render content as paragraphs split on blank lines. */}
              {p.content.split(/\n{2,}/).map((para, i) => (
                <Text key={i} style={styles.paragraph}>
                  {para.trim()}
                </Text>
              ))}

              <Text style={styles.sectionHeader}>Comments ({comments.data?.total ?? 0})</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.commentItem}>
              <View style={styles.commentHead}>
                <View style={styles.commentAuthorRow}>
                  <Avatar name={item.author.name} avatarUrl={item.author.avatarUrl} size={20} />
                  <Text style={styles.commentAuthor}>{item.author.name}</Text>
                </View>
                <Text style={styles.commentDate}>{formatDate(item.createdAt)}</Text>
              </View>
              <Text style={styles.commentBody}>{item.content}</Text>
            </View>
          )}
          ListEmptyComponent={
            comments.isLoading ? (
              <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.lg }} />
            ) : (
              <Text style={styles.emptyComments}>No comments yet.</Text>
            )
          }
        />

        <View style={styles.composer}>
          {user ? (
            <>
              <TextInput
                style={styles.composerInput}
                placeholder="Add a comment…"
                placeholderTextColor={Colors.muted}
                value={draft}
                onChangeText={setDraft}
                multiline
                maxLength={2000}
              />
              <Pressable
                onPress={async () => {
                  if (!draft.trim()) return;
                  try {
                    await addComment.mutateAsync(draft.trim());
                    setDraft("");
                  } catch (e) {
                    alert(e instanceof ApiError ? e.message : "Could not post comment.");
                  }
                }}
                disabled={addComment.isPending || !draft.trim()}
                style={({ pressed }) => [
                  styles.composerBtn,
                  (addComment.isPending || !draft.trim()) && styles.composerBtnDisabled,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.composerBtnText}>
                  {addComment.isPending ? "Posting…" : "Post"}
                </Text>
              </Pressable>
            </>
          ) : (
            <Link href="/(auth)/login" style={styles.signInPrompt}>
              Sign in to comment
            </Link>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.lg, gap: Spacing.md },
  cover: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: Radii.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.mutedBg,
  },
  meta: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginBottom: Spacing.sm },
  category: { fontSize: 11, fontWeight: "700", color: Colors.accent, letterSpacing: 1 },
  dot: { color: Colors.muted },
  date: { fontSize: 12, color: Colors.muted },
  title: { fontSize: 26, fontWeight: "800", color: Colors.foreground, lineHeight: 32 },
  excerpt: { fontSize: 16, color: Colors.muted, marginTop: Spacing.md, lineHeight: 24 },
  bylineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  bylineAuthor: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, flex: 1 },
  byline: { fontSize: 13, color: Colors.muted },
  views: { fontSize: 13, color: Colors.muted },
  paragraph: { fontSize: 15, color: Colors.foreground, lineHeight: 24, marginBottom: Spacing.md },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.foreground,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  commentItem: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  commentHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.xs },
  commentAuthorRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  commentAuthor: { fontSize: 14, fontWeight: "600", color: Colors.foreground },
  commentDate: { fontSize: 12, color: Colors.muted },
  commentBody: { fontSize: 14, color: Colors.foreground, lineHeight: 20 },
  emptyComments: { textAlign: "center", color: Colors.muted, marginVertical: Spacing.lg },
  composer: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  composerInput: {
    flex: 1,
    backgroundColor: Colors.mutedBg,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    color: Colors.foreground,
    maxHeight: 100,
  },
  composerBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    justifyContent: "center",
  },
  composerBtnDisabled: { opacity: 0.5 },
  composerBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  signInPrompt: { color: Colors.accent, fontWeight: "600", textAlign: "center", flex: 1, padding: Spacing.md },
  center: { textAlign: "center", color: Colors.muted, marginTop: Spacing.xxl },
});
