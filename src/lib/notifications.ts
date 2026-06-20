import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    // Simulators can't receive push but local notifications still work
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "PERX",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6366F1"
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: "local-perx-ai-wallet"
    });
    return token.data;
  } catch {
    return null;
  }
}

async function fireLocal(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null
  });
}

async function sendPush(token: string, title: string, body: string) {
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ to: token, sound: "default", title, body })
    });
  } catch {
    // silently fail — push is best-effort
  }
}

async function dispatch(
  title: string,
  body: string,
  recipientToken?: string | null
) {
  if (recipientToken) {
    await sendPush(recipientToken, title, body);
  } else {
    await fireLocal(title, body);
  }
}

export const notify = {
  perkApproved(perkNames: string[], recipientToken?: string | null) {
    const label =
      perkNames.length === 1
        ? perkNames[0]
        : `${perkNames.slice(0, 2).join(", ")}${perkNames.length > 2 ? " & more" : ""}`;
    return dispatch(
      "Perk approved!",
      `Your ${label} package has been approved and is ready to use.`,
      recipientToken
    );
  },

  requestPending(employeeName: string, recipientToken?: string | null) {
    return dispatch(
      "New approval request",
      `${employeeName} submitted a perk request — tap to review.`,
      recipientToken
    );
  },

  newPerks(category: string, count: number, recipientToken?: string | null) {
    return dispatch(
      `New ${category} perks`,
      `${count} new ${category} perk${count > 1 ? "s" : ""} just added. Tap to explore.`,
      recipientToken
    );
  },

  pointsExpiring(points: number, daysLeft: number, recipientToken?: string | null) {
    return dispatch(
      "Points expiring soon",
      `You have ${points.toLocaleString()} points expiring in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Use them before they're gone.`,
      recipientToken
    );
  },

  challengeCompleted(title: string, points: number, recipientToken?: string | null) {
    return dispatch(
      "Challenge completed!",
      `You earned ${points.toLocaleString()} points for "${title}".`,
      recipientToken
    );
  },

  challengeCreated(title: string, recipientToken?: string | null) {
    return dispatch(
      "New team challenge",
      `Your employer posted: ${title}`,
      recipientToken
    );
  },

  challengeDueSoon(title: string, daysLeft: number, recipientToken?: string | null) {
    return dispatch(
      "Challenge due soon",
      `"${title}" is due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.`,
      recipientToken
    );
  }
};
