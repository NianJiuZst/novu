import { Container } from '@mantine/core';
import { type IExtendedColumn, Table, Text, withCellLoading } from '@novu/design-system';
import type { ChannelTypeEnum } from '@novu/shared';
import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import type { Row } from 'react-table';
import PageContainer from '../../components/layout/components/PageContainer';
import PageHeader from '../../components/layout/components/PageHeader';
import { When } from '../../components/utils/When';
import { useEnvironment, useIntegrations } from '../../hooks';
import { ConditionCell } from './components/ConditionCell';
import { IntegrationChannelCell } from './components/IntegrationChannelCell';
import { IntegrationEnvironmentCell } from './components/IntegrationEnvironmentCell';
import { IntegrationNameCell } from './components/IntegrationNameCell';
import { IntegrationStatusCell } from './components/IntegrationStatusCell';
import { IntegrationsListNoData } from './components/IntegrationsListNoData';
import { IntegrationsListToolbar } from './components/IntegrationsListToolbar';
import type { ITableIntegration } from './types';
import { mapToTableIntegration } from './utils';

const columns: IExtendedColumn<ITableIntegration>[] = [
  {
    accessor: 'name',
    Header: 'Name',
    Cell: IntegrationNameCell,
  },
  {
    accessor: 'provider',
    Header: 'Provider',
    Cell: withCellLoading(
      ({ row: { original } }) => {
        return (
          <Text data-test-id="integration-provider-cell" rows={1}>
            {original.provider}
          </Text>
        );
      },
      { loadingTestId: 'integration-provider-cell-loading' }
    ),
  },
  {
    accessor: 'channel',
    Header: 'Channel',
    Cell: IntegrationChannelCell,
  },
  {
    accessor: 'environment',
    Header: 'Environment',
    Cell: IntegrationEnvironmentCell,
  },
  {
    accessor: 'conditions',
    Header: 'Condition',
    width: 100,
    maxWidth: 100,
    Cell: ConditionCell,
  },
  {
    accessor: 'active',
    Header: 'Status',
    width: 125,
    maxWidth: 125,
    Cell: IntegrationStatusCell,
  },
];

export const IntegrationsList = ({
  withOutlet = true,
  onAddProviderClick,
  onRowClickCallback,
  onChannelClick,
}: {
  withOutlet?: boolean;
  onAddProviderClick: React.MouseEventHandler<HTMLButtonElement>;
  onRowClickCallback: (row: Row<ITableIntegration>) => void;
  onChannelClick: (channel: ChannelTypeEnum) => void;
}) => {
  const { environments, isLoaded } = useEnvironment();
  const { integrations, loading: areIntegrationsLoading } = useIntegrations();
  const isLoading = !isLoaded || areIntegrationsLoading;
  const hasIntegrations = integrations && integrations?.length > 0;

  const data = useMemo<ITableIntegration[] | undefined>(() => {
    return (integrations ?? []).map((el) => mapToTableIntegration(el, environments));
  }, [integrations, environments]);

  return (
    <PageContainer title="Integrations">
      <PageHeader title="Integration Store" />
      <When truthy={hasIntegrations}>
        <Container fluid sx={{ padding: '0 24px 8px 30px' }}>
          <IntegrationsListToolbar onAddProviderClick={onAddProviderClick} areIntegrationsLoading={isLoading} />
        </Container>
      </When>
      <When truthy={hasIntegrations || isLoading}>
        <Table
          onRowClick={onRowClickCallback}
          loading={isLoading}
          data-test-id="integrations-list-table"
          columns={columns}
          data={data}
        />
      </When>
      <When truthy={!hasIntegrations && !isLoading}>
        <IntegrationsListNoData onChannelClick={onChannelClick} />
      </When>
      {withOutlet && <Outlet />}
    </PageContainer>
  );
};
