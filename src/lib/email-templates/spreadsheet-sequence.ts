export const spreadsheetSequenceEmail1 = {
  subject: "Your Financial Freedom Spreadsheet is ready!",
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Financial Freedom Spreadsheet</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background: #ffffff; margin: 0; padding: 0;">
  
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;padding:20px;">
    <tr>
      <td style="text-align:center;">
        <h1 style="font-size:32px;font-weight:bold;margin:0 0 20px 0;color:#000;line-height:1.2;">
          How Much <span style="color:#4361ee;">Time</span> Can Your Money Buy?
        </h1>
        <p style="font-size:18px;color:#555;max-width:500px;margin:0 auto 30px;">
          Financial freedom isn't about being rich. It's about having enough saved to buy yourself <strong>time</strong> — time to quit a bad job, start a business, travel, or just breathe.
        </p>

        <!-- Thumbnail link to 3-min demo video -->
        <a href="https://www.youtube.com/watch?v=uJuzfxJsAwQ" target="_blank" style="display:inline-block;margin-bottom:30px;text-decoration:none;">
          <img src="https://img.youtube.com/vi/uJuzfxJsAwQ/hqdefault.jpg" alt="3-Minute Demo" width="560" style="max-width:100%;border-radius:12px;border:0;" />
        </a>

        <!-- CTA button -->
        <a href="{{siteUrl}}/personal-finance" target="_blank" style="display:inline-block;padding:15px 30px;border-radius:8px;background:#4361ee;color:#ffffff;font-weight:bold;text-decoration:none;font-size:16px;">
          Try It Yourself – Setup in 3 Minutes →
        </a>

        <p style="font-size:12px;color:#888;margin-top:15px;">No credit card required • Your data stays in your Google Drive</p>
      </td>
    </tr>
  </table>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto 10px auto;padding:0 20px;">
    <tr>
      <td style="font-size:12px;color:#999;text-align:center;">
        You're receiving this because you downloaded the Financial Freedom Spreadsheet at {{siteUrl}}
      </td>
    </tr>
  </table>

</body>
</html>
  `,
  text: `
How Much TIME Can Your Money Buy?

Financial freedom isn't about being rich. It's about having enough saved to buy yourself time — time to quit a bad job, start a business, travel, or just breathe.

Watch the 3-minute demo:
https://www.youtube.com/watch?v=uJuzfxJsAwQ

Try it yourself – setup in 3 minutes:
{{siteUrl}}/personal-finance

No credit card required. Your data stays in your Google Drive.

You're receiving this because you downloaded the Financial Freedom Spreadsheet at {{siteUrl}}
  `
};

export const spreadsheetSequenceEmail2 = {
  subject: "15 Minutes a Month: Total Control of Your Money",
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>15-Minute Monthly Review</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#333;background:#ffffff;margin:0;padding:0;">

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;padding:20px;">
    <tr>
      <td style="text-align:center;">
        <h1 style="font-size:28px;font-weight:700;margin:0 0 20px 0;color:#4361ee;">15 Minutes • Once a Month</h1>
        <p style="font-size:18px;color:#555;margin:0 0 25px;">That's all it takes to know <strong>exactly</strong> where your money goes.</p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8f9fa;border-radius:12px;padding:25px;text-align:left;">
          <tr><td style="font-size:16px;color:#333;">
            <ol style="padding-left:20px;margin:0;">
              <li style="margin-bottom:12px;">
                <strong>Download last month's bank transactions</strong>.
              </li>
              <li style="margin-bottom:12px;">
                <strong>Paste into the Spreadsheet.</strong> Add categories manually.
              </li>
              <li style="margin-bottom:12px;">
                <strong>Compare to previous months.</strong> Spot leaks &amp; wins instantly.
              </li>
            </ol>
          </td></tr>
        </table>

        <p style="font-size:16px;color:#555;margin:0 0 25px;">Once a <strong>quarter</strong> I take 30 minutes to log my investments &amp; cash. That snapshot tells me my <strong>emergency-fund runway</strong>—how many months of freedom I've bought.</p>

        <a href="{{siteUrl}}/personal-finance" target="_blank" style="display:inline-block;padding:15px 30px;border-radius:8px;background:#4361ee;color:#ffffff;font-weight:bold;text-decoration:none;font-size:16px;">Open Your Spreadsheet →</a>

        <p style="font-size:12px;color:#888;margin-top:20px;">Need help? Just hit reply— I read every message.</p>
      </td>
    </tr>
  </table>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto 10px auto;padding:0 20px;">
    <tr>
      <td style="font-size:12px;color:#999;text-align:center;">You're getting this because you downloaded the Financial Freedom Spreadsheet at {{siteUrl}}</td>
    </tr>
  </table>

</body>
</html>
  `,
  text: `
15 Minutes • Once a Month

That's all it takes to know exactly where your money goes.

1. Download last month's bank transactions.
2. Paste into the Spreadsheet – categories fill in automatically.
3. Compare to previous months and spot leaks.

Quarterly (30 min) I log my investments & cash. That snapshot tells me my emergency-fund runway—how many months of freedom I've bought.

Open your spreadsheet:
{{siteUrl}}/personal-finance

Need help? Just reply—I read every message.

You're receiving this because you downloaded the Financial Freedom Spreadsheet at {{siteUrl}}
  `
};

