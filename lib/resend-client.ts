import { Resend } from 'resend';

// Use a dummy key if env var is missing during build time
const apiKey = process.env.RESEND_API_KEY || 're_dummy_key';
export const resend = new Resend(apiKey);

// For operations that require read access (like checking domain status),
// we allow a separate audit key if the main key is restricted to sending only.
const auditApiKey = process.env.RESEND_AUDIT_API_KEY || apiKey;
const resendAudit = new Resend(auditApiKey);

export async function isDomainVerified(domain: string): Promise<boolean> {
  try {
    const { data, error } = await resendAudit.domains.list();
    
    if (error || !data) {
      console.error('Error checking domains (Guard Failing Closed):', error);
      return false;
    }

    const domainInfo = data.data.find((d: any) => d.name === domain);
    return domainInfo ? domainInfo.status === 'verified' : false;
  } catch (err) {
    console.error('Exception checking domains (Guard Failing Closed):', err);
    return false;
  }
}
