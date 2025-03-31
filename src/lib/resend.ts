import { Resend } from 'resend';

let resendInstance: Resend | null = null;

export function getResendClient(): Resend | null {
  if (resendInstance) return resendInstance;
  
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ Resend API key is missing! Set the RESEND_API_KEY environment variable to enable email functionality.');
    return null;
  }
  
  try {
    resendInstance = new Resend(apiKey);
    console.log('✅ Resend client initialized successfully');
    return resendInstance;
  } catch (error) {
    console.error('❌ Failed to initialize Resend client:', error);
    return null;
  }
} 