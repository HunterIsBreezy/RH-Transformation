import type { Metadata } from "next";
import Link from "next/link";
import "../_styles/legal.css";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing participation in the RH Transformation coaching program.",
};

export default function TermsPage() {
  return (
    <div className="legal-wrap">
      <Link href="/" className="back">Back to RH Transformation</Link>
      <h1>Terms of Service</h1>
      <p className="updated">Last updated: April 2026</p>

      <h2>The program</h2>
      <p>
        RH Transformation (&quot;the Program&quot;) is a 15-week 1-on-1 coaching program covering
        fitness, mindset, and daily systems. It is operated by Rylan and Hunter (&quot;we,&quot;
        &quot;us,&quot; &quot;Coaches&quot;). By purchasing the Program, you agree to these terms.
      </p>

      <h2>Application fee</h2>
      <p>A $19 application fee is collected when you book a discovery call. This fee is:</p>
      <ul>
        <li>Refunded in full if we determine the Program is not a good fit for you</li>
        <li>Credited toward the Program fee if you enroll</li>
        <li>Non-refundable if you no-show the booked call without 24-hour notice</li>
      </ul>

      <h2>Program fee and payment</h2>
      <p>
        The Program fee is $1,697, paid in full before your kickoff call. All payments are
        processed through Stripe. The fee covers 15 weeks of coaching, including weekly 1-on-1
        calls with both Coaches, daily check-ins, custom plans, and client portal access.
      </p>

      <h2>The guarantee</h2>
      <p>
        If you complete the Program as prescribed and do not see meaningful change in your body,
        mind, and daily systems by the end of week 15, we will refund 100% of your Program fee.
      </p>
      <p>&quot;Complete the Program as prescribed&quot; means:</p>
      <ul>
        <li>
          Every weekly call attended (one with Rylan, one with Hunter). Up to two calls may be
          missed and rescheduled within 7 days.
        </li>
        <li>
          80% or higher daily check-in completion across all 15 weeks (minimum 84 of 105 days).
        </li>
        <li>
          Training plan, nutrition guidelines, and systems framework followed as built for you.
          Material deviation from the plan may affect guarantee eligibility, but we will discuss
          this with you before making any determination.
        </li>
      </ul>
      <p>
        To claim the guarantee, email us within 14 days of your week 15 end date. Refunds are
        processed within 7 business days.
      </p>

      <h2>Cancellation</h2>
      <p>
        The Program is a 15-week commitment paid in full upfront. We do not offer prorated refunds
        for withdrawal mid-program. Exceptions are made for medical emergencies, family
        emergencies, or material changes in life circumstance — handled human-to-human, not by
        policy.
      </p>

      <h2>What you get</h2>
      <ul>
        <li>15 weeks of weekly 1-on-1 video calls with both Coaches</li>
        <li>Custom fitness and nutrition plans</li>
        <li>Custom reading, mindset, and systems plans</li>
        <li>Daily check-in structure and accountability</li>
        <li>Private client portal (Notion)</li>
        <li>Brotherhood community access (Slack)</li>
        <li>Direct access to Coaches between calls via Slack or text</li>
        <li>Initial deep-dive assessment call</li>
      </ul>

      <h2>What you are responsible for</h2>
      <ul>
        <li>Showing up to every scheduled call on time</li>
        <li>Completing daily check-ins honestly</li>
        <li>Following your custom plan as prescribed</li>
        <li>Communicating with your Coaches when you&apos;re struggling — not disappearing</li>
        <li>Providing accurate health information during your assessment</li>
      </ul>

      <h2>Capacity</h2>
      <p>
        We accept a maximum of 20 clients at any given time. Enrollment is not guaranteed — we
        reserve the right to decline applicants we do not believe are a fit for the Program.
      </p>

      <h2>Intellectual property</h2>
      <p>
        All custom plans, frameworks, and materials created for you during the Program are for your
        personal use only. You may not resell, redistribute, or publish them without our written
        consent.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        The Program is coaching, not therapy, medical advice, or licensed counseling. See our
        Fitness Disclaimer for important health-related limitations. Our total liability to you
        under these terms is limited to the Program fee you paid.
      </p>

      <h2>Modifications</h2>
      <p>
        We may update these terms from time to time. If we make material changes, we will notify
        current clients directly. Continued participation in the Program constitutes acceptance of
        updated terms.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of the state of California, United States.</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms:{" "}
        <a href="mailto:hello@rhtransformation.com">hello@rhtransformation.com</a>
      </p>
    </div>
  );
}
