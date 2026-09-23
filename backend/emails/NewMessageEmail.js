const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;")

const NewMessageEmail = ({ recipientName, senderName, messagePreview, messageUrl }) => {
  const safeRecipientName = escapeHtml(recipientName || "there")
  const safeSenderName = escapeHtml(senderName || "Someone")
  const safePreview = escapeHtml(messagePreview || "")
  const safeMessageUrl = escapeHtml(messageUrl || "#")

  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>New message on DevHeaven</title></head>
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:Inter,Arial,Helvetica,sans-serif;color:#172033;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safeSenderName} sent you a new message on DevHeaven.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;"><tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border:1px solid #e6eaf0;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:28px 32px;background:#111827;"><div style="font-size:24px;font-weight:800;color:#fff;">Dev<span style="color:#8b5cf6;">Heaven</span></div><div style="margin-top:8px;font-size:13px;color:#cbd5e1;">Professional connections. Real opportunities.</div></td></tr>
        <tr><td style="padding:36px 32px 24px;"><div style="display:inline-block;padding:7px 11px;border-radius:999px;background:#f3e8ff;color:#7c3aed;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;">New message</div><h1 style="margin:18px 0 10px;font-size:28px;line-height:1.2;color:#111827;">You have a new message</h1><p style="margin:0;color:#526071;font-size:16px;line-height:1.6;">Hi ${safeRecipientName}, <strong style="color:#111827;">${safeSenderName}</strong> sent you a message on DevHeaven.</p></td></tr>
        <tr><td style="padding:0 32px 28px;"><div style="padding:20px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;"><div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;">Message preview</div><div style="font-size:15px;line-height:1.65;color:#334155;">${safePreview}</div></div></td></tr>
        <tr><td align="center" style="padding:0 32px 36px;"><a href="${safeMessageUrl}" style="display:inline-block;padding:13px 22px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:9px;font-size:15px;font-weight:700;">Open message</a></td></tr>
        <tr><td style="padding:22px 32px;border-top:1px solid #eef0f4;background:#fafbfc;"><p style="margin:0;font-size:12px;line-height:1.6;color:#7b8798;">You are receiving this email because message notifications are enabled for your DevHeaven account.</p></td></tr>
      </table>
      <div style="max-width:620px;padding:18px 10px;font-size:11px;line-height:1.5;color:#94a3b8;text-align:center;">© ${new Date().getFullYear()} DevHeaven. Automated notification.</div>
    </td></tr></table>
  </body>
</html>`
}

module.exports = NewMessageEmail
