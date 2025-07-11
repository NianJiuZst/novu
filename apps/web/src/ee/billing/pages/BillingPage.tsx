import React, { useEffect } from 'react';
import { useSegment } from '../../../components/providers/SegmentProvider';
import { Plan } from '../components/Plan';
import { SubscriptionProvider } from '../components/SubscriptionProvider';

export const BillingPage = () => {
  const segment = useSegment();

  useEffect(() => {
    segment.track('Billing Page Viewed');  }, []);

  return (
    <SubscriptionProvider>
      <Plan />
    </SubscriptionProvider>
  );
};