export const spreadsheetSequenceEmail3 = {
  subject: "Automate Your 15-Minute Review with Expense Sorted",
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Automate Your Review</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#333;background:#ffffff;margin:0;padding:0;">

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;padding:20px;">
    <tr>
      <td style="text-align:center;">
        <h1 style="font-size:28px;font-weight:700;margin:0 0 20px 0;color:#4361ee;">What If Your 15-Minute Review Only Took 2?</h1>
        <p style="font-size:18px;color:#555;margin:0 0 25px;">Expense&nbsp;Sorted simplifies bank imports, categorises every transaction, and updates your spreadsheet—while you make coffee.</p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8f9fa;border-radius:12px;padding:25px;text-align:left;">
          <tr><td style="font-size:16px;color:#333;">
            <ul style="padding-left:20px;margin:0;list-style-type:disc;">
              <li style="margin-bottom:12px;"><strong>Easy as Bank imports</strong> – maps csv to your sheet, no manual work.</li>
              <li style="margin-bottom:12px;"><strong>Smart Categorisation</strong> – learns from your edits, gets smarter every month.</li>
              <li style="margin-bottom:12px;"><strong>Automatic Spreadsheet Update</strong> – data flows straight into the same Google Sheet you're using now.</li>
              <li style="margin-bottom:12px;"><strong>Instant Insights</strong> – charts & runway calculate themselves. No more manual calculations. No more manual categorisation.</li>
            </ul>
          </td></tr>
        </table>

        <p style="font-size:16px;color:#555;margin:25px 0 25px;">Result: you still get the clarity of a manual review—but the boring parts happen while you sip ☕️.</p>

        <a href="{{siteUrl}}/personal-finance" target="_blank" style="display:inline-block;padding:15px 30px;border-radius:8px;background:#4361ee;color:#ffffff;font-weight:bold;text-decoration:none;font-size:16px;">Try Expense Sorted Free →</a>

        <p style="font-size:12px;color:#888;margin-top:20px;">Takes 3 minutes to connect.</p>
      </td>
    </tr>
  </table>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto 10px auto;padding:0 20px;">
    <tr>
      <td style="font-size:12px;color:#999;text-align:center;">You're receiving this because you downloaded the Financial Freedom Spreadsheet at {{siteUrl}}</td>
    </tr>
  </table>

</body>
</html>
  `,
  text: `
What if your 15-minute money review only took 2?

Expense Sorted simplifies bank imports, categorises every transaction, and updates your sheet while you make coffee.

• Easy as bank imports – maps csv to your sheet, no manual work.
• Smart categorisation – learns from your edits, gets smarter every month.
• Spreadsheet updated automatically
• Charts & runway calculate themselves

Try it free (3-minute setup):
{{siteUrl}}/personal-finance

You're receiving this because you downloaded the Financial Freedom Spreadsheet at {{siteUrl}}
  `
}; 