import { Link } from 'react-router';
import Card from '@/components/shared/Card';
import PageCenter from '@/components/shared/PageCenter';

/** Fallback page for unknown URLs. */
const NotFound = () => {
  return (
    <PageCenter>
      <Card>
        <h1 className="mb-6 text-center text-xl font-bold sm:text-2xl">
          Page not found
        </h1>
        <Link
          to="/"
          className="block w-full rounded-lg bg-indigo-600 py-2.5 text-center text-sm font-semibold text-white transition-colors duration-200 ease-in-out hover:bg-indigo-700 sm:py-3 sm:text-base"
        >
          Go home
        </Link>
      </Card>
    </PageCenter>
  );
};

export default NotFound;
