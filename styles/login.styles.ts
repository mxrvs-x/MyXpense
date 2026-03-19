import { StyleSheet } from "react-native";
import { colors, radius, spacing } from "../constants/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 5,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.input,
    color: colors.text,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonText: {
    color: colors.text,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#475569",
  },

  dividerText: {
    color: "#94a3b8",
    marginHorizontal: 10,
  },
});
