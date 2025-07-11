import type { ITenantEntity } from '@novu/shared';
import React, { useCallback, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import type { Row } from 'react-table';

import PageContainer from '../../components/layout/components/PageContainer';
import PageHeader from '../../components/layout/components/PageHeader';
import { useSegment } from '../../components/providers/SegmentProvider';
import { ROUTES } from '../../constants/routes';
import { TenantsList } from './components/list/TenantsList';

export function TenantsPage() {
  const segment = useSegment();
  const navigate = useNavigate();

  useEffect(() => {
    segment.track('Page Visit - [Tenants]');
  }, [segment]);

  const onAddTenantClickCallback = useCallback(() => {
    navigate(ROUTES.TENANTS_CREATE);
  }, [navigate]);

  const onRowClickCallback = useCallback(
    (item: Row<ITenantEntity>) => {
      navigate(`${ROUTES.TENANTS}/${item.original.identifier}`);
    },
    [navigate]
  );

  return (
    <PageContainer title="Tenants">
      <PageHeader title="Tenants" />
      <TenantsList onAddTenantClick={onAddTenantClickCallback} onRowClickCallback={onRowClickCallback} />
      <Outlet />
    </PageContainer>
  );
}
