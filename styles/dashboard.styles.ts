import { StyleSheet } from "react-native";
import { colors, radius, spacing } from "../constants/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },

  cardPrimary: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },

  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  cardTitle: {
    color: colors.textSecondary,
    marginBottom: 5,
  },

  amount: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
  },

  amountSmall: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  item: {
    color: "#fff",
    marginTop: 5,
  },

  addButton: {
    backgroundColor: "#3b82f6",
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: "center",
  },

  addText: {
    color: "#fff",
    fontWeight: "600",
  },
});
