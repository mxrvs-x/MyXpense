import { StyleSheet } from "react-native";
import { colors, radius, spacing } from "../constants/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },

  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },

  title: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontSize: 16,
  },

  input: {
    backgroundColor: "#334155",
    color: "#fff",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },

  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  listItem: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  provider: {
    color: "#fff",
    fontSize: 16,
  },

  dueDate: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  amount: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  paidButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    marginTop: 6,
    alignSelf: "flex-start",
  },

  paidText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  emptyText: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
