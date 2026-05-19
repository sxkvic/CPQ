import {
  ApartmentOutlined,
  ApiOutlined,
  AppstoreOutlined,
  AuditOutlined,
  CustomerServiceOutlined,
  FileProtectOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  HistoryOutlined,
  ProductOutlined,
  SettingOutlined,
  SnippetsOutlined,
  SyncOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { Button, Layout, Menu, Space, Typography } from 'antd';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, hasRole } from '../auth';

const { Header, Content, Sider } = Layout;

const menuItems = [
  { key: '/', icon: <AppstoreOutlined />, label: '工作台' },
  { key: '/customers', icon: <CustomerServiceOutlined />, label: '客户管理', roles: ['sales', 'sales_manager'] },
  { key: '/products', icon: <ProductOutlined />, label: '产品管理', roles: ['product_manager'] },
  { key: '/rules', icon: <ApartmentOutlined />, label: '配置规则', roles: ['product_manager'] },
  { key: '/pricing', icon: <TagsOutlined />, label: '价格管理', roles: ['pricing_manager'] },
  { key: '/quotes', icon: <FileTextOutlined />, label: '报价管理', roles: ['sales', 'sales_manager'] },
  { key: '/documents', icon: <SnippetsOutlined />, label: '文档模板', roles: ['sales', 'sales_manager'] },
  { key: '/approvals', icon: <AuditOutlined />, label: '审批中心', roles: ['sales_manager', 'finance', 'executive'] },
  { key: '/orders', icon: <FileDoneOutlined />, label: '订单管理', roles: ['sales', 'sales_manager'] },
  { key: '/contracts', icon: <FileProtectOutlined />, label: '合同管理', roles: ['sales', 'sales_manager'] },
  { key: '/subscriptions', icon: <SyncOutlined />, label: '订阅续费', roles: ['sales', 'sales_manager', 'finance'] },
  { key: '/integrations', icon: <ApiOutlined />, label: '集成中心', roles: ['admin'] },
  { key: '/audit-logs', icon: <HistoryOutlined />, label: '审计日志', roles: ['admin', 'sales_manager'] },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置', roles: ['admin'] },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('cpq_token');
  const user = getCurrentUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const visibleMenuItems = menuItems.filter((item) => hasRole(item.roles, user?.roleCode));
  const selectedKey =
    visibleMenuItems.find((item) => item.key !== '/' && location.pathname.startsWith(item.key))?.key ??
    '/';

  const logout = () => {
    localStorage.removeItem('cpq_token');
    localStorage.removeItem('cpq_user');
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={224} theme="light">
        <div style={{ padding: '20px 20px 12px' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            CPQ 报价系统
          </Typography.Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={visibleMenuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            background: '#fff',
            padding: '0 24px',
          }}
        >
          <Space>
            <Typography.Text>
              {user?.displayName ?? '用户'} / {user?.roleCode ?? 'unknown'}
            </Typography.Text>
            <Button onClick={logout}>退出</Button>
          </Space>
        </Header>
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
