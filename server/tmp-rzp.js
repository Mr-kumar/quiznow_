const Razorpay = require('razorpay');
require('dotenv').config({path: '/Users/manishkumar/Desktop/quiznow/server/.env'});

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function run() {
  try {
    const id = "cm88cuidlength25chrs12345";
    const receiptStr = `order_${id}_${Date.now()}`;
    console.log("Receipt string: ", receiptStr);
    console.log("Length: ", receiptStr.length);

    await rzp.orders.create({
      amount: 1000,
      currency: 'INR',
      receipt: receiptStr,
    });
    console.log("SUCCESS");
  } catch (err) {
    console.error("ERROR from Razorpay:", err);
  }
}
run();
