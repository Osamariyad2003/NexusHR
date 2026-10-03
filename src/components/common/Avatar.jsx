import React, { useState } from 'react';

const initials = (name) => String(name || '?').trim().split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

/** A person's photo, or their initials when there is none on record (or it fails to load). */
export default function Avatar({ src, name, className = '' }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return <img src={src} alt={name} onError={() => setBroken(true)} className={`object-cover ${className}`} />;
  }
  return (
    <div aria-label={name} className={`flex items-center justify-center bg-emerald-100 text-emerald-800 font-black ${className}`}>
      {initials(name)}
    </div>
  );
}
