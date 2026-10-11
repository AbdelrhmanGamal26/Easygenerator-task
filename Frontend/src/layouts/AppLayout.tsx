import { Suspense } from 'react';
import { Outlet } from 'react-router';
import Header from '@/components/custom/Header';
import Footer from '@/components/custom/Footer';

/** Top-level shell: header and footer around the routed page, which fills the remaining height. */
const AppLayout = () => {
  return (
    <div className="flex min-h-dvh flex-col bg-linear-to-br from-indigo-100 to-violet-50 text-gray-800">
      <Header />
      <main className="flex flex-1 flex-col outline-none">
        <Suspense
          fallback={
            <p className="m-auto text-center" role="status">
              Loading...
            </p>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;
