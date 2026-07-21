import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging, Messaging } from "firebase-admin/messaging";
import config from "../../config";

let messaging: Messaging | null = null;

if (!getApps().length) {
  try {
    if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
      const app = initializeApp({
        credential: cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey,
        }),
      });
      messaging = getMessaging(app);
      console.log("Firebase Admin SDK initialized successfully.");
    } else {
      console.warn("Firebase credentials missing in configuration. Push notifications will not work.");
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
  }
} else {
  messaging = getMessaging();
}

export { messaging };
