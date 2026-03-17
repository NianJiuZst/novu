import { motion } from 'motion/react';
import { cn } from '@/utils/ui';

type EmailEditorType = 'block' | 'html';

type EmailPreviewEmptyStateProps = {
  isStepResolver?: boolean;
  editorType?: EmailEditorType;
  className?: string;
};

function getEmptyStateMessage(isStepResolver?: boolean, editorType?: EmailEditorType) {
  if (isStepResolver) {
    return {
      title: 'Nothing to preview',
      description: 'Preview will appear once the step is linked.',
    };
  }

  if (editorType === 'html') {
    return {
      title: 'Nothing to preview',
      description: 'Add HTML content to see the preview.',
    };
  }

  return {
    title: 'Nothing to preview',
    description: 'Add the first block using / or generate with Copilot.',
  };
}

export function EmailPreviewEmptyState({
  isStepResolver,
  editorType,
  className,
}: EmailPreviewEmptyStateProps) {
  const { title, description } = getEmptyStateMessage(isStepResolver, editorType);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn('flex size-full flex-col items-center justify-center gap-6 px-8 py-12', className)}
    >
      <div className="flex flex-col items-center gap-[33px]">
        <div className="rounded-[8px] border border-dashed border-neutral-200 p-1">
          <div className="flex h-[38px] w-[128px] items-center justify-center rounded-[6px] border border-neutral-200 bg-white">
            <EmailIllustrationIcon />
          </div>
        </div>

        <div className="-my-[33px] h-[33px] w-px bg-neutral-200" />

        <div className="rounded-[8px] border border-neutral-200 bg-white p-1">
          <div className="flex w-[197px] flex-col overflow-hidden rounded-[6px] border border-neutral-200">
            <div className="flex items-center gap-1 border-b border-neutral-200 p-2">
              <div className="size-4 shrink-0 overflow-hidden rounded-full bg-neutral-50">
                <img
                  alt=""
                  className="size-full object-cover"
                  height={16}
                  loading="lazy"
                  src="/images/building.svg"
                  width={16}
                />
              </div>
              <div className="flex flex-col gap-[3px]">
                <div className="h-[5px] w-11 rounded-full bg-gradient-to-r from-neutral-100 to-neutral-50/75" />
                <div className="h-[5px] w-[77px] rounded-full bg-gradient-to-r from-neutral-100 to-neutral-50/75" />
              </div>
            </div>

            <div className="flex flex-col items-center bg-neutral-50 px-6 py-4">
              <div className="flex w-full flex-col gap-2.5 rounded-[6px] border border-neutral-200 bg-white p-2">
                <div className="size-3 rounded bg-gradient-to-r from-neutral-100 to-neutral-50/75" />
                <div className="h-1 w-[77px] rounded-full bg-gradient-to-r from-neutral-100 to-neutral-50/75" />
                <div className="flex flex-wrap gap-[3px]">
                  <div className="h-1 w-16 rounded-full bg-gradient-to-r from-neutral-100 to-neutral-50/75" />
                  <div className="h-1 w-8 rounded-full bg-gradient-to-r from-neutral-100 to-neutral-50/75" />
                  <div className="h-1 min-w-[20px] flex-1 rounded-full bg-gradient-to-r from-neutral-100 to-neutral-50/75" />
                  <div className="h-1 w-11 rounded-full bg-gradient-to-r from-neutral-100 to-neutral-50/75" />
                </div>
                <div className="h-1 w-6 rounded-full bg-gradient-to-r from-neutral-100 to-neutral-50/75" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-0.5 text-center">
        <p className="text-label-xs font-medium text-text-soft">{title}</p>
        <p className="text-label-xs text-text-soft">{description}</p>
      </div>
    </motion.div>
  );
}

function EmailIllustrationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 4.5C2 3.67157 2.67157 3 3.5 3H12.5C13.3284 3 14 3.67157 14 4.5V11.5C14 12.3284 13.3284 13 12.5 13H3.5C2.67157 13 2 12.3284 2 11.5V4.5Z"
        stroke="#CACFD8"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 4L8 8.5L13.5 4"
        stroke="#CACFD8"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
