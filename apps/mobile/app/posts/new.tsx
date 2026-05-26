import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Colors, Radii, Spacing } from "@/constants/theme";
import { GradientButton } from "@/src/components/gradient-button";
import { Screen } from "@/src/components/screen";
import { ApiError, api } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth";
import { useCreatePost } from "@/src/hooks/use-posts";

interface PresignResponse {
  mediaId: string;
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export default function NewPostScreen() {
  const { user, token, loading: authLoading } = useAuth();
  const createPost = useCreatePost();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
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
          <Text style={styles.gateTitle}>Sign in to write a post</Text>
          <GradientButton label="Sign in" onPress={() => router.push("/(auth)/login")} />
        </View>
      </Screen>
    );
  }

  async function pickImage() {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Photo library permission denied.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    setUploading(true);
    try {
      const mimeType = asset.mimeType ?? "image/jpeg";
      const sizeBytes = asset.fileSize ?? 0;
      if (sizeBytes > 5 * 1024 * 1024) {
        throw new Error("Image must be smaller than 5 MB.");
      }
      const presign = await api<PresignResponse>("/api/v1/uploads/presign", {
        body: {
          mimeType,
          sizeBytes,
          filename: asset.fileName ?? "photo.jpg",
        },
        token,
      });
      const file = await fetch(asset.uri);
      const blob = await file.blob();
      const put = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "content-type": mimeType },
        body: blob,
      });
      if (!put.ok) throw new Error(`Upload failed (HTTP ${put.status})`);
      setCoverImageUrl(presign.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(status: "draft" | "published") {
    setError(null);
    if (title.trim().length === 0 || content.trim().length === 0) {
      setError("Title and content are required.");
      return;
    }
    try {
      const post = await createPost.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || null,
        coverImageUrl: coverImageUrl ?? null,
        status,
      });
      router.replace({ pathname: "/posts/[slug]", params: { slug: post.slug } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create post.");
    }
  }

  return (
    <Screen edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.field}>
            <Text style={styles.label}>Cover image</Text>
            {coverImageUrl ? (
              <View>
                <Image source={{ uri: coverImageUrl }} style={styles.preview} />
                <View style={styles.coverActions}>
                  <Pressable onPress={pickImage} style={styles.ghostBtn}>
                    <Text style={styles.ghostBtnText}>Replace</Text>
                  </Pressable>
                  <Pressable onPress={() => setCoverImageUrl(null)} style={styles.ghostBtn}>
                    <Text style={[styles.ghostBtnText, { color: Colors.danger }]}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={pickImage}
                disabled={uploading}
                style={[styles.picker, uploading && { opacity: 0.5 }]}
              >
                <Text style={styles.pickerText}>
                  {uploading ? "Uploading…" : "Tap to choose an image"}
                </Text>
                <Text style={styles.pickerHint}>JPEG, PNG, WebP, or GIF — up to 5 MB</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Give it a snappy title"
              placeholderTextColor={Colors.muted}
              maxLength={255}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Excerpt</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={excerpt}
              onChangeText={setExcerpt}
              placeholder="A one-sentence preview (optional)"
              placeholderTextColor={Colors.muted}
              multiline
              maxLength={500}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Content</Text>
            <TextInput
              style={[styles.input, styles.contentArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Write your story. Markdown supported."
              placeholderTextColor={Colors.muted}
              multiline
              textAlignVertical="top"
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <Pressable
              onPress={() => submit("draft")}
              disabled={createPost.isPending}
              style={({ pressed }) => [styles.ghostBtn, styles.flex, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.ghostBtnText}>Save draft</Text>
            </Pressable>
            <View style={styles.flex}>
              <GradientButton
                label={createPost.isPending ? "Publishing…" : "Publish"}
                loading={createPost.isPending}
                onPress={() => submit("published")}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, gap: Spacing.lg },
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
  textarea: { minHeight: 70 },
  contentArea: { minHeight: 200 },
  preview: { width: "100%", aspectRatio: 16 / 9, borderRadius: Radii.md, backgroundColor: Colors.mutedBg },
  coverActions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm },
  picker: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: Radii.md,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  pickerText: { fontSize: 14, fontWeight: "600", color: Colors.foreground },
  pickerHint: { fontSize: 12, color: Colors.muted },
  error: {
    color: Colors.danger,
    fontSize: 13,
    backgroundColor: "#fef2f2",
    padding: Spacing.md,
    borderRadius: Radii.md,
  },
  actions: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.md },
  flex: { flex: 1 },
  ghostBtn: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnText: { fontSize: 14, fontWeight: "600", color: Colors.foreground },
  gate: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl, gap: Spacing.md },
  gateTitle: { fontSize: 18, fontWeight: "700", color: Colors.foreground, textAlign: "center" },
});
