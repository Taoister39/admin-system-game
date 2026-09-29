import {
  ITEMS,
  ITEM_IDS,
  type ItemId,
  available,
  reserved,
} from '@common/game';
import {
  Alert,
  App,
  Button,
  Card,
  InputNumber,
  Modal,
  Space,
  Table,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import { useGame } from '../game/GameProvider';

const useStyles = createStyles(({ css, token }) => ({
  numeric: css`font-variant-numeric: tabular-nums;`,
  pageStack: css`width: 100%; h2 { margin-top: 0; }`,
  secondary: css`color: ${token.colorTextSecondary};`,
}));

export default function Inventory() {
  const { styles } = useStyles();
  const { state, busy, act } = useGame();
  const { message } = App.useApp();
  const [trade, setTrade] = useState<{
    item: ItemId;
    type: 'buy' | 'sell';
  } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const potatoLocked = state.day < 5 || state.reputation < 4;
  const columns: TableColumnsType<{ id: ItemId }> = [
    {
      title: '物品',
      key: 'name',
      render: (_, row) => (
        <span>
          {ITEMS[row.id].icon} {ITEMS[row.id].name}
        </span>
      ),
    },
    {
      title: '持有',
      key: 'quantity',
      render: (_, row) => state.inventory[row.id],
    },
    {
      title: '已预留',
      key: 'reserved',
      render: (_, row) => reserved(state, row.id),
    },
    {
      title: '可用',
      key: 'available',
      render: (_, row) => (
        <strong className={styles.numeric}>{available(state, row.id)}</strong>
      ),
    },
    {
      title: '采购价',
      key: 'price',
      render: (_, row) => `${ITEMS[row.id].price} 金币`,
    },
    {
      title: '今日可采购',
      key: 'limit',
      render: (_, row) => ITEMS[row.id].limit - state.purchased[row.id],
    },
    {
      title: '操作',
      key: 'action',
      render: (_, row) => (
        <Space>
          <Button
            size="small"
            disabled={
              busy ||
              (row.id.startsWith('potato') && potatoLocked) ||
              state.cash < ITEMS[row.id].price ||
              state.purchased[row.id] >= ITEMS[row.id].limit
            }
            onClick={() => {
              setTrade({ item: row.id, type: 'buy' });
              setQuantity(1);
            }}
          >
            采购
          </Button>
          {ITEMS[row.id].sellPrice ? (
            <Button
              size="small"
              disabled={
                busy ||
                state.actions < 1 ||
                available(state, row.id) < 1 ||
                state.soldToday >= 12
              }
              onClick={() => {
                setTrade({ item: row.id, type: 'sell' });
                setQuantity(1);
              }}
            >
              普通出售
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];
  const maximum = trade
    ? trade.type === 'buy'
      ? Math.min(
          ITEMS[trade.item].limit - state.purchased[trade.item],
          Math.floor(state.cash / ITEMS[trade.item].price),
        )
      : Math.min(available(state, trade.item), 12 - state.soldToday)
    : 1;
  const total = trade
    ? quantity *
      (trade.type === 'buy'
        ? ITEMS[trade.item].price
        : (ITEMS[trade.item].sellPrice ?? 0))
    : 0;
  return (
    <Space orientation="vertical" size={20} className={styles.pageStack}>
      <div>
        <Typography.Title level={2}>库存与采购</Typography.Title>
        <p className={styles.secondary}>
          每一份库存都有去向。已为订单预留的物品不能普通出售，取消订单会释放预留。
        </p>
      </div>
      <Alert
        type="info"
        title="新增库存会优先补足已接委托，按交付期限分配。未来产出不算实际库存。"
        showIcon
      />
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={ITEM_IDS.map((id) => ({ id }))}
          pagination={false}
          scroll={{ x: 760 }}
        />
      </Card>
      <Card title="普通收购">
        <p>
          收购萝卜 <strong>3 金币/份</strong>、土豆 <strong>4 金币/份</strong>
          。每个游戏日合计最多 12 份，已出售 {state.soldToday} 份。
        </p>
        <p className={styles.secondary}>
          委托单价更高，但需要提前安排。普通出售花 1
          点行动，适合处理余货。采购不花行动，仍会扣金币。
        </p>
      </Card>
      <Modal
        open={!!trade}
        title={
          trade
            ? `${trade.type === 'buy' ? '采购' : '普通出售'}${ITEMS[trade.item].name}`
            : ''
        }
        onCancel={() => setTrade(null)}
        okText={trade?.type === 'buy' ? '确认采购' : '确认出售'}
        cancelText="取消"
        confirmLoading={busy}
        okButtonProps={{
          disabled: maximum < 1 || quantity < 1 || quantity > maximum,
        }}
        onOk={async () => {
          if (!trade) return;
          if (
            trade.type === 'sell' &&
            trade.item !== 'radish' &&
            trade.item !== 'potato'
          ) {
            message.error('物品不可出售');
            return;
          }
          const success = await act(
            trade.type === 'buy'
              ? { type: 'buy', item: trade.item, quantity }
              : {
                  type: 'sell',
                  item: trade.item as 'radish' | 'potato',
                  quantity,
                },
          );
          if (success) setTrade(null);
        }}
      >
        <Space orientation="vertical" size={16}>
          <label htmlFor="trade-quantity">数量（最多 {maximum}）</label>
          <InputNumber
            id="trade-quantity"
            min={1}
            max={Math.max(1, maximum)}
            precision={0}
            value={quantity}
            onChange={(value) => setQuantity(value ?? 1)}
          />
          <div>
            合计 {trade?.type === 'buy' ? '支出' : '收入'}{' '}
            <strong>{total} 金币</strong> ·{' '}
            {trade?.type === 'buy' ? '不消耗行动' : '消耗 1 行动'}
          </div>
        </Space>
      </Modal>
    </Space>
  );
}
