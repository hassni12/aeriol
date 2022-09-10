const stripe = require("stripe")(process.env.STRIPE_KEY);

const RefundPaymentCustom = async (amount, paymentIntent) => {
  try {
    const refund = await stripe.refunds.create({
      amount: amount * 100,
      payment_intent: paymentIntent,
    });
    return refund;
  } catch (err) {
    throw err;
  }
};

module.exports = RefundPaymentCustom;
