import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { setCurrentUser } from '../auth';

type LoginForm = {
  username: string;
  password: string;
};

export function LoginPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values: LoginForm) => {
    try {
      const response = await api.post('/auth/login', values);
      localStorage.setItem('cpq_token', response.data.accessToken);
      setCurrentUser(response.data.user);
      navigate('/');
    } catch {
      messageApi.error('登录失败，请检查账号和密码');
    }
  };

  return (
    <main className="login-page">
      {contextHolder}
      <Card className="login-panel">
        <Typography.Title level={3}>CPQ 报价系统</Typography.Title>
        <Typography.Paragraph type="secondary">
          默认账号：admin / admin123456
          <br />
          可试：sales01、pm01、price01、manager01，密码任意
        </Typography.Paragraph>
        <Form<LoginForm>
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ username: 'admin' }}
          autoComplete="on"
        >
          <Form.Item name="username" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
            <Input prefix={<UserOutlined />} placeholder="请输入账号" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            登录
          </Button>
        </Form>
      </Card>
    </main>
  );
}
