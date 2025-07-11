import { BrowserRouter } from 'react-router-dom';
import { ApplicationReadyGuard } from './ApplicationReadyGuard';
import { AppRoutes } from './AppRoutes';
import { CONTEXT_PATH } from './config/index';
import Providers from './Providers';

export default function App() {
  return (
    <BrowserRouter basename={CONTEXT_PATH}>
      <Providers>
        <ApplicationReadyGuard>
          <AppRoutes />
        </ApplicationReadyGuard>
      </Providers>
    </BrowserRouter>
  );
}
