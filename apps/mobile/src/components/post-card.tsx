import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import type { PublicPostWithRefs } from "@blog/shared";
import { Colors, Radii, Spacing } from "../../constants/theme";
import { formatDate, formatNumber } from "../lib/format";

export function PostCard({ post }: { post: PublicPostWithRefs }) {
  return (
    <Link href={`/posts/${post.slug}`} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        {post.coverImageUrl ? (
          <Image source={{ uri: post.coverImageUrl }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Text style={styles.coverPlaceholderText}>NO COVER</Text>
          </View>
        )}
        <View style={styles.body}>
          <View style={styles.meta}>
            {post.category ? (
              <Text style={styles.category}>{post.category.name.toUpperCase()}</Text>
            ) : (
              <Text style={styles.uncategorized}>UNCATEGORIZED</Text>
            )}
            <Text style={styles.dot}>·</Text>
            <Text style={styles.date}>{formatDate(post.publishedAt ?? post.createdAt)}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {post.title}
          </Text>
          {post.excerpt ? (
            <Text style={styles.excerpt} numberOfLines={3}>
              {post.excerpt}
            </Text>
          ) : null}
          <View style={styles.footer}>
            <Text style={styles.author} numberOfLines={1}>
              By {post.author.name}
            </Text>
            <Text style={styles.views}>{formatNumber(post.viewCount)} views</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    borderColor: Colors.border,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cover: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: Colors.mutedBg,
  },
  coverPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  coverPlaceholderText: {
    color: Colors.muted,
    fontSize: 11,
    letterSpacing: 1,
  },
  body: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  category: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.accent,
    letterSpacing: 1,
  },
  uncategorized: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.muted,
    letterSpacing: 1,
  },
  dot: {
    color: Colors.muted,
  },
  date: {
    fontSize: 12,
    color: Colors.muted,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.foreground,
    lineHeight: 22,
  },
  excerpt: {
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  author: {
    fontSize: 12,
    color: Colors.muted,
    flex: 1,
    marginRight: Spacing.sm,
  },
  views: {
    fontSize: 12,
    color: Colors.muted,
  },
});
