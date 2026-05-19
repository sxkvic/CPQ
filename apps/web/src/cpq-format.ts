import dayjs from 'dayjs';

export const statusText: Record<string, string> = {
  draft: '草稿',
  pending_approval: '待审批',
  approved: '已批准',
  sent: '已发送',
  accepted: '已接受',
  rejected: '已拒绝',
  expired: '已过期',
  canceled: '已取消',
  converted: '已转订单',
  created: '已创建',
  confirmed: '已确认',
  pending_signature: '待签署',
  active: '生效',
  terminated: '已终止',
  pending: '待处理',
  suspended: '已暂停',
  failed: '失败',
};

export const statusColor: Record<string, string> = {
  draft: 'default',
  pending_approval: 'processing',
  approved: 'blue',
  sent: 'cyan',
  accepted: 'green',
  rejected: 'red',
  expired: 'orange',
  canceled: 'default',
  converted: 'purple',
  created: 'processing',
  confirmed: 'green',
  pending_signature: 'processing',
  active: 'green',
  terminated: 'red',
  pending: 'default',
  suspended: 'orange',
  failed: 'red',
};

export function money(value: unknown) {
  return `¥${Number(value ?? 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function percent(value: unknown) {
  return `${(Number(value ?? 0) * 100).toFixed(2)}%`;
}

export function shortDate(value: string | undefined) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '-';
}

export function daysUntil(value: string | undefined) {
  if (!value) return undefined;
  return dayjs(value).startOf('day').diff(dayjs().startOf('day'), 'day');
}
