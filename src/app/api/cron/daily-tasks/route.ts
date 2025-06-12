import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { monthlyReminders, users } from '@/db/schema';
import { eq, and, lte, or, isNull } from 'drizzle-orm';
import { Resend } from 'resend';
import { SubscriptionService } from '@/lib/subscriptionService';

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to get the first day of next month
function getFirstDayOfNextMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0); // 9 AM on 1st of next month
}

// Helper function to check if it's time to send monthly reminders
function isTimeToSendMonthlyReminders(): boolean {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const hour = now.getHours();
  
  // Send on 1st, 2nd, or 3rd of month (in case of weekends/holidays) between 8 AM and 11 AM
  return dayOfMonth <= 3 && hour >= 8 && hour <= 11;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const vercelCronHeader = request.headers.get('vercel-cron');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!vercelCronHeader && authHeader !== `Bearer ${cronSecret}`) {
    console.warn('Daily tasks cron: Unauthorized attempt.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Cron job: Daily tasks starting...');
  
  const results = {
    expiredSubscriptions: 0,
    monthlyReminders: {
      sent: 0,
      errors: 0,
      skipped: false
    }
  };

  try {
    // Task 1: Expire overdue subscriptions (runs daily)
    console.log('Running subscription expiration task...');
    const expiredCount = await SubscriptionService.expireOverdueSubscriptions();
    results.expiredSubscriptions = expiredCount;
    
    if (expiredCount > 0) {
      console.log(`Successfully expired ${expiredCount} subscriptions.`);
    } else {
      console.log('No overdue subscriptions found to process.');
    }

    // Task 2: Send monthly reminders (only during first 3 days of month)
    if (isTimeToSendMonthlyReminders()) {
      console.log('Running monthly reminders task...');
      const reminderResults = await sendMonthlyReminders();
      results.monthlyReminders = reminderResults;
    } else {
      console.log('Skipping monthly reminders - not time to send');
      results.monthlyReminders.skipped = true;
    }

    return NextResponse.json({ 
      success: true, 
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Daily tasks cron job failed:", error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error',
      results 
    }, { status: 500 });
  }
}

async function sendMonthlyReminders() {
  const now = new Date();
  
  // Find active reminders that haven't been sent this month yet
  const remindersToSend = await db
    .select({
      id: monthlyReminders.id,
      userId: monthlyReminders.userId,
      isActive: monthlyReminders.isActive,
      lastSent: monthlyReminders.lastSent,
      nextSend: monthlyReminders.nextSend,
      createdAt: monthlyReminders.createdAt,
      updatedAt: monthlyReminders.updatedAt,
      userEmail: users.email,
      userSpreadsheetId: users.spreadsheetId,
    })
    .from(monthlyReminders)
    .innerJoin(users, eq(monthlyReminders.userId, users.id))
    .where(
      and(
        eq(monthlyReminders.isActive, true),
        or(
          isNull(monthlyReminders.lastSent),
          lte(monthlyReminders.nextSend, now)
        )
      )
    );

  console.log(`Found ${remindersToSend.length} reminders to send`);

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const reminder of remindersToSend) {
    try {
      if (!reminder.userEmail) {
        console.error(`No email found for user ${reminder.userId}`);
        continue;
      }

      // Send email via Resend
      const result = await resend.emails.send({
        from: 'TxAI Finance Reminders <reminders@txai.tools>',
        to: [reminder.userEmail],
        subject: '💰 Time for your monthly finance review!',
        html: generateReminderEmailHTML({
          email: reminder.userEmail,
          spreadsheetId: reminder.userSpreadsheetId,
        }),
        text: generateReminderEmailText({
          email: reminder.userEmail,
          spreadsheetId: reminder.userSpreadsheetId,
        }),
      });

      if (result.error) {
        throw new Error(`Resend error: ${result.error.message}`);
      }

      // Update the reminder record
      const nextSend = getFirstDayOfNextMonth();
      await db
        .update(monthlyReminders)
        .set({
          lastSent: now,
          nextSend: nextSend,
          updatedAt: now,
        })
        .where(eq(monthlyReminders.id, reminder.id));

      successCount++;
      console.log(`✅ Sent reminder to ${reminder.userEmail}`);
    } catch (error: any) {
      errorCount++;
      const errorMessage = `Failed to send to ${reminder.userEmail}: ${error.message}`;
      errors.push(errorMessage);
      console.error(`❌ ${errorMessage}`);
    }
  }

  return {
    sent: successCount,
    errors: errorCount,
    skipped: false,
    errorDetails: errors.length > 0 ? errors : undefined,
    totalFound: remindersToSend.length
  };
}

function generateReminderEmailHTML(reminder: { email: string; spreadsheetId?: string | null }): string {
  const unsubscribeUrl = `${process.env.NEXTAUTH_URL}/personal-finance?tab=settings`;
  const dashboardUrl = `${process.env.NEXTAUTH_URL}/personal-finance`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Monthly Finance Review Reminder</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">💰 Monthly Finance Review</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">It's time to review and update your finances!</p>
      </div>

      <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #2563eb; margin-top: 0;">Ready to build wealth? 📈</h2>
        <p>Successful people review their finances regularly. Take 15 minutes today to:</p>
        <ul style="padding-left: 20px;">
          <li><strong>Upload your latest bank transactions</strong> - Get them categorized automatically</li>
          <li><strong>Review your spending patterns</strong> - See where your money really goes</li>
          <li><strong>Update your savings</strong> - Track your financial runway</li>
          <li><strong>Plan for next month</strong> - Make informed financial decisions</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
          🚀 Start Your Finance Review
        </a>
      </div>

      <div style="background: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin: 25px 0;">
        <h3 style="margin-top: 0; color: #1e40af;">💡 Pro Tips for This Month:</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Look for any subscription services you're not using</li>
          <li>Check if you're on track with your savings goals</li>
          <li>Review any large or unusual expenses</li>
          <li>Consider automating more of your savings</li>
        </ul>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
        <p>You're receiving this because you signed up for monthly finance reminders.</p>
        <p>
          <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> | 
          <a href="${dashboardUrl}" style="color: #6b7280; text-decoration: underline;">Manage Settings</a>
        </p>
        <p style="margin-top: 15px; font-size: 12px;">
          © ${new Date().getFullYear()} TxAI Tools. Helping you build better financial habits.
        </p>
      </div>
    </body>
    </html>
  `;
}

function generateReminderEmailText(reminder: { email: string; spreadsheetId?: string | null }): string {
  const unsubscribeUrl = `${process.env.NEXTAUTH_URL}/personal-finance?tab=settings`;
  const dashboardUrl = `${process.env.NEXTAUTH_URL}/personal-finance`;
  
  return `
💰 Monthly Finance Review

It's time to review and update your finances!

Ready to build wealth? 📈

Successful people review their finances regularly. Take 15 minutes today to:

• Upload your latest bank transactions - Get them categorized automatically
• Review your spending patterns - See where your money really goes
• Update your savings - Track your financial runway
• Plan for next month - Make informed financial decisions

Start Your Finance Review: ${dashboardUrl}

💡 Pro Tips for This Month:
• Look for any subscription services you're not using
• Check if you're on track with your savings goals
• Review any large or unusual expenses
• Consider automating more of your savings

---

You're receiving this because you signed up for monthly finance reminders.

Unsubscribe: ${unsubscribeUrl}
Manage Settings: ${dashboardUrl}

© ${new Date().getFullYear()} TxAI Tools. Helping you build better financial habits.
  `;
} 