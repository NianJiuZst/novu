import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EnvironmentRedirect } from './environment-redirect';
import { EnvironmentContext } from '@/context/environment/environment-context';
import { vi } from 'vitest';

// Mock the Navigate component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  };
});

describe('EnvironmentRedirect', () => {
  const mockEnvironment = {
    currentEnvironment: {
      _id: 'env-1',
      name: 'Development',
      slug: 'dev',
    },
    environments: [],
    areEnvironmentsInitialLoading: false,
    readOnly: false,
    oppositeEnvironment: null,
    switchEnvironment: vi.fn(),
    setBridgeUrl: vi.fn(),
  };

  it('should redirect to the environment-specific path for topics', () => {
    render(
      <EnvironmentContext.Provider value={mockEnvironment}>
        <MemoryRouter initialEntries={['/topics']}>
          <Routes>
            <Route path="/topics" element={<EnvironmentRedirect />} />
          </Routes>
        </MemoryRouter>
      </EnvironmentContext.Provider>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/env/dev/topics');
  });

  it('should redirect to the environment-specific path for workflows', () => {
    render(
      <EnvironmentContext.Provider value={mockEnvironment}>
        <MemoryRouter initialEntries={['/workflows']}>
          <Routes>
            <Route path="/workflows" element={<EnvironmentRedirect />} />
          </Routes>
        </MemoryRouter>
      </EnvironmentContext.Provider>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/env/dev/workflows');
  });

  it('should preserve query parameters when redirecting', () => {
    render(
      <EnvironmentContext.Provider value={mockEnvironment}>
        <MemoryRouter initialEntries={['/topics?filter=active&sort=desc']}>
          <Routes>
            <Route path="/topics" element={<EnvironmentRedirect />} />
          </Routes>
        </MemoryRouter>
      </EnvironmentContext.Provider>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/env/dev/topics?filter=active&sort=desc');
  });

  it('should not redirect if no environment is available', () => {
    const noEnvironment = {
      ...mockEnvironment,
      currentEnvironment: undefined,
    };

    render(
      <EnvironmentContext.Provider value={noEnvironment}>
        <MemoryRouter initialEntries={['/topics']}>
          <Routes>
            <Route path="/topics" element={<EnvironmentRedirect />} />
          </Routes>
        </MemoryRouter>
      </EnvironmentContext.Provider>
    );

    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('should not redirect for paths not in the map', () => {
    render(
      <EnvironmentContext.Provider value={mockEnvironment}>
        <MemoryRouter initialEntries={['/unknown-path']}>
          <Routes>
            <Route path="/unknown-path" element={<EnvironmentRedirect />} />
          </Routes>
        </MemoryRouter>
      </EnvironmentContext.Provider>
    );

    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });
});

