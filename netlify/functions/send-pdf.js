exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing in Netlify environment variables");
    }

    const body = JSON.parse(event.body || "{}");
    const { pdfBase64, filename, isTest, report = {} } = body;

    if (!pdfBase64) {
      throw new Error("No PDF was received by the email function");
    }

    const subject = isTest
      ? "TEST - Paste Runner Shift Sheet"
      : `Paste Runner Shift Sheet - ${report.shift_date || "Unknown Date"} ${report.shift_type || ""}`;

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
        <h2>Paste Runner Shift Sheet</h2>
        <p>${isTest ? "This is a test email from the Paste Runner app." : "A new paste runner shift sheet has been submitted."}</p>
        <p><strong>Date:</strong> ${report.shift_date || "—"}</p>
        <p><strong>Shift:</strong> ${report.shift_type || "—"}</p>
        <p><strong>Operator:</strong> ${report.operator || "—"}</p>
        <p><strong>Comments:</strong><br>${String(report.comments || "None").replace(/\n/g, "<br>")}</p>
        <p>The PDF copy is attached.</p>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Paste Runner <onboarding@resend.dev>",
        to: ["warren.hull.91@gmail.com"],
        subject,
        html,
        attachments: [
          {
            filename: filename || "paste-runner-shift-sheet.pdf",
            content: pdfBase64
          }
        ]
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: data.message || "Resend email failed",
          details: data
        })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, id: data.id })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message })
    };
  }
};
