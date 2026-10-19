import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 48, showText = false }) => {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        role="img"
        aria-label="Madhav Medical Hall Official Logo"
      >
        {/* Outer Circular Rings */}
        <circle cx="200" cy="200" r="192" stroke="#024D9C" strokeWidth="8" fill="#FFFFFF" />
        <circle cx="200" cy="200" r="182" stroke="#16A34A" strokeWidth="3" fill="none" />

        {/* Central Cross Icon */}
        <g>
          {/* Blue top and left quadrant */}
          <path
            d="M 160 50 L 240 50 A 10 10 0 0 1 250 60 L 250 110 L 300 110 A 10 10 0 0 1 310 120 L 310 200 L 250 200 L 250 200 L 150 200 L 90 200 A 10 10 0 0 1 80 190 L 80 120 A 10 10 0 0 1 90 110 L 150 110 L 150 60 A 10 10 0 0 1 160 50 Z"
            fill="#0263C7"
          />
          {/* Green right and bottom quadrant */}
          <path
            d="M 250 110 L 310 110 A 10 10 0 0 1 320 120 L 320 200 A 10 10 0 0 1 310 210 L 250 210 L 250 260 A 10 10 0 0 1 240 270 L 160 270 A 10 10 0 0 1 150 260 L 150 210 L 90 210 A 10 10 0 0 1 80 200 L 80 190 L 150 190 L 250 190 Z"
            fill="#15803D"
          />
        </g>

        {/* Mortar & Pestle in White with Leaf */}
        <g transform="translate(135, 75) scale(0.65)">
          {/* Pestle head */}
          <circle cx="100" cy="40" r="18" fill="#FFFFFF" />
          {/* Leaf on pestle */}
          <path
            d="M 105 35 C 135 20, 145 45, 125 65 C 115 50, 110 40, 105 35 Z"
            fill="#4ADE80"
          />
          {/* Pestle rod & Mortar cup */}
          <path
            d="M 100 55 C 85 85, 95 105, 100 135 C 105 105, 115 85, 100 55 Z"
            fill="#FFFFFF"
          />
          <path
            d="M 50 105 C 50 160, 150 160, 150 105 Z"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Caduceus / Snake Vine motif */}
          <path
            d="M 98 120 C 70 145, 60 185, 100 210 C 130 190, 85 170, 102 145"
            stroke="#22C55E"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          {/* Base of mortar */}
          <path
            d="M 75 220 L 125 220"
            stroke="#FFFFFF"
            strokeWidth="12"
            strokeLinecap="round"
          />
        </g>

        {/* Text MADHAV */}
        <text
          x="200"
          y="245"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="48"
          fill="#0A3663"
          letterSpacing="1"
        >
          MADHAV
        </text>

        {/* Text MEDICAL HALL */}
        <text
          x="200"
          y="288"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="36"
          fill="#0D7A3E"
          letterSpacing="1"
        >
          MEDICAL HALL
        </text>

        {/* Hindi Tagline */}
        <text
          x="200"
          y="318"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          fontSize="15"
          fill="#0F172A"
        >
          — आपके स्वास्थ्य का भरोसेमंद साथी —
        </text>

        {/* Bottom Leaves and Dual-Color Capsule */}
        <g transform="translate(140, 328) scale(0.6)">
          {/* Left Leaf */}
          <path
            d="M 30 50 C -10 30, 0 80, 45 65 C 35 55, 30 50, 30 50 Z"
            fill="#16A34A"
          />
          {/* Right Leaf */}
          <path
            d="M 170 50 C 210 30, 200 80, 155 65 C 165 55, 170 50, 170 50 Z"
            fill="#16A34A"
          />
          {/* Capsule tilted at center */}
          <g transform="translate(100, 58) rotate(-35)">
            {/* Green half */}
            <path
              d="M -30 -14 L 0 -14 A 14 14 0 0 1 0 14 L -30 14 A 14 14 0 0 1 -30 -14 Z"
              fill="#16A34A"
            />
            {/* Blue half */}
            <path
              d="M 0 -14 L 30 -14 A 14 14 0 0 1 30 14 L 0 14 A 14 14 0 0 1 0 -14 Z"
              fill="#0263C7"
            />
          </g>
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col text-left">
          <span className="font-extrabold tracking-tight text-blue-900 dark:text-blue-400 text-lg leading-tight">
            MADHAV MEDICAL HALL
          </span>
          <span className="text-xs text-green-700 dark:text-green-400 font-medium">
            चनमन, बहेड़ी (दरभंगा) • 847101
          </span>
        </div>
      )}
    </div>
  );
};
