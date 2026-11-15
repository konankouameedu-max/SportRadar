"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export function PasswordInput({ invalid, className = "", ...rest }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" aria-hidden />
      <input {...rest} type={show ? "text" : "password"} className={`input pl-10 pr-10 ${invalid ? "input-error" : ""} ${className}`} aria-invalid={invalid} />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700" aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
