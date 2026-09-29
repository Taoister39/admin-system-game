import { initialGame, parseGameSave } from '@common/game';
import {
  Alert,
  App,
  Button,
  Card,
  Input,
  Select,
  Space,
  Typography,
  Upload,
} from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
import { useGame } from '../game/GameProvider';
import { downloadSave, storage } from '../game/storage';

const useStyles = createStyles(({ css, token }) => ({
  pageStack: css`width: 100%; h2 { margin-top: 0; }`,
  secondary: css`color: ${token.colorTextSecondary};`,
  settingsRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  `,
  nameInput: css`margin-top: 8px;`,
  appearanceSelect: css`width: 160px;`,
  saveLocation: css`
    font-size: ${token.fontSizeSM}px;
    color: ${token.colorTextSecondary};
    overflow-wrap: anywhere;
  `,
}));

export interface Appearance {
  theme: 'light' | 'dark';
  largeText: boolean;
}
export default function Settings({
  appearance,
  onAppearance,
}: { appearance: Appearance; onAppearance: (value: Appearance) => void }) {
  const { styles } = useStyles();
  const { state, busy, act, replace } = useGame();
  const { modal, message } = App.useApp();
  const [name, setName] = useState(state.name);
  const [location, setLocation] = useState('正在读取…');
  useEffect(() => {
    storage
      .location()
      .then(setLocation)
      .catch(() => setLocation('暂时无法读取存档位置'));
  }, []);
  function importFile(file: File) {
    if (file.size > 2_000_000) {
      message.error('存档超过 2 MB。');
      return false;
    }
    file
      .text()
      .then((raw) => {
        const next = parseGameSave(raw);
        modal.confirm({
          title: `继续第 ${next.day} 日的「${next.name}」？`,
          content: '当前有效存档将保留为上次备份，导入后替换当前进度。',
          okText: '确认导入',
          cancelText: '取消',
          onOk: async () => {
            if (!(await replace(next))) throw new Error('导入未完成');
            message.success('存档已导入');
            setName(next.name);
          },
        });
      })
      .catch((error) =>
        message.error(error instanceof Error ? error.message : '读取失败'),
      );
    return false;
  }
  return (
    <Space orientation="vertical" size={20} className={styles.pageStack}>
      <div>
        <Typography.Title level={2}>事务所设置</Typography.Title>
        <p className={styles.secondary}>
          随时停下来。关闭游戏期间，订单、作物与现金都保持原样。
        </p>
      </div>
      <Card title="事务所与阅读">
        <Space orientation="vertical" size={20} className={styles.pageStack}>
          <div>
            <label htmlFor="office-name">事务所名称</label>
            <Space.Compact block className={styles.nameInput}>
              <Input
                id="office-name"
                maxLength={20}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Button
                disabled={busy || !name.trim()}
                onClick={async () => {
                  if (await act({ type: 'rename', name }))
                    message.success('名称已更新');
                }}
              >
                保存名称
              </Button>
            </Space.Compact>
          </div>
          <div className={styles.settingsRow}>
            <span>界面主题</span>
            <Select
              aria-label="界面主题"
              value={appearance.theme}
              options={[
                { value: 'light', label: '明亮' },
                { value: 'dark', label: '深色' },
              ]}
              onChange={(theme) => onAppearance({ ...appearance, theme })}
              className={styles.appearanceSelect}
            />
          </div>
          <div className={styles.settingsRow}>
            <span>阅读字号</span>
            <Select
              aria-label="阅读字号"
              value={appearance.largeText ? 'large' : 'normal'}
              options={[
                { value: 'normal', label: '标准' },
                { value: 'large', label: '较大' },
              ]}
              onChange={(value) =>
                onAppearance({ ...appearance, largeText: value === 'large' })
              }
              className={styles.appearanceSelect}
            />
          </div>
        </Space>
      </Card>
      <Card title="存档与备份">
        <p>
          每次有效操作保存成功后才会提交进度。最近一次有效存档会保留为备份。
        </p>
        <p className={styles.saveLocation}>存档位置：{location}</p>
        <Space wrap>
          <Button
            disabled={busy}
            onClick={() =>
              downloadSave(
                JSON.stringify(state, null, 2),
                `town-office-day-${state.day}.json`,
              )
            }
          >
            导出当前存档
          </Button>
          <Upload
            accept=".json"
            showUploadList={false}
            beforeUpload={importFile}
          >
            <Button disabled={busy}>导入备份</Button>
          </Upload>
          <Button
            disabled={busy}
            onClick={async () => {
              try {
                const next = parseGameSave(await storage.backup());
                modal.confirm({
                  title: `恢复第 ${next.day} 日的上次备份？`,
                  content:
                    '将回到前一次有效操作的进度。当前有效档案会被保存为备份。',
                  okText: '恢复备份',
                  cancelText: '取消',
                  onOk: async () => {
                    if (!(await replace(next))) throw new Error('恢复未完成');
                    setName(next.name);
                    message.success('已恢复');
                  },
                });
              } catch {
                message.warning('暂时没有可恢复的有效备份。');
              }
            }}
          >
            恢复上次有效存档
          </Button>
        </Space>
      </Card>
      <Card title="重新经营">
        <p className={styles.secondary}>
          重新开始会替换当前进度。建议先导出存档，保留这家事务所的故事。
        </p>
        <Button
          danger
          disabled={busy}
          onClick={() =>
            modal.confirm({
              title: '重新开始第一天？',
              content: '当前有效进度会保留为上次备份，新游戏从 200 金币开始。',
              okText: '重新开始',
              okButtonProps: { danger: true },
              cancelText: '取消',
              onOk: async () => {
                if (!(await replace(initialGame())))
                  throw new Error('重置未完成');
                setName('小镇事务所');
              },
            })
          }
        >
          重新开始
        </Button>
      </Card>
      <Alert
        type="info"
        title="所有委托都是虚构内容。游戏不需要账号、联网或 AI API Key。"
        showIcon
      />
    </Space>
  );
}
