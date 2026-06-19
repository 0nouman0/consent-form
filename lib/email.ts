import nodemailer from "nodemailer";

export async function sendInvoiceEmail(
  toEmail: string,
  doctorName: string,
  invoiceDetails: {
    orderId: string;
    paymentId: string;
    amount: number; // in INR
    credits: number;
    date: string;
    paymentMethod: string;
    billingAddress?: string;
  }
) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  let transporter;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } else {
    // Generate test SMTP service account from ethereal.email (mock fallback)
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.error("Failed to create Ethereal test mail account, logging mail content to console:", err);
      console.log("=== SIMULATED INVOICE EMAIL ===");
      console.log(`To: ${toEmail}`);
      console.log(`Subject: Payment Receipt - Order ${invoiceDetails.orderId}`);
      console.log(`Credits added: ${invoiceDetails.credits}`);
      console.log(`Amount: ₹${invoiceDetails.amount}`);
      console.log("===============================");
      return null;
    }
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0;">Payment Receipt & Invoice</h2>
        <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Consent Form Generation Platform</p>
      </div>

      <div style="margin-bottom: 24px;">
        <p style="font-size: 14px; color: #334155;">Dear <strong>Dr. ${doctorName || "Doctor"}</strong>,</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.5;">Thank you for your payment. Your account has been successfully credited. Below are your invoice details.</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b;">Invoice Date</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #0f172a;">${invoiceDetails.date}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b;">Order ID</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #0f172a; font-family: monospace;">${invoiceDetails.orderId}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b;">Payment ID</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #0f172a; font-family: monospace;">${invoiceDetails.paymentId}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b;">Payment Mode</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #0f172a; text-transform: capitalize;">${invoiceDetails.paymentMethod || "Razorpay"}</td>
        </tr>
        ${invoiceDetails.billingAddress ? `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; vertical-align: top;">Billing Address</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #0f172a; white-space: pre-line;">${invoiceDetails.billingAddress}</td>
        </tr>
        ` : ""}
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b;">Credits Purchased</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #fbbf24;">+${invoiceDetails.credits} Credits</td>
        </tr>
        <tr style="border-bottom: 2px solid #0f172a;">
          <td style="padding: 12px 0; font-weight: bold; color: #0f172a; font-size: 14px;">Total Paid Amount</td>
          <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #0f172a; font-size: 16px;">₹${invoiceDetails.amount.toFixed(2)}</td>
        </tr>
      </table>

      <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 12px; color: #64748b;">Need help? Contact billing support at <a href="mailto:support@consentgen.com" style="color: #fbbf24; text-decoration: none; font-weight: bold;">support@consentgen.com</a></p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"ConsentGen Billing" <billing@consentgen.com>`,
      to: toEmail,
      subject: `Payment Receipt — ${invoiceDetails.credits} Credits Added`,
      html: htmlContent,
    });

    if (info.messageId) {
      const url = nodemailer.getTestMessageUrl(info);
      if (url) {
        console.log(`[Invoice Mail Mock Sent]: Preview URL is ${url}`);
      } else {
        console.log(`[Invoice Mail Sent]: Message ID ${info.messageId}`);
      }
    }
    return info;
  } catch (mailErr) {
    console.error("Failed to deliver invoice email:", mailErr);
    return null;
  }
}
