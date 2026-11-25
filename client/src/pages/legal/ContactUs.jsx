import { Mail, Phone, MapPin, Clock } from "lucide-react";
import LegalLayout from "./LegalLayout";
import { LEGAL } from "../../config/legal";

const ROWS = [
  { icon: Mail, label: "Email", value: LEGAL.supportEmail, href: `mailto:${LEGAL.supportEmail}` },
  { icon: Phone, label: "Phone", value: LEGAL.supportPhone, href: `tel:${LEGAL.supportPhone.replace(/\s/g, "")}` },
  { icon: MapPin, label: "Address", value: LEGAL.address },
  { icon: Clock, label: "Support hours", value: "Monday to Saturday, 10:00 AM to 7:00 PM IST" },
];

export default function ContactUs() {
  return (
    <LegalLayout
      title="Contact Us"
      showDate={false}
      intro="Questions about Dinora, your account, a payment or a refund? Reach us any of these ways and we will get back to you within 2 working days."
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {ROWS.map(({ icon: Icon, label, value, href }) => (
          <div key={label} className="rounded-2xl border border-gray-200 p-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</div>
            {href ? (
              <a href={href} className="mt-1 block font-semibold text-gray-900 hover:text-blue-600 wrap-break-word">
                {value}
              </a>
            ) : (
              <div className="mt-1 font-semibold text-gray-900">{value}</div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-8 text-gray-600 leading-relaxed">
        Want to see Dinora in action first? Go back to the home page and tap <span className="font-semibold">Book a demo</span>,
        and we will call you.
      </p>
    </LegalLayout>
  );
}