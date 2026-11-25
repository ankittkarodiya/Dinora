import LegalLayout, { Section, UL } from "./LegalLayout";
import { LEGAL } from "../../config/legal";

export default function RefundPolicy() {
  return (
    <LegalLayout
      title="Cancellation & Refund Policy"
      intro={`This policy explains how cancellations and refunds work for ${LEGAL.brand} subscriptions, and what to do about orders placed by customers at a restaurant.`}
    >
      <Section title="1. Cancelling your subscription">
        <p>
          Dinora plans are prepaid for the period you choose (monthly or yearly) and do not renew automatically, so
          there is nothing to cancel to avoid future charges. If you stop using Dinora, simply do not renew. Your
          plan stays active until the end of the period you paid for.
        </p>
      </Section>

      <Section title="2. Refunds on subscriptions">
        <UL
          items={[
            `First purchase: if you are not satisfied, you can ask for a full refund within ${LEGAL.refundWindowDays} days of your first paid plan payment.`,
            "Renewals and later payments are non-refundable once the plan period has started.",
            "Free trials and promotional (free) plans carry no charge, so there is nothing to refund.",
            "We do not give part-period or pro-rata refunds for unused time after the refund window.",
          ]}
        />
      </Section>

      <Section title="3. How to request a refund">
        <p>
          Email {LEGAL.supportEmail} from your registered email address, or call {LEGAL.supportPhone}. Please include
          your restaurant name and the payment reference. We reply within 2 working days.
        </p>
      </Section>

      <Section title="4. How refunds are paid">
        <p>
          Approved refunds are sent to the original payment method through Razorpay and normally reach your account
          within 5 to 7 working days, depending on your bank or card issuer.
        </p>
      </Section>

      <Section title="5. Failed or duplicate payments">
        <p>
          If money was deducted but your plan was not activated, or you were charged twice, the amount is usually
          returned automatically by the payment gateway within 5 to 7 working days. If it is not, contact us with the
          payment reference and we will sort it out.
        </p>
      </Section>

      <Section title="6. Food orders placed by customers">
        <p>
          Orders and payments made by a restaurant's customers are between the customer and that restaurant. Dinora
          does not sell food and does not decide those refunds. Customers should contact the restaurant for issues
          with an order. Online payments made to a restaurant are processed through that restaurant's own Razorpay
          account, so any refund is issued by the restaurant.
        </p>
      </Section>

      <Section title="7. Contact">
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