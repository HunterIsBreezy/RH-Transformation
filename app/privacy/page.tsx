import type { Metadata } from "next";
import Link from "next/link";
import "../_styles/legal.css";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How RH Transformation collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="legal-wrap">
      <Link href="/" className="back">Back to RH Transformation</Link>
      <h1>Privacy Policy</h1>
      <p className="updated">Last updated: April 2026</p>

      <h2>Who we are</h2>
      <p>
        RH Transformation (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) is a coaching service
        operated by Rylan and Hunter. This policy explains how we collect, use, and protect your
        personal information when you visit our website or participate in our coaching program.
      </p>

      <h2>Information we collect</h2>
      <p>We collect information you provide directly to us:</p>
      <ul>
        <li>Name, age, city, and email address (via our intake form and Calendly booking)</li>
        <li>Responses to our pre-call assessment questions</li>
        <li>Payment information (processed by Stripe — we never see or store your full card number)</li>
        <li>Health, fitness, and lifestyle information you share during coaching</li>
        <li>Messages exchanged via Slack, text, or email during the program</li>
      </ul>
      <p>
        We also collect basic analytics data (page views, button clicks) through privacy-friendly
        analytics that do not use cookies or track you across other websites.
      </p>

      <h2>How we use your information</h2>
      <ul>
        <li>To deliver the coaching program you signed up for</li>
        <li>To customize your training, nutrition, and systems plans</li>
        <li>To communicate with you about scheduling, check-ins, and program updates</li>
        <li>To process payments through Stripe</li>
        <li>To improve our website and program based on aggregate, non-identifying usage patterns</li>
      </ul>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell your personal information to anyone, ever</li>
        <li>We do not share your health or fitness data with third parties</li>
        <li>We do not use your data for advertising or retargeting</li>
        <li>We do not send unsolicited marketing emails after the program ends</li>
      </ul>

      <h2>Third-party services</h2>
      <p>
        We use the following services that may process your data according to their own privacy
        policies:
      </p>
      <ul>
        <li><strong>Stripe</strong> — payment processing</li>
        <li><strong>Calendly</strong> — appointment booking</li>
        <li><strong>Tally</strong> — intake form</li>
        <li><strong>Slack</strong> — client communication</li>
        <li><strong>Notion</strong> — client portal</li>
      </ul>

      <h2>Data retention</h2>
      <p>
        We retain your coaching data (training plans, check-in records, call notes) for 12 months
        after your program ends, in case you return for a second round or need reference material.
        After 12 months, we delete it unless you ask us to keep it. Payment records are retained as
        required by tax law.
      </p>

      <h2>Your rights</h2>
      <p>
        You can request access to, correction of, or deletion of your personal data at any time by
        emailing us. We will respond within 30 days.
      </p>

      <h2>Transformation photos</h2>
      <p>
        We will never use your before/after photos, testimonials, or any identifying information
        publicly without your explicit written consent. If you do consent, you can revoke it at any
        time.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy:{" "}
        <a href="mailto:hello@rhtransformation.com">hello@rhtransformation.com</a>
      </p>
    </div>
  );
}
