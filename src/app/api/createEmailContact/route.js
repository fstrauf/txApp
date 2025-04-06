import { NextResponse } from "next/server";
import { Resend } from 'resend';
import { db } from '@/db';
import { subscribers } from '@/db/schema';
import { createId } from '@/db/utils';

export async function POST(req) {
  try {
    const data = await req.json();
    const email = data.email;
    const tags = data.tags || []; // Get tags if provided
    const source = data.source || "OTHER"; // Get source if provided

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Create a new subscriber in the database or handle if subscriber already exists
    try {
      // First, try to store the email in our database
      await db.insert(subscribers).values({
        id: createId(),
        email,
        source,
        tags: tags,
        isActive: true,
      });
    } catch (dbError) {
      // If it's a unique constraint error (email already exists), we'll just continue
      // Otherwise, we'll throw the error
      if (!dbError.message.includes('unique constraint')) {
        throw dbError;
      }
    }

    // Initialize Resend client
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Add the subscriber to Resend
    try {
      await resend.contacts.create({
        email,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        unsubscribed: false
      });
    } catch (resendError) {
      // If the contact already exists in Resend, we can just continue
      // Other errors should be logged but shouldn't necessarily fail the request
      console.error("Resend API error:", resendError);
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
