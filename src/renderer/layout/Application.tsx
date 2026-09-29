import TitleBar from '@/layout/TitleBar';
import { applicationRoutes } from '@/routes/application';
import {
  CheckCircleOutlined,
  MenuOutlined,
  SettingOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { endPreview } from '@common/game';
import {
  Alert,
  App,
  Button,
  ConfigProvider,
  Drawer,
  Menu,
  Modal,
  Space,
  Tag,
  Typography,
  theme,
} from 'antd';
import { ThemeProvider, createStyles } from 'antd-style';
import zhCN from 'antd/locale/zh_CN';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useRoutes } from 'react-router-dom';
import { GameProvider, useGame } from '../game/GameProvider';
import Settings, { type Appearance } from '../pages/Settings';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: ${token.colorBgLayout};
    color: ${token.colorText};
    font-size: ${token.fontSize}px;
  `,
  layout: css`
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  `,
  sidebar: css`
    width: 224px;
    flex-shrink: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: ${token.colorBgContainer};
    border-right: 1px solid ${token.colorBorderSecondary};
    @media (max-width: 1200px) {
      width: 200px;
    }
    @media (max-width: 900px) {
      display: none;
    }
  `,
  brand: css`
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: 12px;
    padding: 28px 20px 32px;
    color: inherit;
    strong {
      font-size: 16px;
      font-weight: 600;
      overflow-wrap: anywhere;
    }
  `,
  brandIcon: css`
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    background: ${token.colorPrimary};
    color: ${token.colorTextLightSolid};
    border-radius: 12px;
    display: grid;
    place-items: center;
    font-size: 22px;
  `,
  navigation: css`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  `,
  menu: css`border-inline-end: 0 !important;`,
  sidebarBottom: css`
    flex-shrink: 0;
    padding: 28px 24px;
    border-top: 1px solid ${token.colorBorderSecondary};
    @media (max-height: 700px) {
      padding: 16px 24px;
    }
  `,
  main: css`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  `,
  topbar: css`
    flex-shrink: 0;
    min-height: 76px;
    padding: 16px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    background: ${token.colorBgContainer};
    border-bottom: 1px solid ${token.colorBorderSecondary};
    @media (max-width: 900px) {
      padding: 16px 20px;
    }
    @media (max-width: 600px) {
      padding: 12px 16px;
    }
  `,
  topbarLeft: css`display: flex; align-items: center; gap: 8px;`,
  mobileMenuButton: css`
    display: none;
    @media (max-width: 900px) {
      display: inline-flex;
    }
  `,
  content: css`
    flex: 1;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
  `,
  contentInner: css`
    width: 100%;
    max-width: 1550px;
    margin-inline: auto;
    padding: 28px 32px;
    @media (max-width: 1200px) {
      padding: 24px;
    }
    @media (max-width: 600px) {
      padding: 16px;
    }
  `,
  footer: css`
    font-size: ${token.fontSizeSM}px;
    color: ${token.colorTextSecondary};
    padding-top: 28px;
  `,
  secondary: css`color: ${token.colorTextSecondary};`,
  small: css`font-size: ${token.fontSizeSM}px;`,
  saveLabel: css`@media (max-width: 600px) { display: none; }`,
  saveError: css`margin-bottom: 20px;`,
  settlementStack: css`width: 100%;`,
  settlementMoney: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding: 16px;
    background: ${token.colorFillQuaternary};
    border-radius: ${token.borderRadius}px;
  `,
}));

