import React from 'react';

export function BrandLogo({ size = 32 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Oprino Logo"
      >
        <rect width="32" height="32" rx="8" fill="#0F172A" />
        <path
          d="M16 6C11.58 6 8 9.58 8 14C8 19.5 16 26 16 26C16 26 24 19.5 24 14C24 9.58 20.42 6 16 6ZM14.2 18.2L10.8 14.8L12.2 13.4L14.2 15.4L19.8 9.8L21.2 11.2L14.2 18.2Z"
          fill="url(#paint0_linear)"
        />
        <defs>
          <linearGradient
            id="paint0_linear"
            x1="8"
            y1="6"
            x2="24"
            y2="26"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#164CFF" />
            <stop offset="0.5" stopColor="#087DE5" />
            <stop offset="1" stopColor="#20BAAA" />
          </linearGradient>
        </defs>
      </svg>
      <span
        style={{
          fontFamily: 'var(--oprino-font-display, "Outfit", sans-serif)',
          fontSize: `${size * 0.65}px`,
          fontWeight: 800,
          color: '#0F172A',
          letterSpacing: '-0.03em',
        }}
      >
        oprino
      </span>
    </div>
  );
}
