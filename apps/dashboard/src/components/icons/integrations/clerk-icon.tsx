interface ClerkIconProps {
  className?: string;
  width?: number;
  height?: number;
}

export function ClerkIcon({ className = '', width = 20, height = 20 }: ClerkIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <rect width="20" height="20" rx="4" fill="#6C47FF" />
      <path
        d="M10 4.5C6.96243 4.5 4.5 6.96243 4.5 10C4.5 13.0376 6.96243 15.5 10 15.5C13.0376 15.5 15.5 13.0376 15.5 10C15.5 6.96243 13.0376 4.5 10 4.5ZM7 8.5C7 7.67157 7.67157 7 8.5 7C9.32843 7 10 7.67157 10 8.5C10 9.32843 9.32843 10 8.5 10C7.67157 10 7 9.32843 7 8.5ZM10 13.5C8.067 13.5 6.5 11.933 6.5 10C6.5 9.17157 7.17157 8.5 8 8.5C8.82843 8.5 9.5 9.17157 9.5 10C9.5 10.8284 10.1716 11.5 11 11.5C11.8284 11.5 12.5 10.8284 12.5 10C12.5 9.17157 13.1716 8.5 14 8.5C14.8284 8.5 15.5 9.17157 15.5 10C15.5 11.933 13.933 13.5 12 13.5H10Z"
        fill="white"
      />
    </svg>
  );
}
