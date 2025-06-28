import type { ReactNode } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';

import FarmPage from '@/pages/Farm';
import HomePage from '@/pages/Home';
import { HomeOutlined, RestOutlined } from '@ant-design/icons';

type IRoute = RouteObject & { label?: string; icon?: ReactNode };

export const applicationRoutes: IRoute[] = [
  {
    path: '/',
    element: <Navigate to="home" />,
  },
  {
    path: '/home',
    element: <HomePage />,
    label: 'Label-Home',
    icon: <HomeOutlined />,
  },
  {
    path: '/farm',
    element: <FarmPage />,
    label: 'Label-Farm',
    icon: <RestOutlined />,
  },
];
