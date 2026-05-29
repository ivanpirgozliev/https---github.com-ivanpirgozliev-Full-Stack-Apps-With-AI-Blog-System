import { Image, StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/theme";

interface AvatarProps {
  name: string;
  avatarUrl: string | null | undefined;
  size: number;
}

export function Avatar({ name, avatarUrl, size }: AvatarProps) {
  const r = size / 2;
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: r, backgroundColor: Colors.mutedBg }}
      />
    );
  }
  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: r },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.45 }]}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  letter: {
    color: "#fff",
    fontWeight: "700",
  },
});
