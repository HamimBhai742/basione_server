import { Request, Response } from "express";
import Stripe from "stripe";
import config from "../../config";

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
    console.log(Stripe)
    console.error("Webhook signature verification failed", err);
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  try {
    console.log(event);
    switch (event.type) {
      case "checkout.session.completed":
        console.log("checkout.session.completed");
        console.log(event?.data?.object?.metadata?.orderId);
        break;
      case "checkout.session.expired":
        console.log("checkout.session.expired");
        console.log(event?.data?.object?.metadata?.orderId);
        break;
      case "checkout.session.async_payment_succeeded":
        console.log("checkout.session.async_payment_succeeded");
        break;

      case "checkout.session.async_payment_failed":
        console.log("checkout.session.async_payment_failed");
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Error handling webhook", err);
    res.status(500).send("Webhook handler failed");
  }
};
