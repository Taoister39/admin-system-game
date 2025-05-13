import FarmPage from '@/pages/Farm';
import HomePage from '@/pages/Home';
import { Navigate, type RouteObject } from 'react-router-dom';

export const applicationRoutes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="home" />,
  },
  {
    path: '/home',
    element: <HomePage />,
  },
  {
    path: '/farm',
    element: <FarmPage />,
  },
];