function Shell({
  appearance,
  onAppearance,
}: { appearance: Appearance; onAppearance: (appearance: Appearance) => void }) {
  const { styles, cx } = useStyles();
  const { state, busy, saveError, act } = useGame();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [endDay, setEndDay] = useState<number | null>(null);
  const location = useLocation();
  const contentRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (location.pathname) contentRef.current?.scrollTo(0, 0);
  }, [location.pathname]);
  const pages = useRoutes([
    {
      path: '/settings',
      element: <Settings appearance={appearance} onAppearance={onAppearance} />,
    },
    ...applicationRoutes,
  ]);
  const items = applicationRoutes
    .filter((route) => route.label)
    .map((route) => ({
      key: route.path as string,
      icon: route.icon,
      label: <Link to={route.path as string}>{route.label}</Link>,
    }))
    .concat([
      {
        key: '/settings',
        icon: <SettingOutlined />,
        label: <Link to="/settings">事务所设置</Link>,
      },
    ]);
  const preview = endPreview(state);
  const currentTitle = items.find(
    (item) => item.key === location.pathname,
  )?.label;
  const navigation = (
    <Menu
      mode="inline"
      items={items}
      selectedKeys={[location.pathname]}
      onClick={() => setMobileMenu(false)}
      className={styles.menu}
    />
  );
  return (
    <div className={styles.container}>
      <TitleBar />
      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="事务所侧栏">
          <Link to="/home" className={styles.brand}>
            <span className={styles.brandIcon}>
              <ShopOutlined />
            </span>
            <div>
              <strong>{state.name}</strong>
              <div className={cx(styles.secondary, styles.small)}>
                TOWN OFFICE
              </div>
            </div>
          </Link>
          <nav aria-label="事务所导航" className={styles.navigation}>
            {navigation}
          </nav>
          <div className={styles.sidebarBottom}>
            <Tag color={state.chapterComplete ? 'green' : 'blue'}>
              {state.chapterComplete ? '正式营业' : '试营业'}
            </Tag>
            <p className={cx(styles.secondary, styles.small)}>
              一张张委托，
              <br />
              让日常慢慢变好。
            </p>
            <span className={cx(styles.secondary, styles.small)}>
              v0.1 · 离线经营
            </span>
          </div>
        </aside>
        <div className={styles.main}>
          <header className={styles.topbar} aria-label="营业操作栏">
            <div className={styles.topbarLeft}>
              <Button
                className={styles.mobileMenuButton}
                icon={<MenuOutlined />}
                aria-label="打开导航"
                onClick={() => setMobileMenu(true)}
              />
              <span className={styles.secondary}>事务所 /</span>{' '}
              <span>{currentTitle}</span>
            </div>
            <Space wrap>
              <Tag>第 {state.day} 日</Tag>
              <span className={cx(styles.secondary, styles.saveLabel)}>
                <CheckCircleOutlined />{' '}
                {busy ? '保存中…' : saveError ? '保存失败' : '进度留在本地'}
              </span>
              <Button
                type="primary"
                disabled={busy}
                onClick={() => setEndDay(state.day)}
              >
                结束营业
              </Button>
            </Space>
          </header>
          <main
            className={styles.content}
            ref={contentRef}
            aria-label="经营内容"
          >
            <div className={styles.contentInner}>
              {saveError ? (
                <Alert
                  role="alert"
                  type="error"
                  showIcon
                  title={saveError}
                  className={styles.saveError}
                />
              ) : null}
              {pages}
              <footer className={styles.footer}>
                时间由你推进。今天没有做完的事，可以先检查交期，再决定什么时候继续。
              </footer>
            </div>
          </main>
        </div>
        <Drawer
          title={state.name}
          placement="left"
          size={260}
          open={mobileMenu}
          onClose={() => setMobileMenu(false)}
        >
          {navigation}
        </Drawer>
        <Modal
          title={`第 ${endDay ?? state.day} 日 · 营业结算`}
          open={endDay !== null}
          onCancel={() => setEndDay(null)}
          okText="确认结算，进入下一日"
          cancelText="继续处理"
          confirmLoading={busy}
          onOk={async () => {
            if (endDay !== null && (await act({ type: 'end', day: endDay })))
              setEndDay(null);
          }}
        >
          <Space
            orientation="vertical"
            size={16}
            className={styles.settlementStack}
          >
            <Typography.Paragraph>
              还有 <strong>{preview.unused}</strong> 点行动未使用。结算后恢复为
              6 点，所有生长中的作物推进一次。
            </Typography.Paragraph>
            <div className={styles.settlementMoney}>
              <span>本日经营开支</span>
              <strong>
                {preview.fee} 金币{state.day === 1 ? '（教学日免收）' : ''}
              </strong>
            </div>
            {preview.overdue.length ? (
              <Alert
                type="warning"
                showIcon
                title={`${preview.overdue.length} 张已接委托将在结算后逾期`}
                description={
                  <ul>
                    {preview.overdue.map((order) => (
                      <li key={order.id}>{order.title}</li>
                    ))}
                  </ul>
                }
              />
            ) : (
              <Alert type="success" showIcon title="没有已接委托会逾期。" />
            )}
            {preview.maturing.length ? (
              <div>
                明早可收获：
                {preview.maturing.map((plot) => `地块 ${plot.id}`).join('、')}。
              </div>
            ) : null}
            <Typography.Text type="secondary">
              到期但未接的委托不会处罚；未使用的行动不累计。可以取消结算，继续调整安排。
            </Typography.Text>
          </Space>
        </Modal>
      </div>
    </div>
  );
}

function readAppearance(): Appearance {
  try {
    const saved = JSON.parse(
      localStorage.getItem('town-office.appearance') ?? '{}',
    );
    return {
      theme: saved.theme === 'dark' ? 'dark' : 'light',
      largeText: saved.largeText === true,
    };
  } catch {
    return { theme: 'light', largeText: false };
  }
}
function Application() {
  const [appearance, setAppearance] = useState<Appearance>(readAppearance);
  useEffect(() => {
    try {
      localStorage.setItem(
        'town-office.appearance',
        JSON.stringify(appearance),
      );
    } catch {}
  }, [appearance]);
  return (
    <ConfigProvider locale={zhCN}>
      <ThemeProvider
        appearance={appearance.theme}
        theme={{
          algorithm:
            appearance.theme === 'dark'
              ? theme.darkAlgorithm
              : theme.defaultAlgorithm,
          token: {
            colorPrimary: '#3975d5',
            borderRadius: 8,
            fontSize: appearance.largeText ? 16 : 14,
            fontFamily: 'Inter, "Microsoft YaHei", system-ui, sans-serif',
          },
        }}
      >
        <App>
          <GameProvider>
            <Shell appearance={appearance} onAppearance={setAppearance} />
          </GameProvider>
        </App>
      </ThemeProvider>
    </ConfigProvider>
  );
}
export default Application;
