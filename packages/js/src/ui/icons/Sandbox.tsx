import { JSX } from 'solid-js';

export function Sandbox(props: JSX.SvgSVGAttributes<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      {...props}
    >
      {/* Main container - represents a sandbox environment */}
      <rect x="3" y="3" width="18" height="18" rx="2" />

      {/* Sand texture - represented by small dots */}
      <circle cx="7" cy="7" r="1" fill="currentColor" />
      <circle cx="11" cy="7" r="1" fill="currentColor" />
      <circle cx="15" cy="7" r="1" fill="currentColor" />
      <circle cx="7" cy="11" r="1" fill="currentColor" />
      <circle cx="11" cy="11" r="1" fill="currentColor" />
      <circle cx="15" cy="11" r="1" fill="currentColor" />
      <circle cx="7" cy="15" r="1" fill="currentColor" />
      <circle cx="11" cy="15" r="1" fill="currentColor" />
      <circle cx="15" cy="15" r="1" fill="currentColor" />

      {/* Indicator line - represents testing/development mode */}
      <path d="M3 9h18" stroke-dasharray="2 2" />
    </svg>
  );
}
