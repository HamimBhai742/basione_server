import { messaging } from "../lib/firebase";
import { prisma } from "../lib/prisma";

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send push notification to all admins with registered FCM tokens.
 */
export const sendAdminPushNotification = async ({
  title,
  body,
  data,
}: PushNotificationPayload): Promise<void> => {
  try {
    // Save in-app notification to DB
    try {
      await (prisma as any).notification.create({
        data: {
          title,
          message: body,
          type: data?.type || "order",
          data: data || null,
        },
      });
    } catch (dbErr) {
      console.error("[Notification] Error saving in-app notification to DB:", dbErr);
    }

    if (!messaging) {
      console.warn("[PushNotification] Firebase Messaging is not initialized. Notification skipped.");
      return;
    }

    // Find all active admin users
    const admins = await prisma.user.findMany({
      where: {
        role: "admin",
        status: "active",
      },
      select: {
        id: true,
        fcmToken: true,
        fcmTokens: true,
      },
    });

    if (!admins || admins.length === 0) {
      console.log("[PushNotification] No active admins found to send push notification.");
      return;
    }

    // Collect all unique non-empty tokens
    const tokensSet = new Set<string>();
    const adminTokenMap = new Map<string, string[]>(); // userId -> tokens

    for (const admin of admins) {
      const tokens: string[] = [];
      if (admin.fcmToken && admin.fcmToken.trim().length > 0) {
        tokensSet.add(admin.fcmToken.trim());
        tokens.push(admin.fcmToken.trim());
      }
      if (Array.isArray(admin.fcmTokens)) {
        for (const token of admin.fcmTokens) {
          if (token && token.trim().length > 0) {
            tokensSet.add(token.trim());
            tokens.push(token.trim());
          }
        }
      }
      if (tokens.length > 0) {
        adminTokenMap.set(admin.id, tokens);
      }
    }

    const tokens = Array.from(tokensSet);

    if (tokens.length === 0) {
      console.log("[PushNotification] No registered admin FCM tokens found.");
      return;
    }

    console.log(`[PushNotification] Sending push notification to ${tokens.length} admin token(s)...`);

    // Ensure data object contains strings only
    const safeData: Record<string, string> = {};
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        safeData[key] = String(value);
      }
    }

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title,
        body,
      },
      data: safeData,
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "orders_channel",
        },
      },
      webpush: {
        headers: {
          Urgency: "high",
        },
        notification: {
          requireInteraction: true,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    });

    console.log(
      `[PushNotification] Sent successfully. Success count: ${response.successCount}, Failure count: ${response.failureCount}`,
    );

    // Clean up stale or unregistered tokens if any failed
    if (response.failureCount > 0) {
      const tokensToRemove: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          console.error(`[PushNotification] Token index ${idx} failed:`, resp.error?.code, resp.error?.message);
          const errCode = resp.error?.code;
          if (
            errCode === "messaging/invalid-registration-token" ||
            errCode === "messaging/registration-token-not-registered"
          ) {
            tokensToRemove.push(tokens[idx]);
          }
        }
      });

      if (tokensToRemove.length > 0) {
        console.log(`[PushNotification] Cleaning up ${tokensToRemove.length} stale token(s)...`);
        for (const [userId, userTokens] of adminTokenMap.entries()) {
          const remainingTokens = userTokens.filter((t) => !tokensToRemove.includes(t));
          if (remainingTokens.length !== userTokens.length) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                fcmToken: remainingTokens[0] || null,
                fcmTokens: remainingTokens,
              },
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("[PushNotification] Error sending push notification:", error);
  }
};
