const stripe = require("stripe")(process.env.STRIPE_KEY);

const RefundPayment = async (paymentIntent) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntent,
    });
    return refund;
  } catch (err) {
    throw err;
  }
};

module.exports = RefundPayment;
