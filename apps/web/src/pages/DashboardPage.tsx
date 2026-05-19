import { Card, Col, Progress, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

type QuoteRow = {
  id: string;
  quoteNo: string;
  totalAmount: string;
  status: string;
  customer?: { name: string };
};

type OrderRow = {
  id: string;
  orderNo: string;
  totalAmount: string;
  status: string;
  customer?: { name: string };
  quote?: { quoteNo: string };
};

type ContractRow = {
  id: string;
  contractNo: string;
  totalAmount: string;
  status: string;
  customer?: { name: string };
};

type SubscriptionRow = {
  id: string;
  subscriptionNo: string;
  nextBillingAt?: string;
  status: string;
  customer?: { name: string };
  product?: { name: string };
};

type StatusCount = {
  status: string;
  count: number;
};

const statusText: Record<string, string> = {
  draft: '草稿',
  pending_approval: '待审批',
  approved: '已批准',
  sent: '已发送',
  accepted: '已接受',
  rejected: '已拒绝',
  converted: '已转订单',
  canceled: '已取消',
  created: '已创建',
  confirmed: '已确认',
  pending_signature: '待签署',
  active: '生效',
  expired: '已过期',
  terminated: '已终止',
  pending: '待处理',
  suspended: '已暂停',
  failed: '失败',
};

function money(value: string | number | undefined) {
  return `¥${Number(value ?? 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function StatusDistribution({ title, rows }: { title: string; rows: StatusCount[] }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0) || 1;
  return (
    <Card title={title}>
      <Space direction="vertical" style={{ width: '100%' }}>
        {rows.length === 0 ? (
          <Typography.Text type="secondary">暂无数据</Typography.Text>
        ) : (
          rows.map((row) => (
            <div key={row.status}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Typography.Text>{statusText[row.status] ?? row.status}</Typography.Text>
                <Typography.Text type="secondary">{row.count}</Typography.Text>
              </Space>
              <Progress percent={Math.round((row.count / total) * 100)} showInfo={false} />
            </div>
          ))
        )}
      </Space>
    </Card>
  );
}

export function DashboardPage() {
  const dashboard = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => (await api.get('/dashboard/summary')).data,
  });

  const data = dashboard.data;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">工作台</h1>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={dashboard.isLoading}>
            <Statistic title="草稿报价" value={data?.cards?.draftQuotes ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={dashboard.isLoading}>
            <Statistic title="待审批" value={data?.cards?.pendingApprovals ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={dashboard.isLoading}>
            <Statistic title="成交报价金额" value={money(data?.cards?.acceptedAmount)} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={dashboard.isLoading}>
            <Statistic title="订单金额" value={money(data?.cards?.orderAmount)} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={dashboard.isLoading}>
            <Statistic title="生效合同" value={data?.cards?.activeContracts ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={dashboard.isLoading}>
            <Statistic title="活跃订阅" value={data?.cards?.activeSubscriptions ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={dashboard.isLoading}>
            <Statistic title="45天内续费" value={data?.cards?.renewalDueSubscriptions ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={dashboard.isLoading}>
            <Statistic title="集成失败事件" value={data?.cards?.failedIntegrationEvents ?? 0} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <StatusDistribution title="报价状态分布" rows={data?.quoteStatus ?? []} />
        </Col>
        <Col xs={24} lg={12}>
          <StatusDistribution title="订单状态分布" rows={data?.orderStatus ?? []} />
        </Col>
        <Col xs={24} lg={12}>
          <StatusDistribution title="合同状态分布" rows={data?.contractStatus ?? []} />
        </Col>
        <Col xs={24} lg={12}>
          <StatusDistribution title="订阅状态分布" rows={data?.subscriptionStatus ?? []} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="最近报价">
            <Table
              rowKey="id"
              loading={dashboard.isLoading}
              dataSource={data?.recentQuotes ?? []}
              pagination={false}
              columns={[
                { title: '报价编号', dataIndex: 'quoteNo' },
                { title: '客户', render: (_, record: QuoteRow) => record.customer?.name },
                { title: '总金额', dataIndex: 'totalAmount', render: (value) => money(value) },
                {
                  title: '状态',
                  dataIndex: 'status',
                  render: (value: string) => <Tag>{statusText[value] ?? value}</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="最近订单">
            <Table
              rowKey="id"
              loading={dashboard.isLoading}
              dataSource={data?.recentOrders ?? []}
              pagination={false}
              columns={[
                { title: '订单编号', dataIndex: 'orderNo' },
                { title: '来源报价', render: (_, record: OrderRow) => record.quote?.quoteNo },
                { title: '客户', render: (_, record: OrderRow) => record.customer?.name },
                { title: '总金额', dataIndex: 'totalAmount', render: (value) => money(value) },
                {
                  title: '状态',
                  dataIndex: 'status',
                  render: (value: string) => <Tag>{statusText[value] ?? value}</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="最近合同">
            <Table
              rowKey="id"
              loading={dashboard.isLoading}
              dataSource={data?.recentContracts ?? []}
              pagination={false}
              columns={[
                { title: '合同编号', dataIndex: 'contractNo' },
                { title: '客户', render: (_, record: ContractRow) => record.customer?.name },
                { title: '总金额', dataIndex: 'totalAmount', render: (value) => money(value) },
                {
                  title: '状态',
                  dataIndex: 'status',
                  render: (value: string) => <Tag>{statusText[value] ?? value}</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="续费队列">
            <Table
              rowKey="id"
              loading={dashboard.isLoading}
              dataSource={data?.renewalPipeline ?? []}
              pagination={false}
              columns={[
                { title: '订阅编号', dataIndex: 'subscriptionNo' },
                { title: '客户', render: (_, record: SubscriptionRow) => record.customer?.name },
                { title: '产品', render: (_, record: SubscriptionRow) => record.product?.name },
                { title: '下次账期', dataIndex: 'nextBillingAt' },
                {
                  title: '状态',
                  dataIndex: 'status',
                  render: (value: string) => <Tag>{statusText[value] ?? value}</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
