import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import PresentationLayout from '@/layouts/PresentationLayout';

// Routes
import HomePage from '@routes/index';
import BrowsePage from '@routes/browse/index';
import PackViewPage from '@routes/pack/[uuid]';
import PackCreatePage from '@routes/pack/create';
import HymnViewPage from '@routes/hymn/[uuid]';
import BiblePage from '@routes/bible/[uuid]';
import BookPage from '@routes/book/[uuid]';
import PresentationPage from '@routes/presentation/[uuid]';
import NotFoundPage from '@routes/not-found';

// Dev-only routes
import SQLTestPage from '@routes/dev/sql-test';

/**
 * Router configuration matching the old app's Expo Router structure
 *
 * Old app routes (frontend/app/):
 * - index.tsx → /
 * - pack/[uuid].tsx → /pack/:uuid
 * - pack/create.tsx → /pack/create
 * - hymn/[uuid].tsx → /hymn/:uuid
 * - bible/[uuid].tsx → /bible/:uuid
 * - book/[uuid].tsx → /book/:uuid
 * - presentation/[uuid].tsx → /presentation/:uuid
 *
 * Dev-only routes:
 * - /dev/sql-test → SQL Query Tester
 */

// Check if we're in development mode
const isDev = import.meta.env.DEV;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'browse',
        element: <BrowsePage />,
      },
      {
        path: 'pack',
        children: [
          {
            path: 'create',
            element: <PackCreatePage />,
          },
          {
            path: ':uuid',
            element: <PackViewPage />,
          },
        ],
      },
      {
        path: 'hymn',
        children: [
          {
            path: ':uuid',
            element: <HymnViewPage />,
          },
        ],
      },
      {
        path: 'bible/:uuid',
        element: <BiblePage />,
      },
      {
        path: 'book/:uuid',
        element: <BookPage />,
      },
      // Dev-only routes
      ...(isDev ? [
        {
          path: 'dev/sql-test',
          element: <SQLTestPage />,
        },
      ] : []),
    ],
  },
  {
    path: '/presentation',
    element: <PresentationLayout />,
    children: [
      {
        path: ':uuid',
        element: <PresentationPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
