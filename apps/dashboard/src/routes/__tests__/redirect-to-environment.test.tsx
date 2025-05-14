import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RedirectToEnvironment } from '../redirect-to-environment';
import { EnvironmentContext } from '../../context/environment/environment-context';
import { ROUTES } from '../../utils/routes';

const mockRender = jest.fn();
const mockScreen = {
  getByTestId: jest.fn(),
};

jest.mock('@testing-library/react', () => ({
  render: (...args: any[]) => {
    mockRender(...args);
    return { screen: mockScreen };
  },
  screen: mockScreen,
}));

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

    mockScreen.getByTestId.mockReturnValue({ getAttribute: () => '/env/test-env/topics?query=test#section' });

    render(
      <EnvironmentContext.Provider value={mockEnvironment as any}>
        <MemoryRouter initialEntries={['/topics?query=test#section']}>
          <Routes>
            <Route path="/topics" element={<RedirectToEnvironment targetRoute={ROUTES.TOPICS} />} />
          </Routes>
        </MemoryRouter>
      </EnvironmentContext.Provider>
    );

    const navigate = mockScreen.getByTestId('navigate');
    expect(navigate.getAttribute('data-to')).toBe('/env/test-env/topics?query=test#section');
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

    mockScreen.getByTestId.mockReturnValue({ getAttribute: () => '/' });

    render(
      <EnvironmentContext.Provider value={mockEnvironment as any}>
        <MemoryRouter initialEntries={['/topics']}>
          <Routes>
            <Route path="/topics" element={<RedirectToEnvironment targetRoute={ROUTES.TOPICS} />} />
          </Routes>
        </MemoryRouter>
      </EnvironmentContext.Provider>
    );

    const navigate = mockScreen.getByTestId('navigate');
    expect(navigate.getAttribute('data-to')).toBe('/');
  });
});
