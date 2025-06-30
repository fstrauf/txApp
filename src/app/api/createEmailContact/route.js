import { NextResponse } from "next/server";
import { Resend } from 'resend';
import { db } from '@/db';
import { subscribers } from '@/db/schema';
import { createId } from '@/db/utils';
import { eq } from 'drizzle-orm'; // Import eq for querying
import { sendModule1Access, shouldSendModule1Access } from '@/lib/email-service';

export async function POST(req) {
  try {
    const data = await req.json();
    const email = data.email;
    const newTags = data.tags || []; // Get tags if provided, default to empty array
    const source = data.source || "OTHER"; // Get source if provided

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if subscriber already exists
    const existingSubscriber = await db.select({
        id: subscribers.id,
        currentTags: subscribers.tags,
        isActive: subscribers.isActive
      })
      .from(subscribers)
      .where(eq(subscribers.email, email))
      .limit(1);

    if (existingSubscriber.length > 0) {
      // Subscriber exists, update tags and potentially reactivate
      const currentUser = existingSubscriber[0];
      const currentTags = currentUser.currentTags || [];
      const combinedTags = Array.from(new Set([...currentTags, ...newTags])); // Merge and deduplicate

      console.log(`[createEmailContact] Updating existing subscriber: ${email}, New tags: ${JSON.stringify(combinedTags)}`);

      await db.update(subscribers)
        .set({
          tags: combinedTags,
          source: source, // Optionally update source?
          isActive: true, // Reactivate if they were inactive
          updatedAt: new Date(),
        })
        .where(eq(subscribers.id, currentUser.id));
        
    } else {
      // Subscriber does not exist, create new one
      console.log(`[createEmailContact] Creating new subscriber: ${email}, Tags: ${JSON.stringify(newTags)}`);
      await db.insert(subscribers).values({
        id: createId(),
        email,
        source,
        tags: newTags, // Use the passed tags
        isActive: true,
        createdAt: new Date(), // Set createdAt explicitly
        updatedAt: new Date(), // Set updatedAt explicitly
      });
    }

    // Initialize Resend client
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Add the subscriber to Resend
    try {
      await resend.contacts.create({
        email,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        unsubscribed: false,
        audienceId: process.env.RESEND_AUDIENCE_ID,
      });
    } catch (resendError) {
      // If the contact already exists in Resend, we can just continue
      // Other errors should be logged but shouldn't necessarily fail the request
      console.error("Resend API error:", resendError);
    }

    // Check if we should send Module 1 access email
    if (shouldSendModule1Access(newTags)) {
      console.log(`[createEmailContact] Sending Module 1 access email to: ${email}`);
      
      // Send Module 1 access email (don't await to avoid blocking the response)
      sendModule1Access({ email }).catch(error => {
        console.error('Failed to send Module 1 access email:', error);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed!",
    });
  } catch (error) {
    console.error("Error in email subscription:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
