import { createStyles } from 'antd-style';

const useStyles = createStyles(({ css, token }) => ({
  titlebar: css`
    flex: 0 0 36px;
    min-height: 36px;
    display: flex;
    align-items: center;
    padding: 0 140px 0 16px;
    overflow: hidden;
    white-space: nowrap;
    background: ${token.colorBgContainer};
    border-bottom: 1px solid ${token.colorBorderSecondary};
    color: ${token.colorTextSecondary};
    font-size: 12px;
    -webkit-app-region: drag;
  `,
}));

function TitleBar() {
  const { styles } = useStyles();
  if (!window.gameStorage) return null;
  return (
    <div className={styles.titlebar} aria-label="窗口标题栏">
      小镇事务所 · 管理系统经营游戏
    </div>
  );
}

export default TitleBar;
