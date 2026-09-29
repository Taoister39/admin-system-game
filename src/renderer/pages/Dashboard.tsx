import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  CoffeeOutlined,
  DollarOutlined,
  FieldTimeOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { chapterProgress } from '@common/game';
import {
  Alert,
  Button,
  Card,
  Progress,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import { createStyles } from 'antd-style';
import { Link } from 'react-router-dom';
import { OrdersPanel } from '../components/OrdersPanel';
import { useGame } from '../game/GameProvider';

const dailyMessages = [
  [
    '开门营业，慢慢来。',
    '老店长给你留了两张委托和一块成熟的萝卜地。今天先把经营流程走通。',
  ],
  [
    '给明天留一点准备。',
    '接单前看一眼交期。采购可以救急，自己种植会有更好的材料收益。',
  ],
  [
    '种下的准备，开始有回报。',
    '检查成熟地块，收获会优先补足已接订单的库存。小镇调度 AI 也带来了新委托。',
  ],
  [
    '专业，就是把事情做明白。',
    '散热工单已经开放。诊断资料会告诉你怎样通过验收，不需要现实维修知识。',
  ],
  [
    '事务所可以长大一点了。',
    '声望达到 4 后可升级设施、种植土豆。扩地与维修台都能改变经营能力。',
  ],
  [
    '今天，按你的节奏安排。',
    '供货与维修共享行动额度。可以选择几张适合的委托，也可以提前结束营业。',
  ],
  [
    '看看这一周留下了什么。',
    '满足章节目标就能获得正式营业认证。目标没有时限，接下来仍可继续经营。',
  ],
];
const useStyles = createStyles(({ css, token }) => ({
  pageStack: css`width: 100%; h2 { margin-top: 0; }`,
  welcome: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    h2 {
      margin: 10px 0 8px;
    }
    p {
      margin: 0;
      max-width: 760px;
    }
    @media (max-width: 600px) {
      h2 {
        font-size: 23px;
      }
    }
  `,
  secondary: css`color: ${token.colorTextSecondary};`,
  welcomeMark: css`
    font-size: 54px;
    color: ${token.colorSuccess};
    opacity: 0.6;
    padding: 8px 16px;
    @media (max-width: 600px) {
      display: none;
    }
  `,
  statGrid: css`
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    @media (max-width: 900px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    @media (max-width: 600px) {
      gap: 10px;
    }
  `,
  dashboardGrid: css`
    display: grid;
    grid-template-columns: minmax(0, 1.8fr) minmax(300px, 1fr);
    gap: 20px;
    align-items: start;
    @media (max-width: 1200px) {
      grid-template-columns: minmax(0, 1fr);
    }
  `,
  goalList: css`margin: 16px 0;`,
  goalRow: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 10px 0;
  `,
  successText: css`color: ${token.colorSuccess};`,
  goalDot: css`
    display: inline-block;
    width: 10px;
    height: 10px;
    border: 1px solid ${token.colorTextSecondary};
    border-radius: 50%;
    margin-right: 4px;
  `,
  numeric: css`font-variant-numeric: tabular-nums;`,
  small: css`font-size: ${token.fontSizeSM}px;`,
  activityLine: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  `,
}));

export default function Dashboard() {
  const { styles, cx } = useStyles();
  const { state, busy, act } = useGame();
  const goals = chapterProgress(state);
  const complete = goals.reduce((sum, goal) => sum + goal.current, 0);
  const total = goals.reduce((sum, goal) => sum + goal.total, 0);
  const [title, message] = dailyMessages[Math.min(state.day - 1, 6)];
  const matured = state.plots.filter(
    (plot) => plot.crop && plot.remaining === 0,
  );
  const pending = state.orders.filter((order) => order.status === 'accepted');
  const latest = state.ledger.at(-1);
  return (
    <Space orientation="vertical" size={20} className={styles.pageStack}>
      <div className={styles.welcome}>
        <div>
          <Tag color="blue">
            第 {state.day} 日 · {state.chapterComplete ? '正式营业' : '试营业'}
          </Tag>
          <Typography.Title level={2}>
            {state.chapterComplete ? '把小镇的日常，照料得更好。' : title}
          </Typography.Title>
          <p className={styles.secondary}>
            {state.chapterComplete
              ? '章节目标已经完成。继续经营，或试一试另一种资源安排。'
              : message}
          </p>
        </div>
        <div className={styles.welcomeMark} aria-hidden="true">
          <CoffeeOutlined />
        </div>
      </div>
      {!state.tutorialDismissed ? (
        <Alert
          type="info"
          showIcon
          title="后台里，每一张表都对应小镇的一件事。"
          description={
            <div>
              接单与采购不消耗行动；收获、播种、交付与维修才消耗。只有“结束营业”会推进一天。
              <Button
                type="link"
                size="small"
                disabled={busy}
                onClick={() => act({ type: 'dismissTutorial' })}
              >
                知道了
              </Button>
            </div>
          }
        />
      ) : null}
      <div className={styles.statGrid}>
        <Card>
          <Statistic
            title="周转资金"
            value={state.cash}
            suffix="金币"
            prefix={<DollarOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="今日行动"
            value={state.actions}
            suffix="/ 6"
            prefix={<FieldTimeOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="在办委托"
            value={pending.length}
            suffix="/ 3"
            prefix={<CheckCircleOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="客户声望"
            value={state.reputation}
            prefix={<StarOutlined />}
          />
        </Card>
      </div>
      {matured.length ? (
        <Alert
          title={`${matured.length} 块地已经成熟，可以收获。成熟作物会留在地里，不会腐烂。`}
          type="success"
          showIcon
          action={
            <Link to="/production">
              <Button size="small">去收获</Button>
            </Link>
          }
        />
      ) : null}
      {state.cash < 20 && state.rescueDay !== state.day ? (
        <Alert
          type="warning"
          title="老店长有一份整理资料的委托"
          description="不需要材料，花 2 点行动获得 25 金币，帮助你恢复周转。每天最多一次。"
          action={
            <Button
              disabled={busy || state.actions < 2}
              onClick={() => act({ type: 'rescue' })}
            >
              整理资料 · 2 行动
            </Button>
          }
          showIcon
        />
      ) : null}
      <div className={styles.dashboardGrid}>
        <Card
          title="今天的业务"
          extra={
            <Link to="/orders">
              全部委托 <ArrowRightOutlined />
            </Link>
          }
        >
          <OrdersPanel compact />
        </Card>
        <Card
          title={state.chapterComplete ? '正式营业认证' : '七日经营章节'}
          extra={
            <Tag color={state.chapterComplete ? 'green' : 'default'}>
              {state.chapterComplete ? '已完成' : '成长目标'}
            </Tag>
          }
        >
          <Progress
            percent={Math.round((complete / total) * 100)}
            strokeColor="#4a8f74"
          />
          <div className={styles.goalList}>
            {goals.map((goal) => (
              <div key={goal.label} className={styles.goalRow}>
                <span>
                  {goal.current === goal.total ? (
                    <CheckCircleOutlined className={styles.successText} />
                  ) : (
                    <span className={styles.goalDot} />
                  )}{' '}
                  {goal.label}
                </span>
                <span className={cx(styles.secondary, styles.numeric)}>
                  {goal.current}/{goal.total}
                </span>
              </div>
            ))}
          </div>
          <p className={cx(styles.secondary, styles.small)}>
            第 7 日起核对认证。七日是引导长度，目标没有失败期限。
          </p>
          <Link to="/production">
            <Button block>查看设施与生产</Button>
          </Link>
        </Card>
      </div>
      <Card size="small">
        <div className={styles.activityLine}>
          <span className={cx(styles.secondary, styles.small)}>
            最近一条业务记录
          </span>
          <span aria-live="polite">{latest?.text}</span>
          <Link to="/records">查看流水</Link>
        </div>
      </Card>
    </Space>
  );
}
