import { sendInvoiceEmail } from "../lib/email";

async function main() {
  console.log("Sending smoke test invoice email...");
  const result = await sendInvoiceEmail("saqlainahmed302@gmail.com", "Aslam Ahmed", {
    orderId: "order_smoke_test_957ac9e3",
    paymentId: "pay_smoke_test_6005dabe",
    amount: 200.00,
    credits: 1,
    date: new Date().toLocaleDateString("en-IN"),
    paymentMethod: "upi",
    billingAddress: "Suite 204, Apollo Plaza, Richmond Road, Bangalore - 560025"
  });
  
  if (result) {
    console.log("Email sent successfully!");
  } else {
    console.error("Email sending failed or outputted to console.");
  }
}

main().catch(console.error);
