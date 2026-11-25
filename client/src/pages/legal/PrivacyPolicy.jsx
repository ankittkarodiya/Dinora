import LegalLayout, { Section, UL } from "./LegalLayout";
import { LEGAL } from "../../config/legal";

// import { useLayoutEffect } from "react";

export default function PrivacyPolicy() {

    // useLayoutEffect(() => {
    //     window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    // }, []);


  return (
    <LegalLayout
      title="Privacy Policy"
      intro={`${LEGAL.brand} ("we", "us") provides software that lets restaurants take orders through QR codes, a counter screen and a self-order kiosk. This policy explains what information we collect, why we collect it, and the choices you have. By using ${LEGAL.website.replace("https://", "")} you agree to this policy.`}
    >
      <Section title="1. Who this policy covers">
        <p>There are two groups of people whose information passes through Dinora:</p>
        <UL
          items={[
            "Restaurant owners and staff who create an account and run their restaurant on Dinora (\"restaurants\").",
            "Guests of a restaurant who scan a QR code and place an order (\"customers\").",
          ]}
        />
        <p>
          For a restaurant's own account we are the data controller. For the details of a restaurant's customers
          (name, phone number, orders), the restaurant decides why the data is collected and we process it on the
          restaurant's behalf to run the service.
        </p>
      </Section>

      <Section title="2. Information we collect">
        <p className="font-semibold text-gray-900">From restaurants</p>
        <UL
          items={[
            "Account details: name, email address, phone number and password (stored in hashed form, never in plain text).",
            "Restaurant details: restaurant name, address, logo, GST number, GST percentage, menu, tables and prices.",
            "Subscription and payment records: plan, billing period and Razorpay payment references. We do not store card, UPI or bank credentials.",
            "Usage and device data: log data, browser type and app notifications settings.",
          ]}
        />
        <p className="font-semibold text-gray-900">From customers</p>
        <UL
          items={[
            "Name and phone number, if the customer registers or logs in to order or leave a review.",
            "Order details: items, amounts, table or counter, payment method and order status.",
            "Reviews and ratings the customer chooses to submit.",
            "For counter orders, a restaurant may type a customer's name or phone number so it appears on the order. This does not create a customer account.",
          ]}
        />
      </Section>

      <Section title="3. How we use information">
        <UL
          items={[
            "To create and run your account, restaurant, menu and orders.",
            "To show orders to the restaurant's kitchen in real time and send order notifications.",
            "To generate bills and keep order history and revenue reports for the restaurant.",
            "To process subscription payments and prevent fraud or misuse.",
            "To send service messages such as verification codes and password-reset emails.",
            "To respond to demo and support requests, and to improve the product.",
          ]}
        />
        <p>We do not sell personal information, and we do not use customers' details to advertise to them.</p>
      </Section>

      <Section title="4. Who we share information with">
        <p>We share information only with service providers that help us run Dinora, and only as needed:</p>
        <UL
          items={[
            "Razorpay, to process subscription payments and the online payments restaurants collect from their customers.",
            "Cloudinary, to store menu images and logos.",
            "Twilio and our email provider, to send verification codes and service emails.",
            "Cloud hosting and database providers, which store our data securely.",
          ]}
        />
        <p>
          We may also disclose information if the law requires it, or to protect the rights, safety and security of
          our users and our service.
        </p>
      </Section>

      <Section title="5. Cookies, local storage and notifications">
        <p>
          Dinora uses your browser's local and session storage to keep you signed in, remember your preferences and
          keep a customer's order session. These are essential to the service. If you turn on order notifications,
          your browser or device stores a push-notification token so we can alert you about new orders. You can
          turn notifications off in your browser or in Dinora settings at any time.
        </p>
      </Section>

      <Section title="6. How long we keep information">
        <p>
          We keep a restaurant's data while its account is active and for a reasonable period afterwards for
          accounting, legal and dispute purposes. When you ask us to delete an account, we delete or anonymise the
          personal information we are not required to keep.
        </p>
      </Section>

      <Section title="7. Security">
        <p>
          We use HTTPS, hashed passwords, access controls and encrypted storage of sensitive keys to protect your
          information. No system is perfectly secure, so please keep your password private and log out on shared
          devices.
        </p>
      </Section>

      <Section title="8. Your rights">
        <p>You can ask us to:</p>
        <UL
          items={[
            "Give you a copy of the personal information we hold about you.",
            "Correct information that is wrong or incomplete.",
            "Delete your account and personal information, subject to legal record-keeping needs.",
            "Withdraw consent you gave us, where processing is based on consent.",
          ]}
        />
        <p>
          Customers of a restaurant should first contact that restaurant; we will support the restaurant in
          responding. To exercise any right, write to us at the address below.
        </p>
      </Section>

      <Section title="9. Children">
        <p>Dinora is meant for restaurant businesses. We do not knowingly collect information from children under 18.</p>
      </Section>

      <Section title="10. Changes to this policy">
        <p>
          We may update this policy from time to time. The date at the top shows when it last changed. If the changes
          are significant, we will tell you through the app or by email.
        </p>
      </Section>

      <Section title="11. Contact and grievance officer">
        <p>For questions, requests or complaints about your information, contact our grievance officer:</p>
        <p>
          <span className="font-semibold text-gray-900">{LEGAL.grievanceOfficer}</span>
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