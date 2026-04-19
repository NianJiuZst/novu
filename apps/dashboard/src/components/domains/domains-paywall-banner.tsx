import { useId } from 'react';
import { RiBookMarkedLine, RiSparkling2Line } from 'react-icons/ri';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/primitives/button';
import { LinkButton } from '@/components/primitives/button-link';
import { ROUTES } from '@/utils/routes';
import { openInNewTab } from '@/utils/url';
import { IS_SELF_HOSTED, SELF_HOSTED_UPGRADE_REDIRECT_URL } from '../../config';
import { useTelemetry } from '../../hooks/use-telemetry';
import { TelemetryEvent } from '../../utils/telemetry';

export function DomainsPaywallBanner() {
  const track = useTelemetry();
  const navigate = useNavigate();

  return (
    <div className="bg-bg-weak mx-2.5 mb-2 flex items-center gap-6 overflow-hidden rounded-xl p-3">
      <div className="bg-bg-white flex shrink-0 items-center justify-center self-stretch rounded-xl p-6">
        <DomainsIllustrationSvg />
      </div>

      <div className="flex flex-col gap-8 self-stretch py-3">
        <div className="flex flex-col gap-2">
          <p className="text-label-md text-foreground-900 font-medium">Need more domains?</p>
          <p className="text-label-sm text-text-soft max-w-[500px]">
            Create additional domains to test, stage, or experiment without affecting your live systems.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            mode="gradient"
            size="xs"
            onClick={() => {
              track(TelemetryEvent.UPGRADE_TO_TEAM_TIER_CLICK, {
                source: 'domains-page',
              });

              if (IS_SELF_HOSTED) {
                openInNewTab(SELF_HOSTED_UPGRADE_REDIRECT_URL + '?utm_campaign=domains');
              } else {
                navigate(ROUTES.SETTINGS_BILLING);
              }
            }}
            leadingIcon={RiSparkling2Line}
          >
            {IS_SELF_HOSTED ? 'Contact Sales' : 'Upgrade to Team Tier'}
          </Button>

          <Link to="https://docs.novu.co/platform/domains" target="_blank" rel="noreferrer noopener">
            <LinkButton size="sm" leadingIcon={RiBookMarkedLine}>
              How does this help?
            </LinkButton>
          </Link>
        </div>
      </div>
    </div>
  );
}

