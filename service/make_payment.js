const stripe = require("stripe")(process.env.STRIPE_KEY);

const MakePayment = async (
  card_number,
  card_expiration_month,
  card_expiration_year,
  card_cvv,
  email,
  order_id,
  total
) => {
  try {
    const token = await stripe.tokens.create({
      card: {
        number: card_number,
        exp_month: card_expiration_month,
        exp_year: card_expiration_year,
        cvc: card_cvv,
      },
    });
    if (!token.id)
      throw new Error(
        "Something went wrong while processing payment. You haven't been charged"
      );
    const customer = await stripe.customers.create({
      email: email,
      source: token.id,
    });
    if (!customer.id)
      throw new Error(
        "Something went wrong while processing payment. You haven't been charged"
      );
    return stripe.charges.create({
      amount: parseFloat(total) * 100,
      description: `Products Purchase of Aeriol Ashcher. Order ID: ${order_id}`,
      currency: "usd",
      customer: customer.id,
    });
  } catch (err) {
    console.log(err)
    throw err;
  }
};

module.exports = MakePayment;
