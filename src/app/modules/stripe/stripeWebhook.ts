import { Request, Response } from "express";
import Stripe from "stripe";
import config from "../../../config";
import {
  cancelePayment,
  failedPayment,
  successPayment,
} from "./stripe.service";

const stripe = new Stripe(config.stripe.secret);

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhook_secret,
    );
  } catch (err) {
    console.log(Stripe);
    console.error("Webhook signature verification failed", err);
    return res.status(400).send(`Webhook Error: ${(err as Error)?.message}`);
  }

  try {
    console.log(event);
    let reason = "";
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("✅ checkout.session.completed", session.id);

        if (!session.metadata?.orderId) {
          res.status(400).send("Missing orderId in session metadata");
          break;
        }

        await successPayment(
          session.metadata.orderId,
          session.metadata.paymentId,
        );
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const error = paymentIntent.last_payment_error;
        const sessionId = paymentIntent.id;
        const session = await stripe.checkout.sessions.list({
          payment_intent: sessionId,
          limit: 1,
        });
        console.log(session);
        console.log("❌ payment_intent.payment_failed", paymentIntent.id);

        if (!paymentIntent.metadata?.orderId) {
          res.status(400).send("⚠️ Missing orderId in payment_failed");
          break;
        }

        await failedPayment(
          paymentIntent.metadata.orderId,
          paymentIntent.metadata.paymentId,
          error?.message,
          session?.data[0]?.url as string,
        );
        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const message = paymentIntent.cancellation_reason;
        reason = message || "Payment was canceled by the user";
        console.log("🚫 payment_intent.canceled", paymentIntent.id);

        if (!paymentIntent.metadata?.orderId) {
          res.status(400).send("⚠️ Missing orderId in payment_canceled");
          break;
        }

        await cancelePayment(paymentIntent.metadata.orderId, reason);
        break;
      }

      case "checkout.session.expired": {
        console.log(event.data.object);
        reason = "User did not complete payment in time";
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("⏳ checkout.session.expired", session);

        if (!session.metadata?.orderId) {
          res
            .status(400)
            .send("⚠️ Missing orderId in checkout.session.expired");
          break;
        }

        await cancelePayment(session.metadata?.orderId, reason);
        break;
      }

      case "checkout.session.async_payment_succeeded":
        console.log("✅ checkout.session.async_payment_succeeded");
        break;

      case "checkout.session.async_payment_failed":
        console.log("❌ checkout.session.async_payment_failed");
        break;

      default:
        console.log(`⚡ Unhandled event type: ${event.type}`);
        break;
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Error handling webhook", err);
    res.status(500).send("Webhook handler failed");
  }
};
