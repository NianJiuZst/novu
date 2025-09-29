import { Badge, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Popover } from '@novu/design-system';
import type { HealthCheck } from '@novu/framework/internal';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { api } from '../../../api/api.client';
import { IS_SELF_HOSTED } from '../../../config';
import { useEnvironment } from '../../../hooks';

export function BridgeStatus() {
  const [opened, { close, open }] = useDisclosure(false);
  const failureCountRef = useRef(0);
  const [refetchInterval, setRefetchInterval] = useState(5000);

  const { environment } = useEnvironment();
  const isBridgeEnabled = !!environment?.echo?.url && !IS_SELF_HOSTED;

  const { data, error, isInitialLoading } = useQuery<HealthCheck>(
    ['/v1/bridge/status'],
    () => {
      return api.get('/v1/bridge/status');
    },
    {
      enabled: isBridgeEnabled,
      refetchInterval,
      refetchOnWindowFocus: true,
    }
  );

  // Update interval based on success/failure state
  useEffect(() => {
    const isSuccess = data?.status === 'ok' && !error;

    if (isSuccess) {
      failureCountRef.current = 0;
      setRefetchInterval(5000); // Reset to 5 seconds on success
    } else if (data !== undefined || error) {
      // Only count as failure if we actually got a response
      failureCountRef.current += 1;
      // After 3 failures, use 10 second interval
      const newInterval = failureCountRef.current >= 3 ? 10000 : 5000;
      setRefetchInterval(newInterval);
    }
  }, [data, error]);

  if (IS_SELF_HOSTED) {
    return null;
  }

  if (!isBridgeEnabled) return null;

  const status = data?.status === 'ok' && !error ? 'ok' : 'down';
  let color = status === 'ok' ? 'green' : 'red';
  if (isInitialLoading) {
    color = 'yellow';
  }

  return (
    <Popover
      opened={opened}
      titleGradient={status === 'ok' ? 'blue' : undefined}
      position={'bottom'}
      target={
        <Badge color={color} variant="outline" onMouseEnter={open} onMouseLeave={close}>
          Bridge
        </Badge>
      }
      title={'Bridge Status'}
      content={<PopoverContent status={status} url={environment?.echo?.url} />}
    ></Popover>
  );
}

function PopoverContent({ url, status }) {
  if (status !== 'ok') {
    return (
      <>
        <Text>
          <b>Status</b>: {status === 'ok' ? 'Connected to your application' : 'Disconnected from your application'}
        </Text>
        <Text>
          <b>URL</b>: {url}
        </Text>
      </>
    );
  }

  return (
    <>
      <Text>
        <b>Status</b>: Bridge Is Up
      </Text>
      <Text>
        <b>URL</b>: {url}
      </Text>
    </>
  );
}
