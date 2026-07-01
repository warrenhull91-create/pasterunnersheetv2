exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is missing in Netlify environment variables");

    const body = JSON.parse(event.body || "{}");
    const { pdfBase64, filename, isTest, report = {} } = body;
    if (!pdfBase64) throw new Error("No PDF was received by the email function");

    const subject = isTest ? "TEST - Paste Runner Shift Sheet" : `Paste Runner Shift Sheet - ${report.shift_date || "Unknown Date"} ${report.shift_type || ""}`;

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
        <h2>Paste Runner Shift Sheet</h2>
        <p>${isTest ? "This is a test email from the Paste Runner app." : "A new paste runner shift sheet has been submitted."}</p>
        <table style="border-collapse:collapse;width:100%;max-width:620px">
          <tr><td style="padding:6px;border:1px solid #ddd"><strong>Date</strong></td><td style="padding:6px;border:1px solid #ddd">${report.shift_date || "—"}</td></tr>
          <tr><td style="padding:6px;border:1px solid #ddd"><strong>Shift</strong></td><td style="padding:6px;border:1px solid #ddd">${report.shift_type || "—"}</td></tr>
          <tr><td style="padding:6px;border:1px solid #ddd"><strong>Operator</strong></td><td style="padding:6px;border:1px solid #ddd">${report.operator || "—"}</td></tr>
          <tr><td style="padding:6px;border:1px solid #ddd"><strong>Shift Boss</strong></td><td style="padding:6px;border:1px solid #ddd">${report.shift_boss || "—"}</td></tr>
          <tr><td style="padding:6px;border:1px solid #ddd"><strong>Plant Operator</strong></td><td style="padding:6px;border:1px solid #ddd">${report.plant_operator || "—"}</td></tr>
          <tr><td style="padding:6px;border:1px solid #ddd"><strong>Stope 1</strong></td><td style="padding:6px;border:1px solid #ddd">${report.stope_1 || "—"}</td></tr>
          <tr><td style="padding:6px;border:1px solid #ddd"><strong>Pour Time</strong></td><td style="padding:6px;border:1px solid #ddd">${report.started_pouring || "—"} – ${report.finished_pouring || "—"}</td></tr>
        </table>
        <p><strong>Comments:</strong><br>${String(report.comments || "None").replace(/
/g, "<br>")}</p>
        <p>The PDF copy is attached.</p>
      </div>`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Paste Runner <onboarding@resend.dev>",
        to: ["warren.hull.91@gmail.com"],
        subject,
        html,
        attachments: [{ filename: filename || "paste-runner-shift-sheet.pdf", content: pdfBase64 }]
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { statusCode: response.status, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: data.message || "Resend email failed", details: data }) };
    }

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ success: true, id: data.id }) };
  } catch (error) {
    return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: error.message }) };
  }
};
