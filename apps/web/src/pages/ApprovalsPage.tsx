import { Button, Card, Input, Modal, Space, Table, Tag, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api';
import { tableLocale } from '../empty';

type ApprovalRow = {
  id: string;
  status: string;
  submittedAt: string;
  triggerReasonsJson: string[];
  quote: {
    quoteNo: string;
    totalAmount: string;
    grossMarginRate: string;
    customer?: { name: string };
  };
};

export function ApprovalsPage() {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [active, setActive] = useState<ApprovalRow | null>(null);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [messageApi, contextHolder] = message.useMessage();

  const approvals = useQuery({
    queryKey: ['approvals'],
    queryFn: async () => (await api.get('/approvals/tasks')).data,
  });

  const submitAction = useMutation({
    mutationFn: async () => api.post(`/approvals/${active?.id}/${action}`, { comment }),
    onSuccess: async () => {
      messageApi.success(action === 'approve' ? '审批已通过' : '审批已驳回');
      setActive(null);
      setComment('');
      await queryClient.invalidateQueries({ queryKey: ['approvals'] });
      await queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });

  const openAction = (record: ApprovalRow, nextAction: 'approve' | 'reject') => {
    setActive(record);
    setAction(nextAction);
  };

  return (
    <>
      {contextHolder}
      <div className="page-header">
        <h1 className="page-title">审批中心</h1>
      </div>
      <Card>
        <Table
          rowKey="id"
          loading={approvals.isLoading}
          locale={tableLocale}
          dataSource={approvals.data?.items ?? []}
          columns={[
            { title: '报价编号', render: (_, record: ApprovalRow) => record.quote.quoteNo },
            { title: '客户', render: (_, record: ApprovalRow) => record.quote.customer?.name },
            { title: '总金额', render: (_, record: ApprovalRow) => `¥${record.quote.totalAmount}` },
            {
              title: '毛利率',
              render: (_, record: ApprovalRow) =>
                `${(Number(record.quote.grossMarginRate) * 100).toFixed(2)}%`,
            },
            {
              title: '触发原因',
              render: (_, record: ApprovalRow) =>
                record.triggerReasonsJson?.map((reason) => <Tag key={reason}>{reason}</Tag>),
            },
            {
              title: '操作',
              render: (_, record: ApprovalRow) => (
                <Space>
                  <Button type="primary" onClick={() => openAction(record, 'approve')}>
                    通过
                  </Button>
                  <Button danger onClick={() => openAction(record, 'reject')}>
                    驳回
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
      <Modal
        title={action === 'approve' ? '审批通过' : '审批驳回'}
        open={Boolean(active)}
        onCancel={() => setActive(null)}
        onOk={() => submitAction.mutate()}
        confirmLoading={submitAction.isPending}
      >
        <Input.TextArea
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="请输入审批意见"
        />
      </Modal>
    </>
  );
}
