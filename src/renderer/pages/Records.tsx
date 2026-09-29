import { Card, Empty, Segmented, Table, Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import { useGame } from '../game/GameProvider';

const useStyles = createStyles(({ css, token }) => ({
  pageStack: css`width: 100%; h2 { margin-top: 0; }`,
  secondary: css`color: ${token.colorTextSecondary};`,
  small: css`font-size: ${token.fontSizeSM}px;`,
}));

export default function Records() {
  const { styles, cx } = useStyles();
  const { state } = useGame();
  const [view, setView] = useState('业务流水');
  return (
    <div className={styles.pageStack}>
      <Typography.Title level={2}>经营记录</Typography.Title>
      <p className={styles.secondary}>
        现金收支与库存变化各有记录。收入不等于利润，日常开支在营业结算时扣除。
      </p>
      <Card
        extra={
          <Segmented
            options={['业务流水', '经营日报']}
            value={view}
            onChange={setView}
          />
        }
        title="事务所档案"
      >
        {view === '业务流水' ? (
          <Table
            rowKey="id"
            dataSource={[...state.ledger].reverse()}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            scroll={{ x: 580 }}
            columns={[
              {
                title: '游戏日',
                dataIndex: 'day',
                width: 90,
                render: (value) => `第 ${value} 日`,
              },
              { title: '事项', dataIndex: 'text' },
              {
                title: '金币变化',
                dataIndex: 'cash',
                width: 100,
                render: (value) =>
                  value ? (
                    <Tag color={value > 0 ? 'green' : 'default'}>
                      {value > 0 ? '+' : ''}
                      {value}
                    </Tag>
                  ) : (
                    '—'
                  ),
              },
              {
                title: '行动变化',
                dataIndex: 'action',
                width: 100,
                render: (value) => value || '—',
              },
            ]}
          />
        ) : (
          <Table
            rowKey="day"
            dataSource={[...state.reports].reverse()}
            pagination={{ pageSize: 8, hideOnSinglePage: true }}
            scroll={{ x: 720 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="结束第一天营业后，会留下第一份日报。"
                />
              ),
            }}
            columns={[
              {
                title: '游戏日',
                dataIndex: 'day',
                render: (value) => `第 ${value} 日`,
              },
              { title: '完成委托', dataIndex: 'completed' },
              { title: '营业收入', dataIndex: 'income' },
              { title: '采购/升级', dataIndex: 'spending' },
              { title: '经营开支', dataIndex: 'fee' },
              { title: '逾期', dataIndex: 'overdue' },
              { title: '期末现金', dataIndex: 'cash' },
            ]}
          />
        )}
      </Card>
      <p className={cx(styles.secondary, styles.small)}>
        保留最近 500 条流水与 100
        个游戏日的日报。已完成委托的验收结果也写入流水。
      </p>
    </div>
  );
}
