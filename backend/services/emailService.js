const NewMessageEmail = require("../emails/NewMessageEmail")

let resendClient

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) return null
  if (resendClient) return resendClient

  try {
    // Resend is optional. If the package is unavailable, email simply stays disabled.
    const { Resend } = require("resend")
    resendClient = new Resend(process.env.RESEND_API_KEY)
    return resendClient
  } catch (error) {
    console.warn("Resend is unavailable; email notifications are disabled.")
    return null
  }
}

const sendNewMessageEmail = async ({
  to,
  recipientName,
  senderName,
  messagePreview,
  messageUrl,
}) => {
  const from = String(process.env.RESEND_FROM_EMAIL || "").trim()
  const resend = getResendClient()

  // Email is an optional enhancement. Never make message delivery depend on it.
  if (!resend || !from || !to) {
    const reason = !resend
      ? "RESEND_API_KEY is missing or Resend is unavailable"
      : !from
        ? "RESEND_FROM_EMAIL is not configured"
        : "recipient email is missing"

    console.info(`Offline message email skipped: ${reason}.`)
    return { skipped: true, reason }
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: `${senderName || "Someone"} sent you a message on DevHeaven`,
      html: NewMessageEmail({
        recipientName,
        senderName,
        messagePreview,
        messageUrl,
      }),
      text: [
        `Hi ${recipientName || "there"},`,
        "",
        `${senderName || "Someone"} sent you a new message on DevHeaven.`,
        "",
        messagePreview || "Open DevHeaven to view the message.",
        "",
        `Open message: ${messageUrl}`,
      ].join("\n"),
    })

    if (error) {
      console.error("Resend email delivery failed:", error)
      return { skipped: true, error }
    }

    console.info(`Offline message email sent to ${to}.`)
    return data
  } catch (error) {
    // Provider/network errors must never propagate into the message request.
    console.error("Resend email delivery failed:", error)
    return { skipped: true, error }
  }
}

module.exports = { sendNewMessageEmail }
