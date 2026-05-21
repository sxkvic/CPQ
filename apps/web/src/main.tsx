import '@ant-design/v5-patch-for-react-19';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AppLayout } from './shell/AppLayout';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ContractsPage } from './pages/ContractsPage';
import { CustomersPage } from './pages/CustomersPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { LoginPage } from './pages/LoginPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { PricingPage } from './pages/PricingPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';
import { QuoteDetailPage } from './pages/QuoteDetailPage';
import { QuotesPage } from './pages/QuotesPage';
import { RulesPage } from './pages/RulesPage';
import { SettingsPage } from './pages/SettingsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import './styles.css';
import { setGlobalNotify } from './global-message';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'rules', element: <RulesPage /> },
      { path: 'pricing', element: <PricingPage /> },
      { path: 'quotes', element: <QuotesPage /> },
      { path: 'quotes/:id', element: <QuoteDetailPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'approvals', element: <ApprovalsPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'contracts', element: <ContractsPage /> },
      { path: 'subscriptions', element: <SubscriptionsPage /> },
      { path: 'integrations', element: <IntegrationsPage /> },
      { path: 'audit-logs', element: <AuditLogsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

function Root() {
  const [messageApi, contextHolder] = message.useMessage();
  setGlobalNotify((type, content) => {
    void messageApi.open({ type, content });
  });

  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        {contextHolder}
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
