import { Redirect } from "expo-router";

export default function Index() {
  // Feed is the natural landing. Auth is enforced on per-screen basis.
  return <Redirect href="/(tabs)" />;
}
