import type { SaveLoad } from '@common/bridge';
import {
  type Command,
  type GameState,
  initialGame,
  parseGameSave,
  transition,
} from '@common/game';
import { App, Button, Card, Result, Space, Spin, Upload } from 'antd';
import { createStyles } from 'antd-style';
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { downloadSave, storage } from './storage';

const useStyles = createStyles(({ css, token }) => ({
  bootScreen: css`
    height: 100dvh;
    overflow: auto;
    padding: 32px;
    display: flex;
    align-items: safe center;
    justify-content: center;
    background: ${token.colorBgLayout};
  `,
}));

interface GameContextValue {
  state: GameState;
  busy: boolean;
  saveError: string | null;
  act: (command: Command) => Promise<boolean>;
  replace: (state: GameState) => Promise<boolean>;
}
const GameContext = createContext<GameContextValue | null>(null);
export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('游戏尚未就绪。');
  return context;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const { styles } = useStyles();
  const { message, modal } = App.useApp();
  const [state, setState] = useState<GameState | null>(null);
  const [load, setLoad] = useState<SaveLoad | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const current = useRef<GameState | null>(null);
  const locked = useRef(false);
  useEffect(() => {
    let active = true;
    storage
      .load()
      .then((result) => {
        if (!active) return;
        setLoad(result);
        if (!result.warning) {
          const game = result.raw ? parseGameSave(result.raw) : initialGame();
          current.current = game;
          setState(game);
        }
      })
      .catch(() => {
        if (active)
          setLoad({
            raw: null,
            backupAvailable: false,
            warning: '读取存档失败，现有数据不会被覆盖。',
          });
      });
    return () => {
      active = false;
    };
  }, []);
  async function commit(next: GameState) {
    locked.current = true;
    setBusy(true);
    try {
      await storage.save(JSON.stringify(next));
      current.current = next;
      setState(next);
      setSaveError(null);
      return true;
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : '请检查存储空间与目录权限。';
      setSaveError(`保存失败，本次操作未提交：${detail}`);
      message.error('保存失败，本次操作未提交。可以导出当前进度后重试。');
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function act(command: Command) {
    if (locked.current || !current.current) return false;
    try {
      return await commit(transition(current.current, command));
    } catch (error) {
      message.warning(error instanceof Error ? error.message : '操作未完成。');
      return false;
    }
  }
  async function replace(next: GameState) {
    if (locked.current) return false;
    return commit(parseGameSave(JSON.stringify(next)));
  }
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
          title: `导入第 ${next.day} 日的「${next.name}」？`,
          content: '当前有效存档会保留为上次备份。导入后将继续所选进度。',
          okText: '导入存档',
          cancelText: '取消',
          onOk: async () => {
            if (!(await replace(next))) throw new Error('导入失败');
          },
        });
      })
      .catch((error) =>
        message.error(
          error instanceof Error ? error.message : '读取存档失败。',
        ),
      );
    return false;
  }
  if (!load)
    return (
      <div className={styles.bootScreen}>
        <Spin description="正在读取事务所档案…" />
      </div>
    );
  if (!state)
    return (
      <div className={styles.bootScreen}>
        <Card>
          <Result
            status="warning"
            title="先恢复经营档案"
            subTitle={load.warning}
            extra={
              <Space wrap>
                <Button
                  type="primary"
                  disabled={!load.backupAvailable || busy}
                  onClick={async () => {
                    try {
                      await replace(parseGameSave(await storage.backup()));
                    } catch {
                      message.error('备份不可用，请导入其他备份。');
                    }
                  }}
                >
                  恢复上次有效备份
                </Button>
                <Upload
                  accept=".json"
                  showUploadList={false}
                  beforeUpload={importFile}
                >
                  <Button disabled={busy}>导入存档</Button>
                </Upload>
                {load.corruptRaw ? (
                  <Button
                    onClick={() =>
                      downloadSave(
                        load.corruptRaw as string,
                        'town-office-unreadable.json',
                      )
                    }
                  >
                    导出原始数据
                  </Button>
                ) : null}
                <Button
                  disabled={busy}
                  onClick={() =>
                    modal.confirm({
                      title: '开始新的经营？',
                      content: '这会替换当前存档。建议先导出原始数据。',
                      okText: '开始新游戏',
                      cancelText: '取消',
                      onOk: async () => {
                        if (!(await replace(initialGame())))
                          throw new Error('保存失败');
                      },
                    })
                  }
                >
                  重新开始
                </Button>
              </Space>
            }
          />
        </Card>
      </div>
    );
  return (
    <GameContext.Provider value={{ state, busy, saveError, act, replace }}>
      {children}
    </GameContext.Provider>
  );
}
