import { IconType-icons';react-icons
import { RiArrowLeftSLine, RiMailCloseLinewLeftSLinreact-iconsorict-icons/ri';
import { RxCrossCircledircled } react-iconsrrx
import { Avatar, AvatarFallbackAvatarFal@/components/primitives/avatarm '@/components/primitives/avatar';
import { Buttontives/but@/componentsprimitives/button
import { Skeletonm '@/comp@/components/primitivesiskeletonves/skeleton';

type EmailStatePreviewProps = {
  variant: 'loading' | 'error';
  message: string;
  onBackToPrompt?: () => void;
};

export function EmailStatePreview({ variant, message, onBackToPrompt }: EmailStatePreviewProps) {
  const Icon: IconType = variant === 'error' ? RxCrossCircled : RiMailCloseLine;
  const iconColorClass = variant === 'error' ? 'text-error-base' : 'text-text-disabled';

  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-hidden p-8">
      <div className="flex w-full max-w-4xl flex-col gap-6">
        <div className="overflow-hidden rounded-lg border border-stroke-weak bg-white shadow-xs">
          {/* Email Header */}
          <div className="flex flex-col gap-2 border-b border-stroke-weak p-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarFallback>
                  <Skeleton className="size-full rounded-full" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium text-text-strong">Acme Inc.</span>
                    <span className="text-xs text-text-sub">&lt;noreply@novu.co&gt;</span>
                  </div>
                </div>
                <span className="text-xs text-text-sub">to me</span>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="border-b border-stroke-weak px-3 py-2">
            <span className="text-base font-medium text-text-soft">Subject</span>
          </div>

          {/* Body with skeleton content */}
          <div className="flex min-h-[406px] flex-col items-center justify-center bg-bg-weak p-8">
            <div className="flex w-full max-w-[412px] flex-col items-center gap-8">
              {/* Logo placeholder */}
              <div className="flex h-[46px] w-[136px] items-start rounded-lg border border-dashed border-stroke-soft p-1">
                <div className="flex flex-1 items-center justify-center rounded-md border border-stroke-soft bg-white p-3">
                  <Icon className={`size-${variant === 'error' ? '3' : '4'} ${iconColorClass}`} />
                </div>
              </div>

              {/* Notification card skeleton */}
              <div className="flex flex-col rounded-lg border border-stroke-soft p-1">
                <div className="w-[197px] overflow-hidden rounded-md border border-stroke-soft bg-white">
                  {/* Card header */}
                  <div className="flex items-center gap-1 border-b border-stroke-soft p-2">
                    <Avatar className="size-4">
                      <AvatarFallback>
                        <Skeleton className="size-full rounded-full" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                      <Skeleton className="h-[5px] w-[44px] rounded-full" />
                      <Skeleton className="h-[5px] w-[77px] rounded-full" />
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="bg-bg-weak p-4">
                    <div className="flex flex-col gap-2.5 rounded-md bg-white p-2">
                      <div className="flex flex-col gap-0.5">
                        <Skeleton className="size-3 rounded" />
                        <Skeleton className="h-1 w-[77px] rounded" />
                      </div>
                      <div className="flex flex-wrap gap-0.5">
                        <Skeleton className="h-1 w-[63px] rounded" />
                        <Skeleton className="h-1 w-[31px] rounded" />
                        <Skeleton className="h-1 flex-1 rounded" />
                        <Skeleton className="h-1 w-[45px] rounded" />
                        <Skeleton className="h-1 w-[34px] rounded" />
                      </div>
                      <Skeleton className="h-1 w-[25px] rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom message */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative inline-flex justify-center">
            <span className={`text-xs font-medium ${variant === 'error' ? 'text-error-base' : 'text-text-soft'}`}>
              {message}
            </span>
            {variant === 'loading' && (
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              </div>
            )}
          </div>

          {/* Back to prompt button for error state */}
          {variant === 'error' && onBackToPrompt && (
            <Button
              variant="secondary"
              className="h-[26px]"
              mode="outline"
              size="2xs"
              leadingIcon={RiArrowLeftSLine}
              onClick={onBackToPrompt}
            >
              Back to prompt
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
