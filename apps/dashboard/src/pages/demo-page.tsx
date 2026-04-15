import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageMeta } from '@/components/page-meta';
import { Button } from '@/components/primitives/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/primitives/card';
import { useEnvironment } from '@/context/environment/hooks';
import { buildRoute, ROUTES } from '@/utils/routes';

export function DemoPage() {
  const { currentEnvironment } = useEnvironment();
  const environmentSlug = currentEnvironment?.slug ?? '';

  const workflowsHref = environmentSlug
    ? buildRoute(ROUTES.WORKFLOWS, { environmentSlug })
    : ROUTES.ROOT;

  return (
    <>
      <PageMeta title="Demo" />
      <DashboardLayout headerStartItems={<h1 className="text-foreground-950">Demo</h1>}>
        <div className="mx-auto flex max-w-2xl flex-col gap-6 py-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard demo</CardTitle>
              <CardDescription>
                Use this page as a sandbox for UI experiments. It is scoped to the current environment and is not linked
                from the main navigation.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-foreground-600 text-sm">
                Navigate to workflows to continue exploring the product, or open the welcome page for onboarding
                resources.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="primary">
                  <Link to={workflowsHref}>Go to workflows</Link>
                </Button>
                {environmentSlug ? (
                  <Button asChild variant="secondary">
                    <Link to={buildRoute(ROUTES.WELCOME, { environmentSlug })}>Welcome</Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}
