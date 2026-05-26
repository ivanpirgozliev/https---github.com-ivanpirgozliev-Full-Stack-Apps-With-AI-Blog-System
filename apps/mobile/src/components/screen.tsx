import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, type ViewStyle, type StyleProp } from "react-native";
import { Colors } from "../../constants/theme";

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: readonly ("top" | "bottom" | "left" | "right")[];
}

export function Screen({ children, style, edges }: ScreenProps) {
  return (
    <SafeAreaView edges={edges ?? ["top", "left", "right"]} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
