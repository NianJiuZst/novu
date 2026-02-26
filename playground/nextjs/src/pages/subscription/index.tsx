import { NovuProvider, Subscription } from '@novu/nextjs';
import { subscriptionDarkTheme } from '@novu/nextjs/themes';
import { useState } from 'react';
import Title from '@/components/Title';
import { novuConfig } from '@/utils/config';
import { AnnotatedConditionsPreferences } from './annotated-conditions-preferences';
import { ConditionsPreferences } from './conditions-preferences';

const topicKey = 'topic_key_13';
const identifier = `${topicKey}:project_4`;

function WorkflowPreferences({ isDark }: { isDark: boolean }) {
  return (
    <div>
      <h4>Workflow Preferences</h4>
      <NovuProvider {...novuConfig}>
        <Subscription
          topicKey={topicKey}
          identifier={`workflows-${identifier}`}
          preferences={[
            { workflowId: 'yolo' },
            { label: 'Test Group', filter: { tags: ['yoyo'] } },
            { label: 'Test Group', filter: { workflowIds: ['test-workflow1', 'test-workflow2', 'test-workflow3'] } },
          ]}
          appearance={{
            baseTheme: isDark ? subscriptionDarkTheme : undefined,
          }}
        />
      </NovuProvider>
    </div>
  );
}

export default function SubscriptionPage() {
  const [isDark, setIsDark] = useState(false);

  const toggleDarkTheme = () => {
    setIsDark((prev) => !prev);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <>
      <Title title="Subscription Component" />
      <div className="flex flex-col gap-2 items-center">
        <button onClick={toggleDarkTheme}>Toggle Dark Theme</button>
        <WorkflowPreferences isDark={isDark} />
        <ConditionsPreferences isDark={isDark} />
        <AnnotatedConditionsPreferences isDark={isDark} />
      </div>
    </>
  );
}
