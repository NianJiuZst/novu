import React, { useEffect } from 'react';
import { useSegment } from '../../../components/providers/SegmentProvider';
import { Plan } from '../components/Plan';
import { SubscriptionProvider } from '../components/SubscriptionProvider';

export const BillingPage = () => {
  const segment = useSegment();

  useEffect(() => {
    segment.track('Billing Page Viewed');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SubscriptionProvider>
      <Plan />
    </SubscriptionProvider>
  );
};
