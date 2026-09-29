import { CROPS, type CropId, ITEMS } from '@common/game';
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../game/GameProvider';

const useStyles = createStyles(({ css, token }) => ({
  pageStack: css`width: 100%; h2 { margin-top: 0; }`,
  secondary: css`color: ${token.colorTextSecondary};`,
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
  small: css`font-size: ${token.fontSizeSM}px;`,
  plotGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(210px, 100%), 1fr));
    gap: 16px;
  `,
  plotHeading: css`display: flex; justify-content: space-between; gap: 8px;`,
  plotSymbol: css`font-size: 38px; padding-top: 20px;`,
  batchBar: css`padding-top: 20px;`,
  twoColumn: css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
    @media (max-width: 600px) {
      grid-template-columns: minmax(0, 1fr);
    }
  `,
  maturePlot: css`border-color: ${token.colorSuccessBorder};`,
  cropSelect: css`width: 140px;`,
}));

export default function Production() {
  const { styles, cx } = useStyles();
  const { state, busy, act } = useGame();
  const { modal } = App.useApp();
  const [crop, setCrop] = useState<CropId>('radish');
  const [selected, setSelected] = useState<number[]>([]);
  const seed = CROPS[crop].seed;
  const selectedPlots = state.plots.filter((plot) =>
    selected.includes(plot.id),
  );
  const empty = selectedPlots.filter((plot) => !plot.crop);
  const mature = selectedPlots.filter(
    (plot) => plot.crop && plot.remaining === 0,
  );
  const potatoesUnlocked = state.day >= 5 && state.reputation >= 4;
  function upgrade(facility: 'farm' | 'workshop') {
    modal.confirm({
      title: facility === 'farm' ? '扩建农场？' : '升级维修台？',
      content:
        facility === 'farm'
          ? '花费 120 金币与 1 点行动，新增一块地。'
          : '花费 120 金币与 1 点行动，今后每张维修委托收入增加 10 金币。',
      okText: '确认升级',
      cancelText: '取消',
      onOk: async () => {
        if (!(await act({ type: 'upgrade', facility })))
          throw new Error('升级未完成');
      },
    });
  }
  return (
    <Space orientation="vertical" size={20} className={styles.pageStack}>
      <div>
        <Typography.Title level={2}>生产与设施</Typography.Title>
        <p className={styles.secondary}>
          安排未来的产出，也给今天留出处理工单的行动。作物只在营业结算时生长。
        </p>
      </div>
      <Card
        title="农场生产计划"
        extra={<Tag color="green">{state.plots.length} 块地</Tag>}
      >
        <div className={styles.filterBar}>
          <Space wrap>
            <span>播种作物</span>
            <Select
              aria-label="播种作物"
              value={crop}
              onChange={setCrop}
              className={styles.cropSelect}
              options={[
                { value: 'radish', label: '萝卜 · 2 日' },
                {
                  value: 'potato',
                  label: '土豆 · 3 日',
                  disabled: !potatoesUnlocked,
                },
              ]}
            />
            <span className={cx(styles.secondary, styles.small)}>
              {ITEMS[seed].name}库存：{state.inventory[seed]} · 单块产出{' '}
              {CROPS[crop].yield} 份
            </span>
          </Space>
          <Button
            disabled={
              busy ||
              state.cash < ITEMS[seed].price ||
              state.purchased[seed] >= ITEMS[seed].limit
            }
            onClick={() => act({ type: 'buy', item: seed, quantity: 1 })}
          >
            采购一份种子 · {ITEMS[seed].price} 金币
          </Button>
        </div>
        <div className={styles.plotGrid}>
          {state.plots.map((plot) => (
            <Card
              key={plot.id}
              size="small"
              className={
                plot.crop && plot.remaining === 0 ? styles.maturePlot : ''
              }
            >
              <div className={styles.plotHeading}>
                <Checkbox
                  aria-label={`选择地块 ${plot.id}`}
                  checked={selected.includes(plot.id)}
                  onChange={(event) =>
                    setSelected(
                      event.target.checked
                        ? [...selected, plot.id]
                        : selected.filter((id) => id !== plot.id),
                    )
                  }
                >
                  地块 {plot.id}
                </Checkbox>
                <Tag
                  color={
                    !plot.crop
                      ? 'default'
                      : plot.remaining === 0
                        ? 'green'
                        : 'blue'
                  }
                >
                  {!plot.crop
                    ? '空闲'
                    : plot.remaining === 0
                      ? '可收获'
                      : '生长中'}
                </Tag>
              </div>
              <div className={styles.plotSymbol} aria-hidden="true">
                {plot.crop ? ITEMS[plot.crop].icon : '🌱'}
              </div>
              <Typography.Title level={4}>
                {plot.crop ? ITEMS[plot.crop].name : '准备下一次播种'}
              </Typography.Title>
              <p className={cx(styles.secondary, styles.small)}>
                {!plot.crop
                  ? `播种${ITEMS[crop].name}后，第 ${state.day + CROPS[crop].days} 日可收获。`
                  : plot.remaining === 0
                    ? `${CROPS[plot.crop].yield} 份作物等待入库，不会腐烂。`
                    : `预计第 ${state.day + plot.remaining} 日可收获 ${CROPS[plot.crop].yield} 份。`}
              </p>
              {!plot.crop ? (
                <Button
                  block
                  disabled={
                    busy ||
                    state.actions < 1 ||
                    state.inventory[seed] < 1 ||
                    (crop === 'potato' && !potatoesUnlocked)
                  }
                  onClick={() => act({ type: 'plant', crop, ids: [plot.id] })}
                >
                  播种 · 1 行动
                </Button>
              ) : plot.remaining === 0 ? (
                <Button
                  type="primary"
                  block
                  disabled={busy || state.actions < 1}
                  onClick={() => act({ type: 'harvest', ids: [plot.id] })}
                >
                  收获 · 1 行动
                </Button>
              ) : (
                <Button block disabled>
                  等待营业结算
                </Button>
              )}
            </Card>
          ))}
        </div>
        <div className={styles.batchBar}>
          <Space wrap>
            <span className={cx(styles.secondary, styles.small)}>
              已选 {selected.length} 块
            </span>
            <Button
              disabled={
                busy ||
                !empty.length ||
                state.actions < empty.length ||
                state.inventory[seed] < empty.length
              }
              onClick={async () => {
                if (
                  await act({
                    type: 'plant',
                    crop,
                    ids: empty.map((p) => p.id),
                  })
                )
                  setSelected([]);
              }}
            >
              批量播种空闲地 · {empty.length} 行动
            </Button>
            <Button
              disabled={busy || !mature.length || state.actions < mature.length}
              onClick={async () => {
                if (
                  await act({ type: 'harvest', ids: mature.map((p) => p.id) })
                )
                  setSelected([]);
              }}
            >
              批量收获成熟地 · {mature.length} 行动
            </Button>
          </Space>
        </div>
        {!potatoesUnlocked ? (
          <p className={cx(styles.secondary, styles.small)}>
            第 5 日且声望达到 4 后开放土豆。基础批量处理从第一天就能使用。
          </p>
        ) : null}
      </Card>
      <div className={styles.twoColumn}>
        <Card
          title="农场扩容"
          extra={
            <Tag>{state.plots.length === 3 ? '已升级' : '可扩建一次'}</Tag>
          }
        >
          <Typography.Title level={4}>多一块地，多一种安排。</Typography.Title>
          <p className={styles.secondary}>
            地块 2 → 3。可以扩大同一种作物的供货，也可以交错安排成熟日期。
          </p>
          <Button
            type="primary"
            disabled={
              busy ||
              state.reputation < 4 ||
              state.cash < 120 ||
              state.actions < 1 ||
              state.plots.length === 3
            }
            onClick={() => upgrade('farm')}
          >
            扩建 · 120 金币 / 1 行动
          </Button>
        </Card>
        <Card title="维修台升级" extra={<Tag>Lv.{state.workshopLevel}</Tag>}>
          <Typography.Title level={4}>
            熟练的工具，让服务更有价值。
          </Typography.Title>
          <p className={styles.secondary}>
            升级后每张维修单的验收收入 +10。已接但尚未完成的工单同样受益。
          </p>
          <Button
            type="primary"
            disabled={
              busy ||
              state.reputation < 4 ||
              state.cash < 120 ||
              state.actions < 1 ||
              state.workshopLevel === 2
            }
            onClick={() => upgrade('workshop')}
          >
            升级 · 120 金币 / 1 行动
          </Button>
        </Card>
      </div>
      {state.reputation < 4 ? (
        <Alert
          type="info"
          showIcon
          title="先让客户认识你：声望达到 4 后可以升级设施。"
        />
      ) : null}
      <Card title="维修服务">
        <p className={styles.secondary}>
          维修方案与验收在订单详情中处理。当前维修台 Lv.{state.workshopLevel}
          ，每张工单需要 2 点行动
          {state.workshopLevel === 2 ? '，验收收入额外增加 10 金币' : ''}。
        </p>
        <Link to="/orders">
          <Button>查看与处理维修工单</Button>
        </Link>
      </Card>
    </Space>
  );
}
