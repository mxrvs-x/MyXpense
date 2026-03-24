import { useTheme } from "@/types/theme";
import { View } from "react-native";
import { Button, Modal, Portal, Text } from "react-native-paper";

export default function UpdateModal({
  visible,
  onClose,
  onUpdate,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void | Promise<void>; // 👈 allow async
  loading?: boolean; // 👈 ADD THIS
}) {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={{
          margin: 20,
          borderRadius: 20,
          padding: 20,
          backgroundColor: theme.colors.surface,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: theme.colors.onSurface,
              marginBottom: 8,
            }}
          >
            Update Available 🚀
          </Text>

          <Text
            style={{
              color: theme.colors.onSurfaceVariant,
              marginBottom: 20,
            }}
          >
            A new version of MyXpense is ready. Install now?
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            <Button onPress={onClose} disabled={loading}>
              Later
            </Button>

            <Button
              mode="contained"
              onPress={onUpdate}
              loading={loading}
              disabled={loading}
              style={{
                borderRadius: 12,
              }}
            >
              Update
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
}
