import nodemailer from "nodemailer"
import SMTPTransport from "nodemailer/lib/smtp-transport"

interface EmailOptions {
  to: string
  subject: string
  body: string
  metadata?: Record<string, any>
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, body, metadata } = options

  if (process.env.NODE_ENV !== "production") {
    console.log("SENDING EMAIL:")
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Body: ${body}`)
    console.log(`Metadata:`, metadata)
    return true
  }

  try {
    const testAccount = await nodemailer.createTestAccount()

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.ethereal.email",
      port: Number.parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER || testAccount.user,
        pass: process.env.EMAIL_PASSWORD || testAccount.pass,
      },
    } as SMTPTransport.Options) // ✅ Correct type usage

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"VolU" <noreply@volu.org>',
      to,
      subject,
      text: body,
      html: `<div>${body.replace(/\n/g, "<br>")}</div>`,
    })

    console.log(`Email sent: ${info.messageId}`)

    if (testAccount.user === (transporter.options as SMTPTransport.Options).auth?.user) {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`)
    }

    return true
  } catch (error) {
    console.error("Error sending email:", error)
    return false
  }
}
