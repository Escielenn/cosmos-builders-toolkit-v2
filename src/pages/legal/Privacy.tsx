import LegalPageLayout from "@/components/layout/LegalPageLayout";
import { Shield } from "lucide-react";

const privacyContent = `
## Your Worlds Are Yours Alone

Your worldbuilding work is yours. Period. We don't access it, we don't train AI on it, and we don't share it with anyone. This policy explains how we handle the minimal data we do collect to run the service.

## What We Collect

### Account Information

- Email address (for login and essential service communications)
- Username and display preferences
- Payment information (processed securely through Stripe - we never see your full payment details)
- Billing address (for sales tax compliance)

### Usage Information

- Basic analytics on which features are used (to know what to build next)
- Error logs (to fix bugs)
- This data is aggregated and anonymous - we can't identify you from it

### Cookies

- Only essential cookies required for the service to function
- No advertising, analytics, or tracking cookies
- See "Cookies & Tracking" section below for details

## What We DON'T Collect or Access

### Your Creative Work

- We cannot access the content you create in StellarForge tools
- Your worlds, characters, species, planets, star systems - they're stored encrypted and only you can see them
- We never read, analyze, or review your worldbuilding materials
- We never use your content for any purpose whatsoever

### We Have Zero Access to Your Creative Content

This isn't just policy - it's how we built the system. Your worldbuilding data is encrypted and we don't have the keys. We literally cannot read your work, even if we wanted to.

## How We Use Information

The only things we do:

- Send you essential service emails (password resets, payment confirmations, subscription updates)
- Fix technical problems when things break
- Understand which features are popular based on anonymous usage patterns
- Process your subscription payments and collect required sales tax
- Comply with legal obligations (tax records, responses to valid legal orders)

**What we absolutely never do:**

- Access, read, or review your worldbuilding content
- Train AI models on your creative work
- Share your data with third parties (except as listed below for essential services)
- Use your content for any purpose without explicit permission
- Sell or monetize your information
- Send you marketing emails (unless you explicitly opt in)
- Provide your creative materials to AI training systems

## Third-Party Services

We use minimal third-party services to operate StellarForge. None of these services can access your creative content.

### Payment Processing

- Stripe (stripe.com) handles all payment information securely
- We never see your full credit card numbers
- Stripe is PCI-DSS compliant and GDPR-compliant
- Stripe Privacy Policy: [https://stripe.com/privacy](https://stripe.com/privacy)

### Email Services

- Resend (resend.com) delivers transactional emails (password resets, payment receipts)
- ImprovMX (improvmx.com) manages our email infrastructure at support@stellarforge.tools
- We only send essential service emails

### Hosting & Infrastructure

- Vercel (vercel.com) hosts the application with encryption
- Supabase (supabase.com) provides secure database and authentication
- All data is encrypted at rest and in transit

### What These Services Can Access

- Your email address (for account functions only)
- Payment information (Stripe only, fully encrypted)
- Authentication tokens (Supabase, encrypted)
- Basic account metadata

### What They CANNOT Access

- Your worldbuilding content
- Your creative work
- Your project details
- Any materials you create in StellarForge tools

All of these providers are GDPR-compliant and maintain high security standards. We chose them specifically for their commitment to privacy and security.

## Cookies & Tracking

### What Cookies We Use

StellarForge uses only essential cookies required for the service to function. We do not use advertising, analytics, or tracking cookies.

### Essential Cookies

- **Authentication (Supabase):** Keeps you logged in securely
- **Payment Processing (Stripe):** Processes your subscription securely
- **Session Management:** Remembers your preferences during your visit

### Third-Party Cookies

Our service providers may set their own essential cookies:

- **Stripe:** Payment processing and fraud prevention
- **Supabase:** Authentication and database access
- **Vercel:** Content delivery and performance

These cookies are necessary for the service to work. You can disable cookies in your browser, but this will prevent you from logging in.

### What We Don't Use

- Analytics cookies
- Advertising cookies
- Social media tracking pixels
- Third-party tracking scripts

### Do Not Track

We respect Do Not Track signals. Since we don't track you anyway, DNT is automatically honored.

## Your Rights

### Everyone Gets These Rights

- **Access:** Download all your account data at any time
- **Deletion:** Delete your account and all associated data permanently (see data retention below)
- **Portability:** Export your worldbuilding materials in standard JSON format from your dashboard
- **Privacy:** Your work stays completely private unless you choose to share it
- **Correction:** Update your account information anytime
- **Opt-Out:** Unsubscribe from any non-essential emails (we rarely send them)

### How to Exercise Your Rights

- Most rights can be exercised directly from your account dashboard
- For deletion or complex requests, email support@stellarforge.tools
- We respond within 5 business days

## Colorado Residents' Rights

If you're a Colorado resident, the Colorado Privacy Act (CPA) gives you additional rights:

### Your CPA Rights

- **Right to Know:** Confirm whether we're processing your personal data
- **Right to Access:** Get a copy of your personal data in a portable format
- **Right to Correction:** Correct inaccuracies in your personal data
- **Right to Deletion:** Delete your personal data (with certain exceptions)
- **Right to Opt-Out:** Opt out of:
  - Sale of personal data (we don't sell your data)
  - Targeted advertising (we don't do targeted advertising)
  - Certain profiling activities (we don't profile)

### How to Exercise Colorado Rights

- Email support@stellarforge.tools with "Colorado Privacy Request" in the subject
- We'll respond within 45 days
- No fee for requests made up to twice per year

### Appeals Process

If we deny your request, you can appeal by emailing support@stellarforge.tools with "CPA Appeal" in the subject. We'll respond within 45 days. If we deny your appeal, you may contact the Colorado Attorney General.

### Categories of Personal Data We Process

- Identifiers (email, username)
- Commercial information (subscription status, payment history)
- Internet activity (usage logs, error reports - anonymized)

### No Sale or Sharing

We do not sell your personal data. We do not share your personal data for cross-context behavioral advertising.

## European Users (GDPR)

If you're in the European Economic Area (EEA), UK, or Switzerland, you have additional rights under GDPR:

### Legal Basis for Processing

- **Contract Performance:** We process your data to provide the service you signed up for
- **Legitimate Interest:** We analyze anonymous usage patterns to improve features
- **Legal Obligation:** We retain billing records for tax compliance
- **Consent:** We'll ask for explicit consent for any non-essential communications

### Your GDPR Rights

- **Right to Access:** Get a copy of all your personal data
- **Right to Rectification:** Correct inaccurate information
- **Right to Erasure:** Delete your account and all data ("right to be forgotten")
- **Right to Restriction:** Limit how we process your data
- **Right to Portability:** Export your data in standard formats (available in your dashboard)
- **Right to Object:** Object to processing based on legitimate interest
- **Right to Withdraw Consent:** Cancel consent-based processing anytime
- **Right to Lodge a Complaint:** File a complaint with your supervisory authority

### International Data Transfers

Your data may be processed in the United States. We ensure adequate protection through:

- Standard Contractual Clauses with our service providers
- Encryption in transit and at rest
- Supabase and Vercel's GDPR compliance measures
- Stripe's GDPR-compliant payment processing

### EU Representative

For GDPR inquiries, contact support@stellarforge.tools

## Data Security

### How We Protect Your Data

- All content is encrypted at rest and in transit (TLS 1.3)
- Regular security audits and updates
- Account authentication protections through Supabase
- Automatic encrypted backups to prevent data loss
- Limited employee access (we can't access your creative content at all)
- Secure infrastructure through Vercel and Supabase

### In Case of a Breach

We will notify you within 72 hours if there's a data breach that affects your personal information, as required by law.

## Data Retention

### While Your Account is Active

- We retain your account information and worldbuilding content
- You can export your worlds anytime from your dashboard

### After Account Deletion

- Your creative content is deleted within 30 days
- Your account information is deleted within 30 days
- Billing records are retained for 7 years for tax compliance (anonymized where possible)
- Anonymized usage analytics may be retained indefinitely

### Inactive Accounts

We'll email you before deleting inactive accounts (no login for 24+ months). You'll have 60 days to respond before deletion.

## Children's Privacy (COPPA Compliance)

StellarForge.tools is intended for users 13 years of age or older. We do not knowingly collect personal information from children under 13.

**If you are under 13, you may not use this service.**

If we learn we've collected information from a child under 13, we'll delete it immediately. If you believe we have information from a child under 13, contact support@stellarforge.tools.

## Changes to This Policy

We'll notify you of any material changes via email at least 30 days in advance. The "Last Updated" date at the top will reflect the most recent changes.

Continued use after changes means acceptance. If you don't agree with changes, you can delete your account before they take effect.

**Policy Change History:** We maintain a changelog of privacy policy updates at [/changelog](/changelog)

## Contact & Questions

**Privacy Questions:**
Email: support@stellarforge.tools

**Data Protection Requests:**
Email: support@stellarforge.tools with "Privacy Request" in subject

**Colorado Privacy Rights:**
Email: support@stellarforge.tools with "Colorado Privacy Request" in subject

**GDPR Inquiries:**
Email: support@stellarforge.tools with "GDPR Request" in subject

We're real humans who care about your privacy. We aim to respond within 2 business days.
`;

const Privacy = () => {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="Your privacy matters. Here's how we protect your creative work."
      lastUpdated="February 2026"
      badgeIcon={<Shield className="w-3 h-3 mr-1" />}
      badgeText="Privacy"
      content={privacyContent}
    />
  );
};

export default Privacy;
