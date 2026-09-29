# 小镇事务所 · Admin System Game

以管理系统为界面的单机经营养成游戏。用熟悉的订单、库存、生产计划和工单，照料小镇的日常。

## v0.1 可以玩什么

- 接下蔬菜供货与电脑维修委托，按交期安排有限的行动与资金。
- 种植萝卜与土豆，查看预计产出，批量播种、收获和交付。
- 阅读诊断资料、选择维修方案、采购备件，一次完成执行与验收。
- 扩建农场或升级维修台，完成七个游戏日的引导章节；之后继续经营。
- 查看业务流水与日报，切换明亮/深色主题与阅读字号。
- 本地自动存档、前一次有效备份、导入导出与损坏恢复。

游戏无账号、无联网要求、无真实业务数据、无 AI API Key。只有“结束营业”推进时间，退出期间不生长、不扣费、不逾期。七日是引导长度，目标没有失败期限。

## 首日怎么玩

1. 接下食堂的 4 份萝卜订单，去“生产与设施”收获成熟地块。
2. 回订单详情交付，获得 28 金币与 1 声望。
3. 买一份萝卜种子并播种，为第 3 日准备产出。
4. 接下学校维修单，读诊断资料，买一个键盘，选“更换键盘”并执行。
5. 这一轮结束后为 256 金币、1 点行动、2 份萝卜库存、2 声望。可继续安排，或结束营业。

## 开发与运行

推荐 Node.js 22 LTS 与支持 workspace catalog 的 pnpm。项目使用 React 19，Ant Design 生态已升级到 antd 6.6.5 / icons 6.3.4 / antd-style 4.1.0（2026-09-30 核实的稳定版本）。桌面运行时为 Electron 44.5.0，打包工具为 electron-builder 26.15.3。

```sh
pnpm install
pnpm dev       # 桌面应用
pnpm dev:web   # 浏览器预览，http://localhost:7712
```

```sh
pnpm typecheck
pnpm test
pnpm lint
pnpm build
pnpm package:win
```

Windows 便携版生成在 `packer/release/0.1.0/town-office-0.1.0-win-x64.exe`。打包结果尚未配置开发者代码签名；首次打包可能需要下载 Electron 和构建工具。便携程序的存档保存在系统用户数据目录，不在 exe 旁边；升级时更换程序即可，建议先导出备份。

## 验证实际界面

先启动 `pnpm dev:web`，再运行 `pnpm test:browser`。Windows 默认使用已安装的 Microsoft Edge，其他系统使用 Playwright Chromium（可先执行 `pnpm exec playwright install chromium`）；`BROWSER_CHANNEL` 可指定浏览器，`GAME_URL` 可指定预览地址。

浏览器检查使用独立临时浏览器会话，验证首日闭环、错误维修方案、结算、刷新续玩、深色主题及 768/375 像素布局。截图保存在被 Git 忽略的 `test-results`。`pnpm test:desktop` 在独立临时数据目录中验证 Electron 离线加载、存档与重开续玩，需要先 `pnpm build`。

## 存档与技术结构

- 游戏规则与内容在 `src/common/game.ts`，界面不会自行计算或发放奖励。
- 有效动作先校验、一次结算，再保存；保存失败时不提交该动作。
- 桌面通过受限的 preload 接口访问存档；浏览器预览使用独立的 localStorage 存档，两者不自动互通，可以导入导出迁移。
- 主存档 `game-save.json`，上次备份 `game-save.backup.json`；完整路径见游戏的“事务所设置”。损坏/不支持的存档会阻止自动覆盖，显示恢复与导入入口。
- 存档版本为 1。首版尚无旧格式需要迁移；不支持的未来版本保留原始数据，不自动降级。
- 最近 500 条流水和 100 个游戏日的日报保留在存档中。

完整产品边界见 [产品方案 v0.1](docs/产品方案-v0.1.md)。远征、角色装备、餐食、人物关系与婚姻留待后续扩展；目前的数值仍需玩家试玩调优。

## License

GPL-3.0。见 [LICENSE](LICENSE)。界面当前采用 Ant Design 图标及系统 emoji，无外部图片或字体请求。
