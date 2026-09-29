import { Card, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { OrdersPanel } from '../components/OrdersPanel';

const useStyles = createStyles(({ css, token }) => ({
  pageStack: css`width: 100%; h2 { margin-top: 0; }`,
  secondary: css`color: ${token.colorTextSecondary};`,
}));

export default function Orders() {
  const { styles } = useStyles();
  return (
    <div className={styles.pageStack}>
      <Typography.Title level={2}>订单中心</Typography.Title>
      <p className={styles.secondary}>
        承接小镇的需求，在截止游戏日营业结束前交付。未接下的委托到期不会处罚。
      </p>
      <Card>
        <OrdersPanel />
      </Card>
    </div>
  );
}
