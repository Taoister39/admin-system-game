import type { ReactNode } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';

import Dashboard from '@/pages/Dashboard';
import Inventory from '@/pages/Inventory';
import Orders from '@/pages/Orders';
import Production from '@/pages/Production';
import Records from '@/pages/Records';
import {
  AppstoreOutlined,
  BarChartOutlined,
  DashboardOutlined,
  FileTextOutlined,
  InboxOutlined,
} from '@ant-design/icons';

type IRoute = RouteObject & { label?: string; icon?: ReactNode };

export const applicationRoutes: IRoute[] = [
  {
    path: '/',
    element: <Navigate to="/home" replace />,
  },
  {
    path: '/home',
    element: <Dashboard />,
    label: '工作台',
    icon: <DashboardOutlined />,
  },
  {
    path: '/orders',
    element: <Orders />,
    label: '订单中心',
    icon: <FileTextOutlined />,
  },
  {
    path: '/inventory',
    element: <Inventory />,
    label: '库存与采购',
    icon: <InboxOutlined />,
  },
  {
    path: '/production',
    element: <Production />,
    label: '生产与设施',
    icon: <AppstoreOutlined />,
  },
  {
    path: '/records',
    element: <Records />,
    label: '经营记录',
    icon: <BarChartOutlined />,
  },
  {
    path: '/farm',
    element: <Navigate to="/production" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/home" replace />,
  },
];
