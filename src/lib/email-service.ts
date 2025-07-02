import { getResendClient } from './resend';
import { module1AccessEmailTemplate } from './email-templates/module1-access';
import { 
  spreadsheetSequenceEmail1, 
  spreadsheetSequenceEmail2, 
  spreadsheetSequenceEmail3 
} from './email-templates/spreadsheet-sequence';

interface SendModule1AccessOptions {
  email: string;
  siteUrl?: string;
  fromEmail?: string;
  fromName?: string;
}

const defaultSiteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.expensesorted.com/';
const defaultFromEmail = process.env.FROM_EMAIL || 'hi@expensesorted.com';
const defaultFromName = 'Florian - 15-Minute Money System';

// Export verified sender constants for reuse in API routes
export const VERIFIED_FROM_EMAIL = defaultFromEmail;
export const VERIFIED_FROM_NAME = defaultFromName;

export async function sendModule1Access({
  email,
  siteUrl = process.env.NEXT_PUBLIC_APP_URL || defaultSiteUrl,
  fromEmail = process.env.FROM_EMAIL || defaultFromEmail,
  fromName = process.env.FROM_NAME || defaultFromName
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

interface SendSpreadsheetSequenceEmailOptions {
  email: string;
  emailNumber: 1 | 2 | 3;
  siteUrl?: string;
  fromEmail?: string;
  fromName?: string;
}

export async function sendSpreadsheetSequenceEmail({
  email,
  emailNumber,
  siteUrl = process.env.NEXT_PUBLIC_APP_URL || defaultSiteUrl,
  fromEmail = process.env.FROM_EMAIL || defaultFromEmail,
  fromName = process.env.FROM_NAME || defaultFromName
}: SendSpreadsheetSequenceEmailOptions): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();
  
  if (!resend) {
    console.error('❌ Resend client not available - Spreadsheet sequence email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  // Select the appropriate email template
  let template;
  switch (emailNumber) {
    case 1:
      template = spreadsheetSequenceEmail1;
      break;
    case 2:
      template = spreadsheetSequenceEmail2;
      break;
    case 3:
      template = spreadsheetSequenceEmail3;
      break;
    default:
      return { success: false, error: 'Invalid email number' };
  }

  try {
    // Replace template variables
    const htmlContent = template.html
      .replace(/\{\{siteUrl\}\}/g, siteUrl);
    
    const textContent = template.text
      .replace(/\{\{siteUrl\}\}/g, siteUrl);

    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: template.subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'spreadsheet-sequence' },
        { name: 'sequence-email', value: `email-${emailNumber}` }
      ]
    });

    console.log(`✅ Spreadsheet sequence email ${emailNumber} sent successfully:`, { email, id: result.data?.id });
    return { success: true };

  } catch (error) {
    console.error(`❌ Failed to send spreadsheet sequence email ${emailNumber}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Helper function to check if a subscriber should receive spreadsheet sequence
export function shouldReceiveSpreadsheetSequence(source: string, tags: string[]): boolean {
  return source === 'SPREADSHEET' || 
         source === 'SPREADSHEET_POPUP' || 
         tags.includes('spreadsheet-user') || 
         tags.includes('spreadsheet-user-popup');
} 