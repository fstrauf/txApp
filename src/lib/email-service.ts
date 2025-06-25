import { getResendClient } from './resend';
import { module1AccessEmailTemplate } from './email-templates/module1-access';

interface SendModule1AccessOptions {
  email: string;
  siteUrl?: string;
  fromEmail?: string;
  fromName?: string;
}

export async function sendModule1Access({
  email,
  siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com',
  fromEmail = process.env.FROM_EMAIL || 'noreply@expensesorted.com',
  fromName = 'Florian - 15-Minute Money System'
}: SendModule1AccessOptions): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();
  
  if (!resend) {
    console.error('❌ Resend client not available - Module 1 access email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    // Replace template variables
    const htmlContent = module1AccessEmailTemplate.html
      .replace(/\{\{siteUrl\}\}/g, siteUrl);
    
    const textContent = module1AccessEmailTemplate.text
      .replace(/\{\{siteUrl\}\}/g, siteUrl);

    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: module1AccessEmailTemplate.subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'course-access' },
        { name: 'module', value: 'module-1' }
      ]
    });

    console.log('✅ Module 1 access email sent successfully:', { email, id: result.data?.id });
    return { success: true };

  } catch (error) {
    console.error('❌ Failed to send Module 1 access email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Helper function to check if a subscriber should receive Module 1 access
export function shouldSendModule1Access(tags: string[]): boolean {
  return tags.includes('module-1-request') || tags.includes('course-interest');
} 