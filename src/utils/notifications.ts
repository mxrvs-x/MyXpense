import * as Notifications from "expo-notifications";

// Ask permission
export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// Schedule daily reminder
export async function scheduleDailyReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Log your expenses 💸",
      body: "Don't forget to track today's expenses!",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, // ✅ FIX
      seconds: 60 * 60 * 24,
      repeats: true,
    },
  });
}

// Cancel reminder
export async function cancelReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
