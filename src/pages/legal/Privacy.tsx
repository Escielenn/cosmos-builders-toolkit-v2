import LegalPageLayout from "@/components/layout/LegalPageLayout";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="Your privacy matters. Here's how we protect your creative work."
      lastUpdated="February 2026"
      badgeIcon={<Shield className="w-3 h-3 mr-1" />}
      badgeText="Privacy"
    >
      <section>
        <h2>Your Worlds Are Yours Alone</h2>
        <p>
          Your worldbuilding work is yours. Period. We don't access it, we don't train AI on it,
          and we don't share it with anyone. This policy explains how we handle the minimal data
          we do collect to run the service.
        </p>
      </section>

      <section>
        <h2>What We Collect</h2>

        <h3>Account Information</h3>
        <ul>
          <li>Email address (for login and essential service communications)</li>
          <li>Username and display preferences</li>
          <li>Payment information (processed securely through Stripe - we never see your full payment details)</li>
          <li>Billing address (for sales tax compliance)</li>
        </ul>

        <h3>Usage Information</h3>
        <ul>
          <li>Basic analytics on which features are used (to know what to build next)</li>
          <li>Error logs (to fix bugs)</li>
          <li>This data is aggregated and anonymous - we can't identify you from it</li>
        </ul>

        <h3>Cookies</h3>
        <ul>
          <li>Only essential cookies required for the service to function</li>
          <li>No advertising, analytics, or tracking cookies</li>
          <li>See "Cookies & Tracking" section below for details</li>
        </ul>
      </section>

      <section>
        <h2>What We DON'T Collect or Access</h2>

        <h3>Your Creative Work</h3>
        <ul>
          <li>We cannot access the content you create in StellarForge tools</li>
          <li>Your worlds, characters, species, planets, star systems - they're stored encrypted and only you can see them</li>
          <li>We never read, analyze, or review your worldbuilding materials</li>
          <li>We never use your content for any purpose whatsoever</li>
        </ul>

        <h3>We Have Zero Access to Your Creative Content</h3>
        <p>
          This isn't just policy - it's how we built the system. Your worldbuilding data is encrypted
          and we don't have the keys. We literally cannot read your work, even if we wanted to.
        </p>
      </section>

      <section>
        <h2>How We Use Information</h2>
        <p>The only things we do:</p>
        <ul>
          <li>Send you essential service emails (password resets, payment confirmations, subscription updates)</li>
          <li>Fix technical problems when things break</li>
          <li>Understand which features are popular based on anonymous usage patterns</li>
          <li>Process your subscription payments and collect required sales tax</li>
          <li>Comply with legal obligations (tax records, responses to valid legal orders)</li>
        </ul>

        <p><strong>What we absolutely never do:</strong></p>
        <ul>
          <li>Access, read, or review your worldbuilding content</li>
          <li>Train AI models on your creative work</li>
          <li>Share your data with third parties (except as listed below for essential services)</li>
          <li>Use your content for any purpose without explicit permission</li>
          <li>Sell or monetize your information</li>
          <li>Send you marketing emails (unless you explicitly opt in)</li>
          <li>Provide your creative materials to AI training systems</li>
        </ul>
      </section>

      <section>
        <h2>Third-Party Services</h2>
        <p>
          We use minimal third-party services to operate StellarForge. None of these services
          can access your creative content.
        </p>

        <h3>Payment Processing</h3>
        <ul>
          <li>Stripe (stripe.com) handles all payment information securely</li>
          <li>We never see your full credit card numbers</li>
          <li>Stripe is PCI-DSS compliant and GDPR-compliant</li>
          <li>Stripe Privacy Policy: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">https://stripe.com/privacy</a></li>
        </ul>

        <h3>Email Services</h3>
        <ul>
          <li>Resend (resend.com) delivers transactional emails (password resets, payment receipts)</li>
          <li>ImprovMX (improvmx.com) manages our email infrastructure at support@stellarforge.tools</li>
          <li>We only send essential service emails</li>
        </ul>

        <h3>Hosting & Infrastructure</h3>
        <ul>
          <li>Vercel (vercel.com) hosts the application with encryption</li>
          <li>Supabase (supabase.com) provides secure database and authentication</li>
          <li>All data is encrypted at rest and in transit</li>
        </ul>

        <h3>What These Services Can Access</h3>
        <ul>
          <li>Your email address (for account functions only)</li>
          <li>Payment information (Stripe only, fully encrypted)</li>
          <li>Authentication tokens (Supabase, encrypted)</li>
          <li>Basic account metadata</li>
        </ul>

        <h3>What They CANNOT Access</h3>
        <ul>
          <li>Your worldbuilding content</li>
          <li>Your creative work</li>
          <li>Your project details</li>
          <li>Any materials you create in StellarForge tools</li>
        </ul>

        <p>
          All of these providers are GDPR-compliant and maintain high security standards.
          We chose them specifically for their commitment to privacy and security.
        </p>
      </section>

      <section>
        <h2>Cookies & Tracking</h2>

        <h3>What Cookies We Use</h3>
        <p>
          StellarForge uses only essential cookies required for the service to function.
          We do not use advertising, analytics, or tracking cookies.
        </p>

        <h3>Essential Cookies</h3>
        <ul>
          <li><strong>Authentication (Supabase):</strong> Keeps you logged in securely</li>
          <li><strong>Payment Processing (Stripe):</strong> Processes your subscription securely</li>
          <li><strong>Session Management:</strong> Remembers your preferences during your visit</li>
        </ul>

        <h3>Third-Party Cookies</h3>
        <p>Our service providers may set their own essential cookies:</p>
        <ul>
          <li><strong>Stripe:</strong> Payment processing and fraud prevention</li>
          <li><strong>Supabase:</strong> Authentication and database access</li>
          <li><strong>Vercel:</strong> Content delivery and performance</li>
        </ul>
        <p>
          These cookies are necessary for the service to work. You can disable cookies in your browser,
          but this will prevent you from logging in.
        </p>

        <h3>What We Don't Use</h3>
        <ul>
          <li>Analytics cookies</li>
          <li>Advertising cookies</li>
          <li>Social media tracking pixels</li>
          <li>Third-party tracking scripts</li>
        </ul>

        <h3>Do Not Track</h3>
        <p>
          We respect Do Not Track signals. Since we don't track you anyway, DNT is automatically honored.
        </p>
      </section>

      <section>
        <h2>Your Rights</h2>

        <h3>Everyone Gets These Rights</h3>
        <ul>
          <li><strong>Access:</strong> Download all your account data at any time</li>
          <li><strong>Deletion:</strong> Delete your account and all associated data permanently (see data retention below)</li>
          <li><strong>Portability:</strong> Export your worldbuilding materials in standard JSON format from your dashboard</li>
          <li><strong>Privacy:</strong> Your work stays completely private unless you choose to share it</li>
          <li><strong>Correction:</strong> Update your account information anytime</li>
          <li><strong>Opt-Out:</strong> Unsubscribe from any non-essential emails (we rarely send them)</li>
        </ul>

        <h3>How to Exercise Your Rights</h3>
        <ul>
          <li>Most rights can be exercised directly from your account dashboard</li>
          <li>For deletion or complex requests, email support@stellarforge.tools</li>
          <li>We respond within 5 business days</li>
        </ul>
      </section>

      <section>
        <h2>Colorado Residents' Rights</h2>
        <p>
          If you're a Colorado resident, the Colorado Privacy Act (CPA) gives you additional rights:
        </p>

        <h3>Your CPA Rights</h3>
        <ul>
          <li><strong>Right to Know:</strong> Confirm whether we're processing your personal data</li>
          <li><strong>Right to Access:</strong> Get a copy of your personal data in a portable format</li>
          <li><strong>Right to Correction:</strong> Correct inaccuracies in your personal data</li>
          <li><strong>Right to Deletion:</strong> Delete your personal data (with certain exceptions)</li>
          <li><strong>Right to Opt-Out:</strong> Opt out of:
            <ul>
              <li>Sale of personal data (we don't sell your data)</li>
              <li>Targeted advertising (we don't do targeted advertising)</li>
              <li>Certain profiling activities (we don't profile)</li>
            </ul>
          </li>
        </ul>

        <h3>How to Exercise Colorado Rights</h3>
        <ul>
          <li>Email support@stellarforge.tools with "Colorado Privacy Request" in the subject</li>
          <li>We'll respond within 45 days</li>
          <li>No fee for requests made up to twice per year</li>
        </ul>

        <h3>Appeals Process</h3>
        <p>
          If we deny your request, you can appeal by emailing support@stellarforge.tools with
          "CPA Appeal" in the subject. We'll respond within 45 days. If we deny your appeal,
          you may contact the Colorado Attorney General.
        </p>

        <h3>Categories of Personal Data We Process</h3>
        <ul>
          <li>Identifiers (email, username)</li>
          <li>Commercial information (subscription status, payment history)</li>
          <li>Internet activity (usage logs, error reports - anonymized)</li>
        </ul>

        <h3>No Sale or Sharing</h3>
        <p>
          We do not sell your personal data. We do not share your personal data for
          cross-context behavioral advertising.
        </p>
      </section>

      <section>
        <h2>European Users (GDPR)</h2>
        <p>
          If you're in the European Economic Area (EEA), UK, or Switzerland, you have
          additional rights under GDPR:
        </p>

        <h3>Legal Basis for Processing</h3>
        <ul>
          <li><strong>Contract Performance:</strong> We process your data to provide the service you signed up for</li>
          <li><strong>Legitimate Interest:</strong> We analyze anonymous usage patterns to improve features</li>
          <li><strong>Legal Obligation:</strong> We retain billing records for tax compliance</li>
          <li><strong>Consent:</strong> We'll ask for explicit consent for any non-essential communications</li>
        </ul>

        <h3>Your GDPR Rights</h3>
        <ul>
          <li><strong>Right to Access:</strong> Get a copy of all your personal data</li>
          <li><strong>Right to Rectification:</strong> Correct inaccurate information</li>
          <li><strong>Right to Erasure:</strong> Delete your account and all data ("right to be forgotten")</li>
          <li><strong>Right to Restriction:</strong> Limit how we process your data</li>
          <li><strong>Right to Portability:</strong> Export your data in standard formats (available in your dashboard)</li>
          <li><strong>Right to Object:</strong> Object to processing based on legitimate interest</li>
          <li><strong>Right to Withdraw Consent:</strong> Cancel consent-based processing anytime</li>
          <li><strong>Right to Lodge a Complaint:</strong> File a complaint with your supervisory authority</li>
        </ul>

        <h3>International Data Transfers</h3>
        <p>Your data may be processed in the United States. We ensure adequate protection through:</p>
        <ul>
          <li>Standard Contractual Clauses with our service providers</li>
          <li>Encryption in transit and at rest</li>
          <li>Supabase and Vercel's GDPR compliance measures</li>
          <li>Stripe's GDPR-compliant payment processing</li>
        </ul>

        <h3>EU Representative</h3>
        <p>For GDPR inquiries, contact support@stellarforge.tools</p>
      </section>

      <section>
        <h2>Data Security</h2>

        <h3>How We Protect Your Data</h3>
        <ul>
          <li>All content is encrypted at rest and in transit (TLS 1.3)</li>
          <li>Regular security audits and updates</li>
          <li>Account authentication protections through Supabase</li>
          <li>Automatic encrypted backups to prevent data loss</li>
          <li>Limited employee access (we can't access your creative content at all)</li>
          <li>Secure infrastructure through Vercel and Supabase</li>
        </ul>

        <h3>In Case of a Breach</h3>
        <p>
          We will notify you within 72 hours if there's a data breach that affects your
          personal information, as required by law.
        </p>
      </section>

      <section>
        <h2>Data Retention</h2>

        <h3>While Your Account is Active</h3>
        <ul>
          <li>We retain your account information and worldbuilding content</li>
          <li>You can export your worlds anytime from your dashboard</li>
        </ul>

        <h3>After Account Deletion</h3>
        <ul>
          <li>Your creative content is deleted within 30 days</li>
          <li>Your account information is deleted within 30 days</li>
          <li>Billing records are retained for 7 years for tax compliance (anonymized where possible)</li>
          <li>Anonymized usage analytics may be retained indefinitely</li>
        </ul>

        <h3>Inactive Accounts</h3>
        <p>
          We'll email you before deleting inactive accounts (no login for 24+ months).
          You'll have 60 days to respond before deletion.
        </p>
      </section>

      <section>
        <h2>Children's Privacy (COPPA Compliance)</h2>
        <p>
          StellarForge.tools is intended for users 13 years of age or older. We do not
          knowingly collect personal information from children under 13.
        </p>
        <p><strong>If you are under 13, you may not use this service.</strong></p>
        <p>
          If we learn we've collected information from a child under 13, we'll delete it immediately.
          If you believe we have information from a child under 13, contact support@stellarforge.tools.
        </p>
      </section>

      <section>
        <h2>Changes to This Policy</h2>
        <p>
          We'll notify you of any material changes via email at least 30 days in advance.
          The "Last Updated" date at the top will reflect the most recent changes.
        </p>
        <p>
          Continued use after changes means acceptance. If you don't agree with changes,
          you can delete your account before they take effect.
        </p>
        <p>
          <strong>Policy Change History:</strong> We maintain a changelog of privacy policy updates at{" "}
          <Link to="/changelog">/changelog</Link>
        </p>
      </section>

      <section>
        <h2>Contact & Questions</h2>
        <p><strong>Privacy Questions:</strong><br />Email: support@stellarforge.tools</p>
        <p><strong>Data Protection Requests:</strong><br />Email: support@stellarforge.tools with "Privacy Request" in subject</p>
        <p><strong>Colorado Privacy Rights:</strong><br />Email: support@stellarforge.tools with "Colorado Privacy Request" in subject</p>
        <p><strong>GDPR Inquiries:</strong><br />Email: support@stellarforge.tools with "GDPR Request" in subject</p>
        <p>
          We're real humans who care about your privacy. We aim to respond within 2 business days.
        </p>
      </section>
    </LegalPageLayout>
  );
};

export default Privacy;
