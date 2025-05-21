import { Button } from '@/components/primitives/button';
import { NotificationRunnerGame } from '@/components/notification-runner-game';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export function AccessDeniedPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center" data-error="true">
      <div className="flex w-full max-w-[600px] flex-col items-center gap-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-2xl font-semibold text-[#E2E2E3]"
        >
          ¯\_(ツ)_/¯
        </motion.div>

        <div className="flex flex-col items-center gap-1">
          <h3 className="text-base font-medium text-gray-900">🔒 Access Denied</h3>
          <p className="max-w-[367px] text-center text-xs font-medium text-[#99A0AE]">
            Your role doesn't have the keys to this door — but here's a game to pass the time while you wait!
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-6">
          <div className="h-[200px] w-full max-w-[500px] overflow-hidden rounded-lg border border-neutral-200 bg-[#F9FAFB] shadow-sm">
            <NotificationRunnerGame className="h-full w-full" />
          </div>

          <Button
            variant="secondary"
            mode="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="size-4 text-[#525866]" />
            <span className="text-xs font-medium text-[#525866]">Take me back</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
