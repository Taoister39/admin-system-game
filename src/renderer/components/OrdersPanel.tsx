import { ArrowRightOutlined, ToolOutlined } from '@ant-design/icons';
import {
  ITEMS,
  type Order,
  REPAIRS,
  type RepairId,
  available,
  deliveryIssue,
  orderPart,
  rewardFor,
} from '@common/game';
import {
  Alert,
  App,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Radio,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../game/GameProvider';

const statusNames = {
  offered: '待接',
  accepted: '处理中',
  completed: '已完成',
  expired: '已过期',
  abandoned: '已放弃',
};
const useStyles = createStyles(({ css, token }) => ({
  tableTitle: css`padding-left: 0; height: auto; white-space: normal; text-align: left;`,
  secondary: css`color: ${token.colorTextSecondary};`,
  small: css`font-size: ${token.fontSizeSM}px;`,
  numeric: css`font-variant-numeric: tabular-nums;`,
  filterBar: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 20px;
    @media (max-width: 600px) {
      align-items: flex-start;
    }
  `,
  customerNote: css`
    padding: 16px;
    background: ${token.colorFillQuaternary};
    border-radius: ${token.borderRadius}px;
    display: flex;
    gap: 12px;
    p {
      margin: 4px 0 0;
    }
  `,
  avatar: css`
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    background: ${token.colorSuccessBg};
    color: ${token.colorSuccessText};
    border-radius: 50%;
    font-weight: 500;
  `,
  detailResources: css`
    padding: 16px;
    background: ${token.colorFillQuaternary};
    border-radius: ${token.borderRadius}px;
  `,
  warningText: css`color: ${token.colorWarning};`,
  search: css`max-width: 300px;`,
  detailStack: css`width: 100%;`,
}));

export function OrdersPanel({ compact = false }: { compact?: boolean }) {
  const { styles, cx } = useStyles();
  const { state, busy, act } = useGame();
  const { modal } = App.useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState('全部');
  const [search, setSearch] = useState('');
  const order = state.orders.find((o) => o.id === selected);
  const acceptedCount = state.orders.filter(
    (o) => o.status === 'accepted',
  ).length;
  const rows = state.orders
    .filter(
      (o) =>
        (filter === '全部' ||
          (filter === '待接'
            ? o.status === 'offered'
            : filter === '处理中'
              ? o.status === 'accepted'
              : o.status === 'completed')) &&
        `${o.title}${o.customer}`.includes(search.trim()),
    )
    .sort(
      (a, b) =>
        Number(b.status === 'accepted') - Number(a.status === 'accepted') ||
        a.deadline - b.deadline,
    );
  const columns: TableColumnsType<Order> = [
    {
      title: '委托',
      key: 'order',
      render: (_, row) => (
        <div>
          <Button
            type="link"
            className={styles.tableTitle}
            onClick={() => setSelected(row.id)}
          >
            {row.title}
          </Button>
          <div className={cx(styles.secondary, styles.small)}>
            {row.customer}
          </div>
        </div>
      ),
    },
    {
      title: '收入',
      key: 'income',
      width: 100,
      render: (_, row) => (
        <span className={styles.numeric}>
          {rewardFor(state, row)}{' '}
          <span className={cx(styles.secondary, styles.small)}>金币</span>
        </span>
      ),
    },
    {
      title: '截止日',
      key: 'deadline',
      width: 110,
      render: (_, row) => (
        <span
          className={
            row.deadline === state.day && row.status === 'accepted'
              ? styles.warningText
              : ''
          }
        >
          第 {row.deadline} 日
          {row.deadline === state.day ? (
            <div className={cx(styles.small, styles.secondary)}>
              今天营业结束前
            </div>
          ) : null}
        </span>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, row) => (
        <Tag
          color={
            row.status === 'accepted'
              ? 'blue'
              : row.status === 'completed'
                ? 'green'
                : 'default'
          }
        >
          {statusNames[row.status]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, row) =>
        row.status === 'offered' ? (
          <Button
            size="small"
            disabled={busy || acceptedCount >= 3}
            onClick={() => act({ type: 'accept', id: row.id })}
          >
            接单
          </Button>
        ) : (
          <Button
            size="small"
            type={row.status === 'accepted' ? 'primary' : 'default'}
            onClick={() => setSelected(row.id)}
          >
            {row.status === 'accepted' ? '去处理' : '查看'}
          </Button>
        ),
    },
  ];
  const part = order ? orderPart(order) : undefined;
  const missing =
    order && part
      ? Math.max(
          0,
          order.quantity -
            (order.status === 'accepted'
              ? order.reserved
              : available(state, part)),
        )
      : 0;
  const repair = order?.repair ? REPAIRS[order.repair] : null;
  const issue =
    order?.status === 'accepted' ? deliveryIssue(state, order) : null;
  return (
    <>
      {!compact ? (
        <div className={styles.filterBar}>
          <Segmented
            value={filter}
            onChange={setFilter}
            options={['全部', '待接', '处理中', '已完成']}
          />
          <Input.Search
            allowClear
            aria-label="搜索委托或客户"
            placeholder="搜索委托或客户"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={styles.search}
          />
        </div>
      ) : null}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={compact ? rows.slice(0, 5) : rows}
        size="middle"
        scroll={{ x: 580 }}
        pagination={compact ? false : { pageSize: 8, hideOnSinglePage: true }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="这一轮委托已经处理完，可以安排生产或结束营业。"
            />
          ),
        }}
      />
      <Drawer
        title={order?.title ?? '委托详情'}
        open={!!order}
        onClose={() => setSelected(null)}
        size={480}
        footer={
          order ? (
            <Space wrap>
              {order.status === 'offered' ? (
                <Button
                  type="primary"
                  disabled={busy || acceptedCount >= 3}
                  onClick={() => act({ type: 'accept', id: order.id })}
                >
                  接下委托
                </Button>
              ) : null}
              {order.status === 'accepted' ? (
                <>
                  <Button
                    type="primary"
                    disabled={busy || !!issue}
                    icon={
                      order.kind === 'repair' ? (
                        <ToolOutlined />
                      ) : (
                        <ArrowRightOutlined />
                      )
                    }
                    onClick={() => act({ type: 'deliver', id: order.id })}
                  >
                    {order.kind === 'repair'
                      ? '执行并验收 · 2 行动'
                      : '交付订单 · 1 行动'}
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={() =>
                      modal.confirm({
                        title: '放弃这张委托？',
                        content:
                          state.day === 1
                            ? '教学日免费撤回，预留库存会释放。'
                            : '声望减少 1，预留库存会释放；不会扣金币。',
                        okText: '放弃委托',
                        cancelText: '继续处理',
                        onOk: async () => {
                          await act({ type: 'abandon', id: order.id });
                        },
                      })
                    }
                  >
                    放弃
                  </Button>
                </>
              ) : null}
            </Space>
          ) : null
        }
      >
        {order ? (
          <Space
            orientation="vertical"
            size={24}
            className={styles.detailStack}
          >
            <div className={styles.customerNote}>
              <span className={styles.avatar}>
                {order.customer === '小镇调度 AI'
                  ? 'AI'
                  : order.customer.slice(0, 1)}
              </span>
              <div>
                <strong>{order.customer}</strong>
                <p>{order.note}</p>
              </div>
            </div>
            <Descriptions
              column={1}
              size="small"
              items={[
                {
                  key: 'state',
                  label: '状态',
                  children: (
                    <Tag
                      color={order.status === 'completed' ? 'green' : 'blue'}
                    >
                      {statusNames[order.status]}
                    </Tag>
                  ),
                },
                {
                  key: 'deadline',
                  label: '交付期限',
                  children: `第 ${order.deadline} 日营业结束前`,
                },
                {
                  key: 'reward',
                  label: '验收收入',
                  children: `${rewardFor(state, order)} 金币 + 1 声望`,
                },
                {
                  key: 'actions',
                  label: '执行行动',
                  children:
                    order.kind === 'repair'
                      ? '2 点（含客户验收）'
                      : '1 点（整张订单）',
                },
              ]}
            />
            {repair ? (
              <div>
                <Typography.Title level={5}>诊断资料</Typography.Title>
                <p>{repair.symptoms}</p>
                <Alert type="info" title={repair.diagnosis} showIcon />
                <p className={styles.secondary}>验收要求：{repair.criteria}</p>
                <Typography.Title level={5}>选择维修方案</Typography.Title>
                <Radio.Group
                  value={order.planId}
                  disabled={
                    busy || !['accepted', 'offered'].includes(order.status)
                  }
                  onChange={(event) =>
                    act({
                      type: 'plan',
                      id: order.id,
                      planId: event.target.value,
                    })
                  }
                >
                  <Space orientation="vertical">
                    {REPAIRS[order.repair as RepairId].plans.map((plan) => (
                      <Radio key={plan.id} value={plan.id}>
                        <span>{plan.label}</span>
                        <div className={cx(styles.secondary, styles.small)}>
                          {plan.explanation}
                        </div>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </div>
            ) : null}
            {part ? (
              <div className={styles.detailResources}>
                <Typography.Title level={5}>
                  {order.kind === 'goods' ? '供货清单' : '所需备件'}
                </Typography.Title>
                <Descriptions
                  column={1}
                  size="small"
                  items={[
                    {
                      key: 'item',
                      label: '物品',
                      children: `${ITEMS[part].icon} ${ITEMS[part].name} ×${order.quantity}`,
                    },
                    {
                      key: 'held',
                      label: '实际库存',
                      children: state.inventory[part],
                    },
                    {
                      key: 'reserved',
                      label: '为本单预留',
                      children: order.reserved,
                    },
                    {
                      key: 'shortage',
                      label: '尚需补足',
                      children:
                        order.status === 'completed' ? '已消耗并交付' : missing,
                    },
                  ]}
                />
                {missing > 0 && order.status !== 'completed' ? (
                  <Space wrap>
                    <Button
                      disabled={
                        busy ||
                        state.cash < ITEMS[part].price * missing ||
                        state.purchased[part] + missing > ITEMS[part].limit
                      }
                      onClick={() =>
                        act({ type: 'buy', item: part, quantity: missing })
                      }
                    >
                      采购缺料 · {ITEMS[part].price * missing} 金币
                    </Button>
                    {order.kind === 'goods' ? (
                      <Button
                        onClick={() => {
                          setSelected(null);
                          navigate('/production');
                        }}
                      >
                        去安排生产
                      </Button>
                    ) : null}
                  </Space>
                ) : null}
              </div>
            ) : null}
            {issue ? <Alert title={issue} type="warning" showIcon /> : null}
            {order.status === 'completed' ? (
              <Alert
                type="success"
                showIcon
                title="已验收，收入与声望已入账。"
                description={
                  order.kind === 'repair'
                    ? '学校技术员：设备恢复正常了，谢谢你。'
                    : '食堂负责人：货已经收到了，孩子们很期待今天的饭菜。'
                }
              />
            ) : null}
            <Typography.Text type="secondary">
              查阅与修改方案不会推进时间。实际材料、行动和奖励在执行时一次结算。
            </Typography.Text>
          </Space>
        ) : null}
      </Drawer>
    </>
  );
}
