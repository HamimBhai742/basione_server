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
    console.error("Webhook signature verification failed", err);
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  try {
    console.log(event);
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Error handling webhook", err);
    res.status(500).send("Webhook handler failed");
  }
};
