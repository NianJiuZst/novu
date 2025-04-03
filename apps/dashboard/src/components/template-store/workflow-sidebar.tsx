import { useTelemetry } from '@/hooks/use-telemetry';
import { TelemetryEvent } from '@/utils/telemetry';
import { Calendar, Code2, ExternalLink, FileCode2, FileText, KeyRound, LayoutGrid, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { ReactNode, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { buildRoute, ROUTES } from '../../utils/routes';
import { Badge } from '../primitives/badge';
import { WorkflowMode } from './types';

function StripeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 20 20"
      fill="none"
      className="text-gray-700"
    >
      <path
        d="M1.79497 3.98005C1.25 5.04961 1.25 6.44974 1.25 9.25V10.75C1.25 13.5503 1.25 14.9504 1.79497 16.02C2.27433 16.9608 3.03924 17.7257 3.98005 18.205C5.04961 18.75 6.44974 18.75 9.25 18.75H10.75C13.5503 18.75 14.9504 18.75 16.02 18.205C16.9608 17.7257 17.7257 16.9608 18.205 16.02C18.75 14.9504 18.75 13.5503 18.75 10.75V9.25C18.75 6.44974 18.75 5.04961 18.205 3.98005C17.7257 3.03924 16.9608 2.27433 16.02 1.79497C14.9504 1.25 13.5503 1.25 10.75 1.25H9.25C6.44974 1.25 5.04961 1.25 3.98005 1.79497C3.03924 2.27433 2.27433 3.03924 1.79497 3.98005Z"
        fill="url(#paint0_linear_14649_553430)"
      />
      <path
        d="M1.41576 5.1744C1.25 6.11645 1.25 7.36643 1.25 9.24967V10.7497C1.25 13.5499 1.25 14.9501 1.79497 16.0196C2.27433 16.9604 3.03924 17.7253 3.98005 18.2047C5.04961 18.7497 6.44974 18.7497 9.25 18.7497H10.75C13.5503 18.7497 14.9504 18.7497 16.02 18.2047C16.9608 17.7253 17.7257 16.9604 18.205 16.0196C18.75 14.9501 18.75 13.5499 18.75 10.7497V9.24967C18.75 6.4494 18.75 5.04927 18.205 3.97971C17.7423 3.07164 17.0136 2.32744 16.1175 1.8457L1.41576 5.1744Z"
        fill="url(#paint1_linear_14649_553430)"
      />
      <path
        d="M18.569 14.9092C18.4886 15.3315 18.3726 15.6916 18.205 16.0203C17.7257 16.9612 16.9608 17.7261 16.02 18.2054C14.9824 18.7341 13.6338 18.7499 10.9977 18.7504H10.0366V16.7734L18.569 14.9092Z"
        fill="url(#paint2_linear_14649_553430)"
      />
      <path
        d="M10.75 1.25H9.24999C8.7052 1.25 8.2134 1.25 7.76672 1.25401V3.73157L16.1159 1.84516C16.0841 1.8281 16.0521 1.81136 16.0199 1.79497C15.4262 1.49243 14.7305 1.35784 13.75 1.29797C12.9643 1.25 11.9957 1.25 10.75 1.25Z"
        fill="url(#paint3_linear_14649_553430)"
      />
      <path
        d="M18.75 10.858C18.7499 12.7365 18.7466 13.9747 18.5689 14.9084L15.6014 15.5568V11.1346L18.75 10.4023V10.858Z"
        fill="url(#paint4_linear_14649_553430)"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M9.33813 8.36143C9.33813 7.95976 9.66653 7.80527 10.2105 7.80527C10.9904 7.80527 11.9756 8.04215 12.7556 8.46442V6.04408C11.9038 5.7042 11.0622 5.57031 10.2105 5.57031C8.12715 5.57031 6.7417 6.66204 6.7417 8.48502C6.7417 11.3276 10.6415 10.8745 10.6415 12.1001C10.6415 12.5739 10.231 12.7283 9.65627 12.7283C8.80448 12.7283 7.71664 12.3782 6.85459 11.9044V14.3556C7.80901 14.7676 8.77369 14.9427 9.65627 14.9427C11.7909 14.9427 13.2584 13.8819 13.2584 12.0383C13.2482 8.96909 9.33813 9.51495 9.33813 8.36143Z"
        fill="white"
      />
      <defs>
        <linearGradient
          id="paint0_linear_14649_553430"
          x1="1.25"
          y1="1.25"
          x2="6.99791"
          y2="5.31381"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#392993" />
          <stop offset="1" stop-color="#4B47B9" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_14649_553430"
          x1="1.909"
          y1="5.35871"
          x2="14.5979"
          y2="15.8253"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#594BB9" />
          <stop offset="1" stop-color="#60A8F2" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_14649_553430"
          x1="10.0366"
          y1="16.8466"
          x2="18.75"
          y2="18.7504"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#61A2EF" />
          <stop offset="1" stop-color="#58E6FD" />
        </linearGradient>
        <linearGradient
          id="paint3_linear_14649_553430"
          x1="7.76672"
          y1="2.49477"
          x2="18.75"
          y2="1.25"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#534EBE" />
          <stop offset="1" stop-color="#6875E2" />
        </linearGradient>
        <linearGradient
          id="paint4_linear_14649_553430"
          x1="15.6014"
          y1="11.1712"
          x2="18.75"
          y2="14.9421"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#71A5F3" />
          <stop offset="1" stop-color="#6CC3FA" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface SidebarButtonProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
  bgColor?: string;
  hasExternalLink?: boolean;
  beta?: boolean;
  hasSubmenu?: boolean;
  isSubmenuOpen?: boolean;
  isSubmenuItem?: boolean;
}

const buttonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.01 },
  tap: { scale: 0.99 },
};

