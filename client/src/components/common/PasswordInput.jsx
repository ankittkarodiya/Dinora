import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Drop-in replacement for a plain <input type="password">.
// Renders an eye icon on the right that toggles visibility.
// Accepts every prop a normal <input> would — value, onChange, placeholder,
// className, onKeyDown, etc. — and passes them straight through.
export default function PasswordInput({ className = "", ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${className} pr-11`} // reserve space on the right for the icon
      />
      <button
        type="button" // ← critical: prevents this from submitting any surrounding <form>
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1} // don't steal tab focus away from the actual input
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}