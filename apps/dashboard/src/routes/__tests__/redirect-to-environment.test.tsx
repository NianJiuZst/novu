import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RedirectToEnvironment } from '../redirect-to-environment';
import { EnvironmentContext } from '@/context/environment/environment-context';
import { ROUTES } from '@/utils/routes';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: jest.fn(({ to }) => <div data-testid="navigate" data-to={to} />),
}));

describe('RedirectToEnvironment', () => {
  it('should redirect to the environment-specific route when environment is available', () => {
    const mockEnvironment = {
      currentEnvironment: { slug: 'test-env' },
      environments: [],
      areEnvironmentsInitialLoading: false,
      readOnly: false,
      switchEnvironment: jest.fn(),
      setBridgeUrl: jest.fn(),
      oppositeEnvironment: null,
    };

    render(
      <EnvironmentContext.Provider value={mockEnvironment}>
        <MemoryRouter initialEntries={['/topics?query=test#section']}>
          <Routes>
            <Route path="/topics" element={<RedirectToEnvironment targetRoute={ROUTES.TOPICS} />} />
          </Routes>
        </MemoryRouter>
      </EnvironmentContext.Provider>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/env/test-env/topics?query=test#section');
  });

  it('should redirect to root when no environment is available', () => {
    const mockEnvironment = {
      currentEnvironment: undefined,
      environments: [],
      areEnvironmentsInitialLoading: false,
      readOnly: false,
      switchEnvironment: jest.fn(),
      setBridgeUrl: jest.fn(),
      oppositeEnvironment: null,
    };

    render(
      <EnvironmentContext.Provider value={mockEnvironment}>
        <MemoryRouter initialEntries={['/topics']}>
          <Routes>
            <Route path="/topics" element={<RedirectToEnvironment targetRoute={ROUTES.TOPICS} />} />
          </Routes>
        </MemoryRouter>
      </EnvironmentContext.Provider>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/');
  });
});