const iconVariants = {
  initial: { rotate: 0 },
  hover: { rotate: 5 },
};

function SidebarButton({
  icon,
  label,
  onClick,
  isActive,
  bgColor = 'bg-blue-50',
  beta,
  hasExternalLink,
  hasSubmenu,
  isSubmenuOpen,
  isSubmenuItem,
}: SidebarButtonProps) {
  const content = (
    <div className="flex items-center gap-3">
      <motion.div variants={iconVariants} className={`rounded-lg p-[5px] ${bgColor}`}>
        {icon}
      </motion.div>
      <span className="text-label-sm text-strong-950">{label}</span>
      {hasExternalLink && (
        <motion.div whileHover={{ x: 2 }} transition={{ type: 'spring', stiffness: 300 }} className="ml-auto">
          <ExternalLink className="text-foreground-600 h-3 w-3" />
        </motion.div>
      )}
    </div>
  );

  return (
    <motion.button
      variants={buttonVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-xl border border-transparent p-1.5 transition-colors hover:cursor-pointer hover:bg-gray-100 ${
        isActive ? '!border-[#EEEFF1] bg-white' : ''
      } ${isSubmenuItem ? '' : ''}`}
    >
      <div className="flex w-full items-center gap-2">
        {content}{' '}
        {beta && (
          <Badge color="gray" size="sm">
            BETA
          </Badge>
        )}
      </div>
    </motion.button>
  );
}

const useCases = [
  {
    id: 'popular',
    icon: <LayoutGrid className="h-3 w-3 text-gray-700" />,
    label: 'Popular',
    bgColor: 'bg-blue-50',
    hasSubmenu: false,
  },
  {
    id: 'billing',
    icon: <Calendar className="h-3 w-3 text-gray-700" />,
    label: 'Billing',
    bgColor: 'bg-blue-50',
    hasSubmenu: true,
  },
  {
    id: 'authentication',
    icon: <KeyRound className="h-3 w-3 text-gray-700" />,
    label: 'Authentication',
    bgColor: 'bg-green-50',
    hasSubmenu: false,
  },
  {
    id: 'operational',
    icon: <Users className="h-3 w-3 text-gray-700" />,
    label: 'Operational',
    bgColor: 'bg-purple-50',
    hasSubmenu: false,
  },
] as const;

interface WorkflowSidebarProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  mode: WorkflowMode;
}

export function WorkflowSidebar({ selectedCategory, onCategorySelect, mode }: WorkflowSidebarProps) {
  const navigate = useNavigate();
  const { environmentSlug } = useParams();
  const track = useTelemetry();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const handleCreateWorkflow = () => {
    track(TelemetryEvent.CREATE_WORKFLOW_CLICK);
    navigate(buildRoute(ROUTES.WORKFLOWS_CREATE, { environmentSlug: environmentSlug || '' }));
  };

  const handleCategorySelect = (categoryId: string) => {
    if (categoryId === 'billing') {
      setOpenSubmenu(openSubmenu === 'billing' ? null : 'billing');
      onCategorySelect('billing');
    } else {
      setOpenSubmenu(null);
      onCategorySelect(categoryId);
    }
  };

  const createOptions = [
    {
      icon: <FileText className="h-3 w-3 text-gray-700" />,
      label: 'Blank workflow',
      bgColor: 'bg-green-50',
      onClick: handleCreateWorkflow,
    },
    {
      icon: <Code2 className="h-3 w-3 text-gray-700" />,
      label: 'Code-based workflow',
      hasExternalLink: true,
      bgColor: 'bg-blue-50',
      onClick: () => window.open('https://docs.novu.co/framework/overview', '_blank'),
    },
  ];

  return (
    <div className="bg-bg-weak flex h-full w-[240px] flex-col gap-4 border-r p-2">
      <div className="flex flex-col gap-1">
        {createOptions.map((item, index) => (
          <SidebarButton
            key={index}
            icon={item.icon}
            label={item.label}
            onClick={item.onClick}
            bgColor={item.bgColor}
            hasExternalLink={item.hasExternalLink}
          />
        ))}
      </div>
      <section className="p-2">
        <div className="mb-2">
          <span className="text-subheading-2xs text-gray-500">EXPLORE</span>
        </div>

        <div className="flex flex-col gap-2">
          {useCases.map((item) => (
            <div key={item.id} className="flex flex-col">
              <SidebarButton
                key={item.id}
                icon={item.icon}
                label={item.label}
                onClick={() => handleCategorySelect(item.id)}
                isActive={mode === WorkflowMode.TEMPLATES && selectedCategory === item.id}
                bgColor={item.bgColor}
                hasSubmenu={item.hasSubmenu}
                isSubmenuOpen={openSubmenu === item.id}
              />
              {item.id === 'billing' && openSubmenu === 'billing' && (
                <div className="ml-4 mt-1 border-l-2 border-gray-100 pl-2">
                  <SidebarButton
                    key="stripe"
                    icon={<StripeIcon />}
                    label="Stripe"
                    onClick={() => onCategorySelect('stripe')}
                    isActive={mode === WorkflowMode.TEMPLATES && selectedCategory === 'stripe'}
                    bgColor="bg-blue-50"
                    isSubmenuItem
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-auto p-3">
        <motion.div
          variants={buttonVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          className="border-stroke-soft flex flex-col items-start rounded-xl border bg-white p-3 hover:cursor-pointer"
          onClick={() => window.open('https://docs.novu.co/platform/workflow/overview', '_blank')}
        >
          <div className="mb-1 flex items-center gap-1.5">
            <motion.div variants={iconVariants} className="rounded-lg bg-gray-50 p-1.5">
              <FileCode2 className="h-3 w-3 text-gray-700" />
            </motion.div>
            <span className="text-label-sm text-strong-950">Documentation</span>
          </div>

          <p className="text-paragraph-xs text-neutral-400">Find out more about how to best setup workflows</p>
        </motion.div>
      </div>
    </div>
  );
}

export { StripeIcon };
