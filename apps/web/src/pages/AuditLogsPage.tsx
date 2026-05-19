import { Card, Form, Input, Space, Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api';
import { tableLocale } from '../empty';

type AuditRow = {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  actorId?: string;
  createdAt: string;
};

export function AuditLogsPage() {
  const [keyword, setKeyword] = useState('');
  const auditLogs = useQuery({
    queryKey: ['audit-logs', keyword],
    queryFn: async () => (await api.get('/audit-logs', { params: { keyword } })).data,
  });

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">审计日志</h1>
      </div>
      <Card>
        <Form layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item label="关键字">
            <Input.Search allowClear placeholder="动作、资源类型或资源ID" onSearch={(value) => setKeyword(value)} style={{ width: 320 }} />
          </Form.Item>
        </Form>
        <Table
          rowKey="id"
          loading={auditLogs.isLoading}
          locale={tableLocale}
          dataSource={auditLogs.data?.items ?? []}
          columns={[
            { title: '动作', dataIndex: 'action' },
            { title: '资源类型', dataIndex: 'resourceType' },
            { title: '资源ID', dataIndex: 'resourceId' },
            { title: '操作者', dataIndex: 'actorId' },
            { title: '时间', dataIndex: 'createdAt' },
            {
              title: '摘要',
              render: (_, record: AuditRow) => (
                <Space>
                  {record.resourceType}
                  {record.resourceId}
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}
