const { Resend } = require("resend")
const NewMessageEmail = require("../emails/NewMessageEmail")

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

const sendNewMessageEmail = async ({ to, recipientName, senderName, messagePreview, messageUrl }) => {
  const resend = getResendClient()
  const from = String(process.env.RESEND_FROM_EMAIL || "").trim()

  if (!resend || !from || !to) {
    console.warn("New message email skipped: Resend is not fully configured.")
    return { skipped: true }
  }

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: `${senderName || "Someone"} sent you a message on DevHeaven`,
    html: NewMessageEmail({ recipientName, senderName, messagePreview, messageUrl }),
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

  if (error) throw error
  return data
}

module.exports = { sendNewMessageEmail }
