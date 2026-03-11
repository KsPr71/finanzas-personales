import { useThemeColor } from "@/hooks/use-theme-color";
import { StyleSheet, View } from "react-native";

export default function Separator() {
  const backgroundColor = useThemeColor({}, "border");

  return <View style={[styles.separator, { backgroundColor }]} />;
}

const styles = StyleSheet.create({
  separator: {
    paddingTop: 0,
    height: 1,
  },
});
