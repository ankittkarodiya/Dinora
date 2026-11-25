import LegalLayout, { Section, UL } from "./LegalLayout";
import { LEGAL } from "../../config/legal";

export default function TermsAndConditions() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      intro={`These terms are an agreement between you and ${LEGAL.legalName} ("${LEGAL.brand}", "we", "us"). By creating an account or using ${LEGAL.website.replace("https://", "")}, you agree to them. If you do not agree, please do not use the service.`}
    >
      <Section title="1. The service">
        <p>
          Dinora is a software service that lets restaurants publish a digital menu, take orders through table QR
          codes, a counter order screen and a self-order kiosk, track orders in the kitchen, print bills and view
          reports. Some features depend on your plan.
        </p>
      </Section>

      <Section title="2. Eligibility and your account">
        <UL
          items={[
            "You must be at least 18 and authorised to act for the restaurant you register.",
            "Give accurate information and keep it up to date.",
            "You are responsible for everything done through your account. Keep your password private. Your account may be limited to one signed-in device at a time.",
            "Tell us immediately if you think your account has been accessed without permission.",
          ]}
        />
      </Section>

      <Section title="3. Plans, free trial and offers">
        <UL
          items={[
            "Dinora offers paid plans billed monthly or yearly, and may offer a free trial. Prices and features are shown on our website and inside the app, and may change for future billing periods.",
            "A paid plan is prepaid for the period you choose. It does not renew automatically; you renew from your account when the period ends.",
            "Promotional offers, such as a free plan for the first set of restaurants, are limited, may have their own conditions, and can be changed or withdrawn for new sign-ups at any time.",
            "If a plan expires, access to the admin features may be paused until you renew. Your data is not deleted because a plan expired.",
          ]}
        />
      </Section>

      <Section title="4. Payments">
        <p>
          Subscription fees are paid to us through Razorpay. Payments your customers make to your restaurant are
          processed through your own Razorpay account and settle directly to you. We are not a party to the sale
          between you and your customers and we do not hold your customers' money.
        </p>
      </Section>

      <Section title="5. Your responsibilities as a restaurant">
        <UL
          items={[
            "Keep your menu, prices, photos, tax details and availability accurate.",
            "Charge GST correctly and follow all tax, licensing and food-safety laws that apply to you. You decide whether and at what rate GST applies; Dinora only calculates and prints what you configure.",
            "Prepare and serve orders properly and handle complaints and refunds to your customers.",
            "Obtain any consent needed to collect and use your customers' details.",
            "Do not upload anything unlawful, misleading or that infringes someone else's rights.",
          ]}
        />
      </Section>

      <Section title="6. Acceptable use">
        <p>You agree not to:</p>
        <UL
          items={[
            "Copy, resell or reverse-engineer the service, or use it to build a competing product.",
            "Attempt to break, overload or gain unauthorised access to our systems or other users' data.",
            "Use the service for any illegal, fraudulent or harmful purpose.",
            "Send spam or misuse the ordering, review or notification features.",
          ]}
        />
      </Section>

      <Section title="7. Your content and our rights">
        <p>
          You keep ownership of your menu, images, logos and other content. You give us permission to store and
          display it to run the service for you. Dinora, its design, software and branding belong to us, and these
          terms do not transfer any of that to you.
        </p>
      </Section>

      <Section title="8. Availability and changes">
        <p>
          We work to keep Dinora available, but we do not promise that it will be uninterrupted or error-free.
          We may update, change or discontinue features, and we will try to give notice of major changes.
        </p>
      </Section>

      <Section title="9. Suspension and termination">
        <p>
          You may stop using Dinora at any time. We may suspend or end an account that breaks these terms, is used
          fraudulently, or stays unpaid after its plan expires. On termination your right to use the service ends.
          Refunds are covered in our Cancellation &amp; Refund Policy.
        </p>
      </Section>

      <Section title="10. Disclaimer and limit of liability">
        <p>
          The service is provided "as is". To the fullest extent the law allows, we are not liable for indirect or
          consequential losses, loss of profit or data, or for losses caused by events beyond our control (such as
          internet, payment-gateway or hosting outages). Our total liability for any claim is limited to the amount
          you paid us for the plan in the three months before the claim arose. Nothing here limits liability that
          cannot be limited by law.
        </p>
      </Section>

      <Section title="11. Indemnity">
        <p>
          You agree to cover losses and claims that arise from your content, your use of the service in breach of
          these terms, or your dealings with your own customers.
        </p>
      </Section>

      <Section title="12. Privacy">
        <p>Our Privacy Policy explains how we handle information and forms part of these terms.</p>
      </Section>

      <Section title="13. Governing law">
        <p>
          These terms are governed by the laws of India. The courts at {LEGAL.jurisdiction} have exclusive
          jurisdiction over any dispute.
        </p>
      </Section>

      <Section title="14. Changes to these terms">
        <p>
          We may update these terms. Continued use of Dinora after a change means you accept the updated terms.
        </p>
      </Section>

      <Section title="15. Contact">
        <p>
          {LEGAL.legalName}
          <br />
          Email: {LEGAL.supportEmail}
          <br />
          Phone: {LEGAL.supportPhone}
          <br />
          Address: {LEGAL.address}
        </p>
      </Section>
    </LegalLayout>
  );
}