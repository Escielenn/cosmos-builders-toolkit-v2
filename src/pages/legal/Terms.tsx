import LegalPageLayout from "@/components/layout/LegalPageLayout";
import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <LegalPageLayout
      title="Terms of Service"
      subtitle="The agreement between you and StellarForge."
      lastUpdated="February 2026"
      badgeIcon={<FileText className="w-3 h-3 mr-1" />}
      badgeText="Terms"
    >
      <section>
        <h2>The Core Agreement</h2>
        <p>
          StellarForge.tools provides worldbuilding tools and resources for science fiction writers.
          By using the service, you agree to these terms. We've written them to be as straightforward as possible.
        </p>
        <p>If you don't agree with these terms, please don't use StellarForge.</p>
      </section>

      <section>
        <h2>Your Account</h2>

        <h3>Your Responsibilities</h3>
        <ul>
          <li>Provide accurate information (especially your email address)</li>
          <li>Keep your login credentials secure and confidential</li>
          <li>Don't share your account with others</li>
          <li>Use the service for lawful purposes only</li>
          <li>You must be at least 13 years old to use StellarForge</li>
          <li>If you're 13-17, you must have parent/guardian permission</li>
        </ul>

        <h3>Our Responsibilities</h3>
        <ul>
          <li>Provide the tools and features as described</li>
          <li>Maintain reasonable uptime and availability</li>
          <li>Protect your data and privacy (see <Link to="/privacy">Privacy Policy</Link>)</li>
          <li>Give you advance notice of major changes</li>
          <li>Respond to support requests in a timely manner</li>
        </ul>

        <h3>Account Security</h3>
        <p>
          You're responsible for all activity under your account. If you believe your account
          has been compromised, contact us immediately at support@stellarforge.tools.
        </p>
      </section>

      <section>
        <h2>Age Requirements & Parental Consent</h2>

        <h3>Minimum Age: 13 Years</h3>
        <p>
          StellarForge.tools is intended for users 13 years of age or older. If you are under 13,
          you may not use this service in compliance with COPPA (Children's Online Privacy Protection Act).
        </p>

        <h3>For Users 13-17</h3>
        <ul>
          <li>You must have parent or guardian permission to use StellarForge</li>
          <li>Your parent/guardian is responsible for your account and any charges</li>
          <li>All payment methods must belong to your parent/guardian</li>
          <li>Your parent/guardian agrees to these Terms on your behalf</li>
        </ul>

        <h3>Parent/Guardian Consent</h3>
        <p>If you are a parent or legal guardian of a user under 18, by allowing them to use StellarForge, you agree to:</p>
        <ul>
          <li>Supervise their use of the service</li>
          <li>Be responsible for any charges incurred</li>
          <li>Ensure they comply with these Terms</li>
          <li>Monitor their creative work and usage</li>
        </ul>
      </section>

      <section>
        <h2>Your Content & Intellectual Property</h2>

        <h3>Your Worlds Are Yours Alone</h3>
        <ul>
          <li>You own 100% of everything you create in StellarForge</li>
          <li>We claim zero rights to your worldbuilding materials</li>
          <li>You can use, publish, adapt, or sell anything you create - it's entirely your work</li>
          <li>We never access your creative content (see <Link to="/privacy">Privacy Policy</Link>)</li>
          <li>You can export your worlds anytime from your dashboard in JSON format</li>
        </ul>

        <h3>What We Provide</h3>
        <ul>
          <li>The educational framework, methodology, and "Alien Minds & AI Souls" approach</li>
          <li>The tools, templates, worksheets, and interactive features</li>
          <li>Reference materials, examples, and educational content</li>
          <li>The platform infrastructure and ongoing improvements</li>
        </ul>

        <h3>License to Use StellarForge Tools</h3>
        <ul>
          <li>You have a non-exclusive license to use StellarForge tools while your subscription is active</li>
          <li>You can use the tools for personal or commercial creative projects</li>
          <li>You can't resell, redistribute, or copy the tools themselves</li>
          <li>You can't claim our methodology or educational framework as your own</li>
          <li>You can publish any works created using the tools without restriction or attribution</li>
        </ul>

        <h3>Educational Content</h3>
        <p>
          The course materials, scientific frameworks, and worldbuilding methodology remain our
          intellectual property. You can use what you learn, but you can't republish our course
          materials or sell access to them.
        </p>
      </section>

      <section>
        <h2>Prohibited Activities</h2>

        <h3>Absolutely Don't</h3>

        <h4>Illegal Content</h4>
        <ul>
          <li>Upload, create, or store illegal content in your worlds</li>
          <li>Use the service for any illegal purpose</li>
          <li>Violate any local, state, federal, or international law</li>
        </ul>

        <h4>Intellectual Property Violations</h4>
        <ul>
          <li>Upload or incorporate copyrighted material you don't have rights to use</li>
          <li>Infringe on others' trademarks, patents, or intellectual property</li>
          <li>Create worlds based on others' copyrighted universes without permission (e.g., directly copying Star Wars, Star Trek, etc.)</li>
        </ul>
        <p>
          <em>Note: Creating original works inspired by genres or using common tropes is fine - direct copying is not</em>
        </p>

        <h4>Account Misuse</h4>
        <ul>
          <li>Share your account credentials with others</li>
          <li>Create multiple accounts to abuse free trials</li>
          <li>Attempt to access other users' data or accounts</li>
          <li>Use bots or automated systems to create accounts</li>
        </ul>

        <h4>System Abuse</h4>
        <ul>
          <li>Reverse engineer or copy the platform code</li>
          <li>Attempt to breach security measures</li>
          <li>Upload malicious code, viruses, or harmful content</li>
          <li>Deliberately overload or attack our systems</li>
          <li>Scrape data from the platform</li>
        </ul>

        <h4>Harmful Content</h4>
        <p>While we don't access your creative content, you agree not to create content that:</p>
        <ul>
          <li>Exploits or harms minors</li>
          <li>Promotes illegal activity</li>
          <li>Violates others' privacy or rights</li>
        </ul>

        <h3>Consequences</h3>
        <p>Violation of these terms may result in:</p>
        <ul>
          <li>Warning and request to remove prohibited content</li>
          <li>Temporary account suspension</li>
          <li>Permanent account termination without refund</li>
          <li>Legal action if required</li>
          <li>Reporting to authorities for illegal content</li>
        </ul>
        <p>We rarely need to enforce these rules, but they protect everyone in the community.</p>
      </section>

      <section>
        <h2>Subscriptions, Payments & Refunds</h2>

        <h3>Subscription Plans</h3>
        <ul>
          <li>Monthly subscriptions renew automatically on your billing date</li>
          <li>You'll be charged the current subscription rate each month</li>
          <li>Free tier available with limited features (no payment required)</li>
        </ul>

        <h3>Billing</h3>
        <ul>
          <li>All prices are in USD</li>
          <li>Payment processed securely through Stripe</li>
          <li>We collect Colorado sales tax for Colorado residents</li>
          <li>We may collect sales tax for other states as required by law</li>
          <li>You'll receive a receipt via email for each payment</li>
        </ul>

        <h3>Automatic Renewal</h3>
        <ul>
          <li>Your subscription continues until you cancel</li>
          <li>You can cancel anytime from your account dashboard</li>
          <li>Cancellation takes effect at the end of your current billing period</li>
          <li>You retain access to paid features through the end of your paid period</li>
        </ul>

        <h3>Refund Policy</h3>
        <p>To comply with state requirements and to be fair to our users:</p>
        <ul>
          <li><strong>First Month:</strong> Full refund if you cancel within 7 days of your first subscription payment</li>
          <li><strong>Subsequent Months:</strong> Refunds are pro-rated if you cancel within 7 days of a renewal</li>
          <li><strong>After 7 Days:</strong> No refunds for the current billing period, but you retain access through the end of the period</li>
          <li><strong>Technical Issues:</strong> If our service is unavailable for 48+ consecutive hours, you may request a pro-rated refund</li>
          <li><strong>Billing Errors:</strong> We'll refund any incorrect charges immediately</li>
        </ul>

        <h3>To Request a Refund</h3>
        <p>
          Email support@stellarforge.tools with your account email and reason for refund.
          We process refunds within 5-10 business days.
        </p>

        <h3>Price Changes</h3>
        <ul>
          <li>We'll notify you at least 30 days before any price increase</li>
          <li>New prices apply at your next renewal after the notice period</li>
          <li>You can cancel before the increase takes effect</li>
          <li>Price decreases take effect immediately</li>
        </ul>

        <h3>Failed Payments</h3>
        <ul>
          <li>If a payment fails, we'll attempt to charge again</li>
          <li>You'll receive email notification</li>
          <li>Access may be suspended after 7 days of failed payment</li>
          <li>Account won't be deleted; you can update payment info to restore access</li>
        </ul>

        <h3>Free Tier</h3>
        <ul>
          <li>No payment information required</li>
          <li>We can modify free tier features with 30 days notice</li>
          <li>Free tier has limited features compared to paid subscription</li>
          <li>No commitment or automatic conversion to paid</li>
        </ul>
      </section>

      <section>
        <h2>Service Availability & Performance</h2>

        <h3>Our Commitment</h3>
        <ul>
          <li>We strive for 99%+ uptime</li>
          <li>Scheduled maintenance will be announced at least 24 hours in advance</li>
          <li>Emergency maintenance may occur without notice</li>
          <li>We'll communicate service issues via email and status page</li>
        </ul>

        <h3>Service Disclaimer</h3>
        <ul>
          <li>We provide the service "as is" without warranties of any kind</li>
          <li>We can't guarantee 100% uptime or error-free operation</li>
          <li>We're not liable for temporary service interruptions</li>
          <li>Your data is backed up, but you should export important work regularly</li>
        </ul>

        <h3>Your Data Protection</h3>
        <ul>
          <li>Automated backups every 24 hours (encrypted)</li>
          <li>You can export your worlds anytime from your dashboard</li>
          <li>30-day recovery window if you accidentally delete content</li>
          <li>60 days notice before any service discontinuation</li>
        </ul>

        <h3>Third-Party Services</h3>
        <p>
          We depend on Stripe, Supabase, Vercel, Resend, and ImprovMX. If these services
          experience issues, StellarForge may be affected. We're not liable for third-party
          service failures, but we'll work to restore service quickly.
        </p>
      </section>

      <section>
        <h2>Educational Content & Scientific Information</h2>

        <h3>What We Provide</h3>
        <ul>
          <li>Science fiction worldbuilding methodology based on "Alien Minds & AI Souls" framework</li>
          <li>Scientific reference information accurate as of publication date</li>
          <li>Educational tools and structured worksheets</li>
          <li>Examples from published science fiction works</li>
        </ul>

        <h3>What We Don't Guarantee</h3>
        <ul>
          <li>Scientific information reflects current understanding at time of publication; science evolves</li>
          <li>We're not responsible for creative decisions you make using our tools</li>
          <li>Your published works are your responsibility</li>
          <li>Worldbuilding outcomes depend on your creative choices</li>
        </ul>

        <h3>Attribution</h3>
        <p>
          When we reference published works or scientific papers, we provide proper attribution.
          If you notice an attribution error, please let us know.
        </p>

        <h3>Not Professional Advice</h3>
        <p>
          StellarForge provides educational tools for creative writing. This is not scientific,
          professional, or publishing advice. Consult appropriate professionals for those needs.
        </p>
      </section>

      <section>
        <h2>Disclaimers & Limitation of Liability</h2>

        <h3>Service Provided "As Is"</h3>
        <p>
          StellarForge.tools is provided "as is" and "as available" without warranties of any kind,
          either express or implied, including but not limited to:
        </p>
        <ul>
          <li>Warranties of merchantability</li>
          <li>Fitness for a particular purpose</li>
          <li>Non-infringement</li>
          <li>Uninterrupted or error-free operation</li>
        </ul>

        <h3>What We're Not Responsible For</h3>
        <ul>
          <li>How you use the worldbuilding materials you create</li>
          <li>Publishing outcomes or commercial success of your creative works</li>
          <li>Content you choose to create in your worlds</li>
          <li>Creative decisions based on our educational materials</li>
          <li>Temporary service interruptions or data loss (though we make every effort to prevent this)</li>
          <li>Third-party service failures (Stripe, Supabase, Vercel, etc.)</li>
        </ul>

        <h3>Limitation of Liability</h3>
        <p>To the maximum extent permitted by law:</p>
        <p>
          Our total liability for any claims related to StellarForge is limited to the amount
          you've paid us in the 12 months before the claim arose.
        </p>
        <p>We're not liable for:</p>
        <ul>
          <li>Indirect, incidental, special, or consequential damages</li>
          <li>Loss of profits, data, or business opportunities</li>
          <li>Damages resulting from third-party services</li>
          <li>Issues caused by your misuse of the service</li>
        </ul>

        <h3>Exceptions</h3>
        <p>These limitations don't apply to:</p>
        <ul>
          <li>Our gross negligence or willful misconduct</li>
          <li>Violations of your intellectual property rights in your creative work</li>
          <li>Privacy violations</li>
          <li>Anything that can't be limited by law in your jurisdiction</li>
        </ul>

        <h3>Colorado Law</h3>
        <p>These limitations are enforceable under Colorado law to the extent permitted.</p>
      </section>

      <section>
        <h2>Privacy & Data Protection</h2>

        <h3>Zero Access to Your Creative Work</h3>
        <p>This is fundamental to our service:</p>
        <ul>
          <li>We never access your worldbuilding content</li>
          <li>We never train AI on user materials</li>
          <li>We never share user data with third parties (except essential service providers)</li>
          <li>Zero tolerance for privacy violations</li>
        </ul>

        <h3>Full Details</h3>
        <p>
          See our <Link to="/privacy">Privacy Policy</Link> for complete information about data
          collection, use, storage, and your rights.
        </p>

        <h3>Data Export</h3>
        <p>
          You can export all your worlds in JSON format from your dashboard at any time.
          This is your right, and we make it easy.
        </p>
      </section>

      <section>
        <h2>Termination</h2>

        <h3>You Can Cancel Anytime</h3>
        <ul>
          <li>Cancel your subscription from your account dashboard</li>
          <li>Cancellation takes effect at the end of your current billing period</li>
          <li>You can delete your account and all data</li>
          <li>After account deletion, your data is permanently removed within 30 days (except anonymized billing records for tax compliance)</li>
        </ul>

        <h3>We Can Terminate</h3>
        <p>We may suspend or terminate accounts for:</p>
        <ul>
          <li>Violation of these Terms</li>
          <li>Illegal activity</li>
          <li>Non-payment (after grace period)</li>
          <li>Abusive behavior toward support staff</li>
        </ul>

        <h3>Notice</h3>
        <ul>
          <li><strong>For violations:</strong> We'll usually warn you first, then suspend, then terminate</li>
          <li><strong>For serious violations</strong> (illegal content, security threats): Immediate termination</li>
          <li><strong>For service discontinuation:</strong> 60 days notice with pro-rated refunds</li>
        </ul>

        <h3>What Happens When You Leave</h3>
        <ul>
          <li>You can export your data before cancellation</li>
          <li>After 30 days, all your data is permanently deleted</li>
          <li>Billing records retained for tax compliance (7 years, anonymized)</li>
          <li>You can always come back and start fresh</li>
        </ul>
      </section>

      <section>
        <h2>Changes to These Terms</h2>

        <h3>We May Update These Terms</h3>
        <ul>
          <li>Material changes require 30 days advance notice via email</li>
          <li>Notice will explain what's changing and why</li>
          <li>Continued use after the notice period means acceptance</li>
          <li>"Last Updated" date at top reflects most recent changes</li>
        </ul>

        <h3>If You Disagree</h3>
        <ul>
          <li>You can cancel your subscription before changes take effect</li>
          <li>Email support@stellarforge.tools with questions about changes</li>
          <li>We're happy to discuss concerns</li>
        </ul>

        <h3>Minor Changes</h3>
        <ul>
          <li>Typo fixes, clarifications, or formatting don't require 30 days notice</li>
          <li>Changes required by law take effect when legally required</li>
        </ul>

        <h3>Change History</h3>
        <p>
          We maintain a changelog of terms updates at <Link to="/changelog">/changelog</Link>
        </p>
      </section>

      <section>
        <h2>Dispute Resolution</h2>

        <h3>We'd Rather Talk</h3>
        <p>If you have an issue with StellarForge:</p>
        <ul>
          <li>Email support@stellarforge.tools</li>
          <li>We'll respond within 2 business days</li>
          <li>We'll work in good faith to resolve the issue</li>
          <li>Most problems are resolved at this stage</li>
        </ul>

        <h3>If That Doesn't Work</h3>

        <h4>Governing Law</h4>
        <ul>
          <li>These Terms are governed by Colorado law</li>
          <li>Venue for disputes is in Colorado courts</li>
          <li>You retain any rights under your local consumer protection laws</li>
        </ul>

        <h4>Informal Resolution</h4>
        <p>Before any formal action, we both agree to attempt informal resolution for at least 30 days.</p>

        <h4>Small Claims Court</h4>
        <p>You may bring claims in small claims court in your local jurisdiction if the claim qualifies.</p>
      </section>

      <section>
        <h2>Miscellaneous</h2>
        <ul>
          <li><strong>Entire Agreement:</strong> These Terms and our Privacy Policy constitute the entire agreement between you and StellarForge.</li>
          <li><strong>Severability:</strong> If any provision is found unenforceable, the rest remains in effect.</li>
          <li><strong>No Waiver:</strong> Our failure to enforce any right doesn't waive that right.</li>
          <li><strong>Assignment:</strong> You can't transfer your account or these Terms. We may transfer our rights/obligations with notice.</li>
          <li><strong>Force Majeure:</strong> We're not liable for delays or failures due to circumstances beyond our reasonable control (natural disasters, pandemics, infrastructure failures, etc.).</li>
          <li><strong>Survival:</strong> Provisions about ownership, liability, and dispute resolution survive account termination.</li>
          <li><strong>Feedback:</strong> If you provide suggestions or feedback about StellarForge, we may use them without obligation to you.</li>
        </ul>

        <h3>Contact for Legal Notices</h3>
        <p>support@stellarforge.tools</p>
      </section>

      <section>
        <h2>Accessibility</h2>
        <p>
          We're committed to making StellarForge.tools accessible to all science fiction writers,
          including those with disabilities. We strive to meet WCAG 2.1 Level AA standards.
        </p>
        <p>For accessibility feedback or to request accommodations:</p>
        <p>Email: support@stellarforge.tools with subject "Accessibility"</p>
      </section>

      <section>
        <h2>Contact Information</h2>
        <p><strong>General Support:</strong><br />support@stellarforge.tools</p>
        <p><strong>Privacy Questions:</strong><br />support@stellarforge.tools (subject: "Privacy")</p>
        <p><strong>Legal Questions:</strong><br />support@stellarforge.tools (subject: "Legal")</p>
        <p><strong>Billing Questions:</strong><br />support@stellarforge.tools (subject: "Billing")</p>
        <p><strong>Colorado Privacy Rights:</strong><br />support@stellarforge.tools (subject: "Colorado Privacy Request")</p>
        <p><strong>GDPR Requests:</strong><br />support@stellarforge.tools (subject: "GDPR Request")</p>
        <p>We aim to respond within 2 business days.</p>
      </section>

      <section className="text-center mt-12 pt-8 border-t border-border">
        <p className="font-display text-lg font-semibold">StellarForge.tools</p>
        <p className="text-muted-foreground italic">These worlds exist in you. Waiting to be found.</p>
        <p className="text-sm font-medium mt-2">Your Worlds Are Yours Alone.</p>
      </section>
    </LegalPageLayout>
  );
};

export default Terms;
