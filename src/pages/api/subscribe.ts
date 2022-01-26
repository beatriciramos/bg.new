import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { query as q } from "faunadb";
import { fauna } from "../../services/fauna";
import { stripe } from "../../services/stripe";

type User = {
  ref: {
    id: string;
  };
  data: {
    stripe_customer_id: string;
  };
};

// eslint-disable-next-line import/no-anonymous-default-export
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const session = await getSession({ req }); // Pegando o usuário logado (acessando o cookie dentro da req);

    const user = await fauna.query<User>(
      q.Get(
        q.Match(
          q.Index("user_by_email"), // Procura usuário por email
          q.Casefold(session.user.email) // O email é igual
        )
      )
    );

    let customerId = user.data.stripe_customer_id;

    if (!customerId) {
      const stripeCustomer = await stripe.customers.create({
        // Criando um Custumer dentro do painel da Stripe;
        email: session.user.email,
      });

      await fauna.query(
        q.Update(
          // Atualizar o usuário
          q.Ref(q.Collection("users"), user.ref.id),
          {
            data: {
              stripe_customer_id: stripeCustomer.id,
            },
          }
        )
      );

      customerId = stripeCustomer.id;
    }

    const stripeCheckoutSession = await stripe.checkout.sessions.create({
      customer: customerId, // Quem esta comprando;
      payment_method_types: ["card"], // Tipos de pagamento;
      billing_address_collection: "required", // Obriga ou não preencher o endereço (auto);
      line_items: [{ price: "price_1KKSwyGN3SLIA3t61r3DdWb9", quantity: 1 }], // Itens;
      mode: "subscription", // Pagamento recorrente;
      allow_promotion_codes: true, // Permite cupons;
      success_url: process.env.STRIPE_SUCESS_URL, // Sucesso;
      cancel_url: process.env.STRIPE_CANCEL_URL, // Erro;
    });

    return res.status(200).json({ sessionId: stripeCheckoutSession.id });
  } else {
    res.setHeader("Allow", "POST"); // Explicando que o método que aceita é POST
    res.status(405).end("Method not allowed");
  }
};
