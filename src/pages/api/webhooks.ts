import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "stream";
import Stripe from "stripe";
import { stripe } from "../../services/stripe";

// Cód pronto já

async function buffer(readable: Readable) {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

export const config = {
  api: {
    // Muda o entendimento padrão do next (documentação)
    bodyParser: false,
  },
};

const relevantEvents = new Set(["checkout.session.completed"]);

// eslint-disable-next-line import/no-anonymous-default-export
export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Transformando a requisição do stripe para ler no Javascript

  if (req.method === "POST") {
    const buf = await buffer(req);
    const secret = req.headers["stripe-signature"];

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        buf,
        secret,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook error:${err.message}`);
    }

    const { type } = event;

    if (relevantEvents.has(type)) {
      console.log("Evento recebido", event);
    }
    res.json({ received: true });
  } else {
    res.setHeader("Allow", "POST"); // Explicando que o método que aceita é POST
    res.status(405).end("Method not allowed");
  }
};