function DomainsIllustrationSvg() {
  const id = useId();
  const g = (name: string) => `${id}-${name}`;

  return (
    <svg width="325" height="111" viewBox="0 0 325 111" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left dashed connector lines */}
      <path
        d="M90 93H67.794C67.2636 93 66.7549 92.7893 66.3798 92.4142C66.0047 92.0391 65.794 91.5304 65.794 91V59C65.794 58.4696 65.5833 57.9609 65.2082 57.5858C64.8331 57.2107 64.3244 57 63.794 57H47"
        stroke="#BCC3CE"
        strokeWidth="0.5"
        strokeLinejoin="round"
        strokeDasharray="4 4"
      />
      <path
        d="M90 93H67.794C67.2636 93 66.7549 92.7893 66.3798 92.4142C66.0047 92.0391 65.794 91.5304 65.794 91V59C65.794 58.4696 65.5833 57.9609 65.2082 57.5858C64.8331 57.2107 64.3244 57 63.794 57H47"
        stroke={`url(#${g('p0')})`}
        strokeWidth="0.5"
        strokeLinejoin="round"
        strokeDasharray="4 4"
      />

      {/* Right dashed connector lines */}
      <path
        d="M235 93H262.207C262.737 93 263.246 92.7893 263.621 92.4142C263.996 92.0391 264.207 91.5304 264.207 91V59C264.207 58.4696 264.418 57.9609 264.793 57.5858C265.168 57.2107 265.677 57 266.207 57"
        stroke={`url(#${g('p1')})`}
        strokeWidth="0.5"
        strokeLinejoin="round"
        strokeDasharray="4 4"
      />

      {/* Top-left red dashed line */}
      <path
        d="M90 21H67.794C67.2636 21 66.7549 21.2107 66.3798 21.5858C66.0047 21.9609 65.794 22.4696 65.794 23V55C65.794 55.5304 65.5833 56.0391 65.2082 56.4142C64.8331 56.7893 64.3244 57 63.794 57H47"
        stroke="#DD2450"
        strokeWidth="0.5"
        strokeLinejoin="round"
        strokeDasharray="4 4"
      />

      {/* Top-right red dashed line */}
      <path
        d="M278 57H266.794C266.264 57 265.755 56.7893 265.38 56.4142C265.005 56.0391 264.794 55.5304 264.794 55V23C264.794 22.4696 264.583 21.9609 264.208 21.5858C263.833 21.2107 263.324 21 262.794 21H235"
        stroke="#DD2450"
        strokeWidth="0.5"
        strokeLinejoin="round"
        strokeDasharray="4 4"
      />

      {/* Right notification card (pink border) */}
      <rect x="283.375" y="36.375" width="41.25" height="41.25" rx="7.625" stroke="#DD2450" strokeWidth="0.75" />
      <rect x="287" y="40" width="34" height="34" rx="6" fill="white" />
      <rect
        x="287.375"
        y="40.375"
        width="33.25"
        height="33.25"
        rx="5.625"
        stroke="#FB3748"
        strokeOpacity="0.24"
        strokeWidth="0.75"
      />
      {/* Bell icon */}
      <path
        d="M303.359 52.9L303.37 52.897V52.886V52.5C303.37 52.152 303.652 51.871 304 51.871C304.348 51.871 304.629 52.152 304.629 52.5V52.886V52.897L304.64 52.9C306.1 53.195 307.2 54.488 307.2 56.036V56.413C307.2 57.363 307.549 58.276 308.178 58.986L308.327 59.153C308.492 59.337 308.533 59.603 308.431 59.829C308.329 60.055 308.104 60.201 307.857 60.201H300.142C299.895 60.201 299.669 60.055 299.568 59.829C299.468 59.603 299.507 59.337 299.672 59.153L299.821 58.986C300.45 58.276 300.799 57.361 300.799 56.413V56.036C300.799 54.488 301.899 53.195 303.359 52.9ZM305.272 60.871C305.268 61.204 305.135 61.522 304.9 61.757C304.661 61.996 304.337 62.129 304 62.129C303.662 62.129 303.338 61.996 303.099 61.757C302.864 61.522 302.731 61.204 302.728 60.871H304H305.272Z"
        fill="#DD2450"
        stroke="#DD2450"
        strokeWidth="0.027"
      />

      {/* Left Novu card (pink border) */}
      <rect x="0.375" y="36.375" width="41.25" height="41.25" rx="7.625" stroke="#DD2450" strokeWidth="0.75" />
      <rect x="4" y="40" width="34" height="34" rx="6" fill="white" />
      <rect
        x="4.375"
        y="40.375"
        width="33.25"
        height="33.25"
        rx="5.625"
        stroke="#FB3748"
        strokeOpacity="0.24"
        strokeWidth="0.75"
      />
      {/* Novu logo */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24.24 55.81C24.24 56.132 23.849 56.292 23.623 56.061L19.003 51.34C19.645 51.114 20.32 50.999 21 51C22.194 51 23.306 51.349 24.24 51.949V55.81ZM25.92 53.565V55.81C25.92 57.638 23.7 58.543 22.422 57.236L17.454 52.159C15.966 53.251 15 55.013 15 57C15 58.278 15.399 59.462 16.08 60.435V58.202C16.08 56.374 18.3 55.469 19.578 56.776L24.539 61.846C26.031 60.754 27 58.99 27 57C27 55.722 26.601 54.538 25.92 53.565ZM18.377 57.951L22.988 62.663C22.366 62.881 21.697 63 21 63C19.807 63 18.695 62.651 17.76 62.051V58.202C17.76 57.88 18.152 57.72 18.377 57.951Z"
        fill={`url(#${g('p2')})`}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24.24 55.81C24.24 56.132 23.849 56.292 23.623 56.061L19.003 51.34C19.645 51.114 20.32 50.999 21 51C22.194 51 23.306 51.349 24.24 51.949V55.81ZM25.92 53.565V55.81C25.92 57.638 23.7 58.543 22.422 57.236L17.454 52.159C15.966 53.251 15 55.013 15 57C15 58.278 15.399 59.462 16.08 60.435V58.202C16.08 56.374 18.3 55.469 19.578 56.776L24.539 61.846C26.031 60.754 27 58.99 27 57C27 55.722 26.601 54.538 25.92 53.565ZM18.377 57.951L22.988 62.663C22.366 62.881 21.697 63 21 63C19.807 63 18.695 62.651 17.76 62.051V58.202C17.76 57.88 18.152 57.72 18.377 57.951Z"
        fill={`url(#${g('p3')})`}
      />

      {/* DEV card */}
      <rect x="94.375" y="0.375" width="60.767" height="41.25" rx="7.625" stroke="#E1E4EA" strokeWidth="0.75" />
      <rect x="98.375" y="4.375" width="52.767" height="33.25" rx="5.625" fill="white" />
      <rect x="98.375" y="4.375" width="52.767" height="33.25" rx="5.625" stroke="#F2F5F8" strokeWidth="0.75" />
      {/* DB icon */}
      <path
        d="M112.973 21.188C112.973 21.305 113.189 21.509 113.691 21.71C114.341 21.969 115.262 22.125 116.259 22.125C117.255 22.125 118.177 21.969 118.826 21.71C119.328 21.509 119.544 21.305 119.544 21.188V20.373C118.77 20.756 117.586 21 116.259 21C114.932 21 113.747 20.756 112.973 20.373V21.188ZM119.544 22.248C118.77 22.631 117.586 22.875 116.259 22.875C114.932 22.875 113.747 22.631 112.973 22.248V23.063C112.973 23.18 113.189 23.384 113.691 23.585C114.341 23.844 115.262 24 116.259 24C117.255 24 118.177 23.844 118.826 23.585C119.328 23.384 119.544 23.18 119.544 23.063V22.248ZM112.034 23.063V19.313C112.034 18.381 113.926 17.625 116.259 17.625C118.592 17.625 120.483 18.381 120.483 19.313V23.063C120.483 23.994 118.592 24.75 116.259 24.75C113.926 24.75 112.034 23.994 112.034 23.063ZM116.259 20.25C117.255 20.25 118.177 20.094 118.826 19.835C119.328 19.634 119.544 19.43 119.544 19.313C119.544 19.195 119.328 18.991 118.826 18.79C118.177 18.531 117.255 18.375 116.259 18.375C115.262 18.375 114.341 18.531 113.691 18.79C113.189 18.991 112.973 19.195 112.973 19.313C112.973 19.43 113.189 19.634 113.691 19.835C114.341 20.094 115.262 20.25 116.259 20.25Z"
        fill="#FF8447"
      />
      {/* DEV text */}
      <text x="126" y="23" fontFamily="JetBrains Mono, monospace" fontSize="8" fontWeight="500" fill="#FF8447">
        DEV
      </text>

      {/* PROD card */}
      <rect x="164.892" y="0.375" width="65.767" height="41.25" rx="7.625" stroke="#E1E4EA" strokeWidth="0.75" />
      <rect x="168.892" y="4.375" width="57.767" height="33.25" rx="5.625" fill="white" />
      <rect x="168.892" y="4.375" width="57.767" height="33.25" rx="5.625" stroke="#F2F5F8" strokeWidth="0.75" />
      {/* DB icon */}
      <path
        d="M183.49 21.188C183.49 21.305 183.706 21.509 184.208 21.71C184.858 21.969 185.779 22.125 186.776 22.125C187.772 22.125 188.694 21.969 189.343 21.71C189.845 21.509 190.062 21.305 190.062 21.188V20.373C189.287 20.756 188.103 21 186.776 21C185.449 21 184.265 20.756 183.49 20.373V21.188ZM190.062 22.248C189.287 22.631 188.103 22.875 186.776 22.875C185.449 22.875 184.265 22.631 183.49 22.248V23.063C183.49 23.18 183.706 23.384 184.208 23.585C184.858 23.844 185.779 24 186.776 24C187.772 24 188.694 23.844 189.343 23.585C189.845 23.384 190.062 23.18 190.062 23.063V22.248ZM182.551 23.063V19.313C182.551 18.381 184.443 17.625 186.776 17.625C189.109 17.625 191 18.381 191 19.313V23.063C191 23.994 189.109 24.75 186.776 24.75C184.443 24.75 182.551 23.994 182.551 23.063ZM186.776 20.25C187.772 20.25 188.694 20.094 189.343 19.835C189.845 19.634 190.062 19.43 190.062 19.313C190.062 19.195 189.845 18.991 189.343 18.79C188.694 18.531 187.772 18.375 186.776 18.375C185.779 18.375 184.858 18.531 184.208 18.79C183.706 18.991 183.49 19.195 183.49 19.313C183.49 19.43 183.706 19.634 184.208 19.835C184.858 20.094 185.779 20.25 186.776 20.25Z"
        fill="#7D52F4"
      />
      {/* PROD text */}
      <text x="194" y="23" fontFamily="JetBrains Mono, monospace" fontSize="8" fontWeight="500" fill="#7D52F4">
        PROD
      </text>

      {/* Bottom staging cards */}
      <rect x="90.375" y="69.375" width="144.305" height="41.25" rx="7.625" stroke="#E1E4EA" strokeWidth="0.75" />
      <rect x="94.375" y="73.375" width="136.305" height="33.25" rx="5.625" fill="white" />
      <rect x="94.375" y="73.375" width="136.305" height="33.25" rx="5.625" stroke="#F2F5F8" strokeWidth="0.75" />
      {/* DB icon for staging */}
      <path
        d="M108.973 90.188C108.973 90.305 109.189 90.509 109.691 90.71C110.341 90.969 111.262 91.125 112.259 91.125C113.255 91.125 114.177 90.969 114.826 90.71C115.328 90.509 115.544 90.305 115.544 90.188V89.373C114.77 89.756 113.586 90 112.259 90C110.932 90 109.747 89.756 108.973 89.373V90.188ZM115.544 91.248C114.77 91.631 113.586 91.875 112.259 91.875C110.932 91.875 109.747 91.631 108.973 91.248V92.063C108.973 92.18 109.189 92.384 109.691 92.585C110.341 92.844 111.262 93 112.259 93C113.255 93 114.177 92.844 114.826 92.585C115.328 92.384 115.544 92.18 115.544 92.063V91.248ZM108.034 92.063V88.313C108.034 87.381 109.926 86.625 112.259 86.625C114.592 86.625 116.483 87.381 116.483 88.313V92.063C116.483 92.994 114.592 93.75 112.259 93.75C109.926 93.75 108.034 92.994 108.034 92.063ZM112.259 89.25C113.255 89.25 114.177 89.094 114.826 88.835C115.328 88.634 115.544 88.43 115.544 88.313C115.544 88.195 115.328 87.991 114.826 87.79C114.177 87.531 113.255 87.375 112.259 87.375C111.262 87.375 110.341 87.531 109.691 87.79C109.189 87.991 108.973 88.195 108.973 88.313C108.973 88.43 109.189 88.634 109.691 88.835C110.341 89.094 111.262 89.25 112.259 89.25Z"
        fill="#CACFD8"
      />
      {/* EXP QA STAG text */}
      <text x="120" y="92" fontFamily="JetBrains Mono, monospace" fontSize="8" fontWeight="500" fill="#CACFD8">
        EXP1
      </text>
      <text x="142" y="92" fontFamily="JetBrains Mono, monospace" fontSize="9" fontWeight="500" fill="#CACFD8">
        QA
      </text>
      <text x="158" y="92" fontFamily="JetBrains Mono, monospace" fontSize="8" fontWeight="500" fill="#CACFD8">
        STAG
      </text>
      {/* Fade overlays */}
      <rect x="95" y="78" width="134" height="25" fill={`url(#${g('p4')})`} />
      <rect x="95" y="78" width="134" height="25" fill={`url(#${g('p5')})`} />

      <defs>
        <linearGradient id={g('p0')} x1="50.59" y1="84.5" x2="79.44" y2="110.52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BCC3CE" />
          <stop offset="0.759" stopColor="white" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={g('p1')} x1="266" y1="82.5" x2="220" y2="94" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BCC3CE" />
          <stop offset="1" stopColor="white" stopOpacity="0.5" />
        </linearGradient>
        <radialGradient
          id={g('p2')}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(21 57) rotate(135) scale(8.485)"
        >
          <stop offset="0.34" stopColor="#FF006A" />
          <stop offset="0.613" stopColor="#E300BD" />
          <stop offset="0.767" stopColor="#FF4CE1" />
        </radialGradient>
        <linearGradient id={g('p3')} x1="22.4" y1="51.1" x2="21" y2="63.5" gradientUnits="userSpaceOnUse">
          <stop offset="0.085" stopColor="#FFBA33" />
          <stop offset="0.553" stopColor="#FF006A" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={g('p4')} x1="95" y1="91" x2="236.225" y2="91" gradientUnits="userSpaceOnUse">
          <stop offset="0.05" stopColor="white" />
          <stop offset="0.505" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={g('p5')} x1="64" y1="91" x2="263.5" y2="91" gradientUnits="userSpaceOnUse">
          <stop offset="0.505" stopColor="white" stopOpacity="0" />
          <stop offset="0.85" stopColor="white" />
        </linearGradient>
      </defs>
    </svg>
  );
}
