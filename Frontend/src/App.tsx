import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { ToastContainer } from 'react-toastify';
import { QueryClientProvider } from '@tanstack/react-query';
import { store } from '@/store';
import AppRoutes from '@/routes/AppRoutes';
import { queryClient } from '@/lib/queryClient';
import ErrorBoundary from '@/components/custom/ErrorBoundary';

/** Root application component.
 * Wires up routing,
 * the Redux store and the query client around the route tree.
 * */
const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <ToastContainer position="top-center" stacked />
            <AppRoutes />
          </QueryClientProvider>
        </Provider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
