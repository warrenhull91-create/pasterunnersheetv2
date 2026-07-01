Paste Runner Netlify Version

Upload this whole folder to Netlify, not just index.html.

Before testing:
1. In Netlify, go to Site configuration > Environment variables.
2. Confirm RESEND_API_KEY exists and is marked as a secret.
3. Deploy this folder.
4. Open the site and tap Email Info > Send Test Email.

Current email recipient in netlify/functions/send-pdf.js:
- warren.hull.91@gmail.com

After the test works, edit send-pdf.js and add the second recipient in the to: array.
