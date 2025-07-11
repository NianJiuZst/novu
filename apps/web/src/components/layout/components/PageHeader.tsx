import { Group } from '@mantine/core';
import { Container, Title } from '@novu/design-system';
import { Flex } from '@novu/novui/jsx';
import { ROUTES } from '../../../constants/routes';
import { DocsButton } from '../../docs/DocsButton';
import { PATHS } from '../../docs/docs.const';
import { type DocsPaths, useDocsPath } from '../../docs/useDocsPath';

const paths: DocsPaths = {
  [ROUTES.INTEGRATIONS]: PATHS.INTEGRATION_INTRODUCTION,
  [ROUTES.SUBSCRIBERS]: PATHS.CONCEPT_SUBSCRIBERS,
  [ROUTES.WORKFLOWS]: PATHS.CONCEPT_WORKFLOWS,
  [ROUTES.TENANTS]: PATHS.CONCEPT_TENANTS,
};

function PageHeader({ actions, title }: { actions?: JSX.Element; title: string }) {
  const path = useDocsPath(paths);

  return (
    <Container fluid sx={{ padding: '20px 24px' }}>
      <Group position="apart">
        <Flex align="center" gap="75">
          <Title>{title}</Title>
          <DocsButton path={path} />
        </Flex>
        {actions && <div>{actions}</div>}
      </Group>
    </Container>
  );
}

export default PageHeader;
