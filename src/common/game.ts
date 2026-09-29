export const SAVE_VERSION = 1;
export const DAILY_ACTIONS = 6;
export const ITEM_IDS = [
  'radish',
  'potato',
  'radishSeed',
  'potatoSeed',
  'keyboard',
  'fan',
] as const;
export type ItemId = (typeof ITEM_IDS)[number];
export type CropId = 'radish' | 'potato';
export type RepairId = 'keyboard' | 'thermal' | 'startup';
export type OrderStatus =
  | 'offered'
  | 'accepted'
  | 'completed'
  | 'expired'
  | 'abandoned';
export const ITEMS: Record<
  ItemId,
  {
    name: string;
    icon: string;
    price: number;
    limit: number;
    sellPrice?: number;
  }
> = {
  radish: { name: '萝卜', icon: '🥕', price: 6, limit: 6, sellPrice: 3 },
  potato: { name: '土豆', icon: '🥔', price: 7, limit: 6, sellPrice: 4 },
  radishSeed: { name: '萝卜种子', icon: '🌱', price: 12, limit: 12 },
  potatoSeed: { name: '土豆种子', icon: '🌱', price: 20, limit: 12 },
  keyboard: { name: '键盘备件', icon: '⌨️', price: 20, limit: 6 },
  fan: { name: '风扇备件', icon: '🌀', price: 20, limit: 6 },
};
export const CROPS: Record<
  CropId,
  { seed: ItemId; days: number; yield: number }
> = {
  radish: { seed: 'radishSeed', days: 2, yield: 6 },
  potato: { seed: 'potatoSeed', days: 3, yield: 8 },
};
export interface RepairPlan {
  id: string;
  label: string;
  explanation: string;
  valid: boolean;
  part?: ItemId;
}
export const REPAIRS: Record<
  RepairId,
  {
    title: string;
    symptoms: string;
    diagnosis: string;
    criteria: string;
    plans: RepairPlan[];
  }
> = {
  keyboard: {
    title: '键盘重复输入',
    symptoms: '按一次字母会重复输入；接入外置键盘后正常。',
    diagnosis: '外接测试正常，系统和输入法没有异常。故障来自原键盘硬件。',
    criteria: '原键盘恢复正常输入，不影响已安装的软件。',
    plans: [
      {
        id: 'replace',
        label: '更换键盘',
        explanation: '消耗键盘备件 ×1，满足验收。',
        valid: true,
        part: 'keyboard',
      },
      {
        id: 'reinstall',
        label: '重装系统',
        explanation: '无法解决硬件故障，并会影响现有软件。',
        valid: false,
      },
    ],
  },
  thermal: {
    title: '电脑散热异常',
    symptoms: '运行十分钟后机身发热，风扇转动正常，但出风口被灰尘堵住。',
    diagnosis: '风扇测试正常；清洁出风口后温度可回到验收范围，无需换件。',
    criteria: '持续运行后温度正常，风扇无异响。',
    plans: [
      {
        id: 'clean',
        label: '清洁散热通道',
        explanation: '无需备件，满足验收。',
        valid: true,
      },
      {
        id: 'replace-fan',
        label: '清洁并更换风扇',
        explanation: '消耗风扇 ×1，同样通过，但增加材料成本。',
        valid: true,
        part: 'fan',
      },
    ],
  },
  startup: {
    title: '启动配置异常',
    symptoms: '更新后无法进入系统，磁盘检查正常。客户特别要求保留实验数据。',
    diagnosis: '可以通过修复启动配置恢复系统，原有文件无需删除。',
    criteria: '正常启动，保留全部实验数据。',
    plans: [
      {
        id: 'repair-config',
        label: '修复启动配置',
        explanation: '无需备件，保留数据，满足验收。',
        valid: true,
      },
      {
        id: 'format',
        label: '格式化后重装',
        explanation: '会删除客户数据，不满足验收。',
        valid: false,
      },
    ],
  },
};

export interface Order {
  id: string;
  kind: 'goods' | 'repair';
  customer: string;
  title: string;
  note: string;
  createdDay: number;
  deadline: number;
  reward: number;
  status: OrderStatus;
  crop?: CropId;
  quantity: number;
  repair?: RepairId;
  planId?: string;
  reserved: number;
}
export interface Plot {
  id: number;
  crop: CropId | null;
  remaining: number;
}
export interface LedgerEntry {
  id: number;
  day: number;
  text: string;
  cash: number;
  action: number;
}
export interface DailyReport {
  day: number;
  completed: number;
  income: number;
  spending: number;
  fee: number;
  overdue: number;
  cash: number;
}
export interface GameState {
  version: 1;
  revision: number;
  name: string;
  day: number;
  actions: number;
  cash: number;
  reputation: number;
  seed: number;
  inventory: Record<ItemId, number>;
  orders: Order[];
  plots: Plot[];
  workshopLevel: 1 | 2;
  purchased: Record<ItemId, number>;
  soldToday: number;
  rescueDay: number;
  completed: { goods: number; repair: number };
  chapterComplete: boolean;
  ledger: LedgerEntry[];
  reports: DailyReport[];
  tutorialDismissed: boolean;
}
export type Command =
  | { type: 'accept' | 'abandon' | 'deliver'; id: string }
  | { type: 'plan'; id: string; planId: string }
  | { type: 'buy'; item: ItemId; quantity: number }
  | { type: 'sell'; item: CropId; quantity: number }
  | { type: 'plant'; ids: number[]; crop: CropId }
  | { type: 'harvest'; ids: number[] }
  | { type: 'upgrade'; facility: 'farm' | 'workshop' }
  | { type: 'end'; day: number }
  | { type: 'rescue' }
  | { type: 'rename'; name: string }
  | { type: 'dismissTutorial' };

export class GameError extends Error {}
function check(condition: unknown, reason: string): asserts condition {
  if (!condition) throw new GameError(reason);
}
const emptyInventory = () =>
  Object.fromEntries(ITEM_IDS.map((id) => [id, 0])) as Record<ItemId, number>;
export function initialGame(): GameState {
  const state: GameState = {
    version: SAVE_VERSION,
    revision: 0,
    name: '小镇事务所',
    day: 1,
    actions: DAILY_ACTIONS,
    cash: 200,
    reputation: 0,
    seed: 3917,
    inventory: emptyInventory(),
    orders: [],
    plots: [
      { id: 1, crop: 'radish', remaining: 0 },
      { id: 2, crop: null, remaining: 0 },
    ],
    workshopLevel: 1,
    purchased: emptyInventory(),
    soldToday: 0,
    rescueDay: 0,
    completed: { goods: 0, repair: 0 },
    chapterComplete: false,
    ledger: [
      {
        id: 1,
        day: 1,
        text: '老店长留下启动资金、一块成熟的萝卜地和两张教学委托。',
        cash: 200,
        action: 0,
      },
    ],
    reports: [],
    tutorialDismissed: false,
  };
  state.orders = makeOrders(state);
  return state;
}
function random(state: GameState) {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  return state.seed / 4294967296;
}
function makeOrders(state: GameState): Order[] {
  const d = state.day;
  const goods = (
    suffix: string,
    crop: CropId,
    quantity: number,
    customer: string,
    note: string,
  ): Order => ({
    id: `d${d}-${suffix}`,
    kind: 'goods',
    customer,
    title: `${ITEMS[crop].name}供货 · ${quantity} 份`,
    note,
    createdDay: d,
    deadline: d === 1 ? 1 : d + (crop === 'potato' ? 3 : 2),
    reward: quantity * (crop === 'radish' ? 7 : 8),
    status: 'offered',
    crop,
    quantity,
    reserved: 0,
  });
  const repair = (kind: RepairId, suffix: string): Order => ({
    id: `d${d}-${suffix}`,
    kind: 'repair',
    customer: '学校技术员',
    title: REPAIRS[kind].title,
    note:
      kind === 'keyboard'
        ? '下节课要录入实验记录，麻烦帮忙看看。'
        : '设备恢复以后，学生们就能继续做实验了。',
    createdDay: d,
    deadline: d === 1 ? 1 : d + 1,
    reward: kind === 'keyboard' ? 60 : kind === 'thermal' ? 50 : 55,
    status: 'offered',
    quantity: 1,
    repair: kind,
    planId: REPAIRS[kind].plans[0].id,
    reserved: 0,
  });
  const orders = [
    goods(
      'canteen',
      'radish',
      d === 1 ? 4 : 4 + Math.floor(random(state) * 3),
      '食堂负责人',
      '孩子们明天想吃热乎乎的萝卜汤。',
    ),
    repair('keyboard', 'keyboard'),
  ];
  if (d >= 3)
    orders.push(
      goods(
        'ai',
        'radish',
        4,
        '小镇调度 AI',
        '补给队需要四份萝卜。库存核对完成后，请安排交付。',
      ),
    );
  if (d >= 4)
    orders.push(repair(d % 2 === 0 ? 'thermal' : 'startup', 'service'));
  if (d >= 5 && state.reputation >= 4)
    orders.push(
      goods(
        'potato',
        'potato',
        4 + Math.floor(random(state) * 5),
        '食堂负责人',
        '本周增加一道炖土豆，期待继续合作。',
      ),
    );
  return orders;
}
export function orderPart(order: Order): ItemId | undefined {
  return order.kind === 'goods'
    ? order.crop
    : REPAIRS[order.repair as RepairId].plans.find(
        (plan) => plan.id === order.planId,
      )?.part;
}
export function reserved(
  state: GameState,
  item: ItemId,
  exceptId?: string,
): number {
  return state.orders.reduce(
    (total, order) =>
      total +
      (order.status === 'accepted' &&
      order.id !== exceptId &&
      orderPart(order) === item
        ? order.reserved
        : 0),
    0,
  );
}
export function available(state: GameState, item: ItemId): number {
  return state.inventory[item] - reserved(state, item);
}
function allocate(state: GameState) {
  const pending = state.orders
    .filter((order) => order.status === 'accepted')
    .sort((a, b) => a.deadline - b.deadline || a.createdDay - b.createdDay);
  for (const order of pending) {
    const item = orderPart(order);
    if (item)
      order.reserved += Math.min(
        order.quantity - order.reserved,
        available(state, item),
      );
  }
}
export function rewardFor(state: GameState, order: Order) {
  return (
    order.reward +
    (order.kind === 'repair' && state.workshopLevel === 2 ? 10 : 0)
  );
}
export function deliveryIssue(state: GameState, order: Order): string | null {
  if (order.status !== 'accepted') return '请先接下委托。';
  if (state.day > order.deadline) return '订单已超过截止日。';
  const needed = order.kind === 'goods' ? 1 : 2;
  if (state.actions < needed)
    return `需要 ${needed} 点行动，今天仅剩 ${state.actions} 点。`;
  if (order.kind === 'repair') {
    const plan = REPAIRS[order.repair as RepairId].plans.find(
      (p) => p.id === order.planId,
    );
    if (!plan?.valid) return plan?.explanation ?? '请选择维修方案。';
  }
  const item = orderPart(order);
  if (
    item &&
    state.inventory[item] - reserved(state, item, order.id) < order.quantity
  )
    return `缺少 ${ITEMS[item].name} ${order.quantity - order.reserved} 份，可采购或安排生产。`;
  return null;
}
function log(state: GameState, text: string, cash = 0, action = 0) {
  state.ledger.push({
    id: (state.ledger.at(-1)?.id ?? 0) + 1,
    day: state.day,
    text,
    cash,
    action,
  });
  state.ledger = state.ledger.slice(-500);
}
function spendActions(state: GameState, count: number) {
  check(
    state.actions >= count,
    `需要 ${count} 点行动，当前只有 ${state.actions} 点。`,
  );
  state.actions -= count;
}
function spendMoney(state: GameState, amount: number) {
  check(
    state.cash >= amount,
    `需要 ${amount} 金币，当前只有 ${state.cash} 金币。`,
  );
  state.cash -= amount;
}
function quantityCheck(quantity: number) {
  check(
    Number.isInteger(quantity) && quantity > 0 && quantity <= 99,
    '数量须为 1—99 的整数。',
  );
}
function plotSelection(state: GameState, ids: number[]) {
  check(
    ids.length > 0 && new Set(ids).size === ids.length,
    '请选择不同的地块。',
  );
  const plots = ids.map((id) => state.plots.find((plot) => plot.id === id));
  check(plots.every(Boolean), '地块不存在。');
  return plots as Plot[];
}
export function chapterProgress(state: GameState) {
  return [
    {
      label: '合格完成 8 张委托',
      current: Math.min(8, state.completed.goods + state.completed.repair),
      total: 8,
    },
    {
      label: '完成 2 张供货委托',
      current: Math.min(2, state.completed.goods),
      total: 2,
    },
    {
      label: '完成 2 张维修委托',
      current: Math.min(2, state.completed.repair),
      total: 2,
    },
    {
      label: '升级一项设施',
      current: state.plots.length > 2 || state.workshopLevel === 2 ? 1 : 0,
      total: 1,
    },
  ];
}
export function endPreview(state: GameState) {
  return {
    fee: Math.min(state.cash, state.day === 1 ? 0 : 10),
    unused: state.actions,
    overdue: state.orders.filter(
      (order) => order.status === 'accepted' && order.deadline <= state.day,
    ),
    maturing: state.plots.filter((plot) => plot.crop && plot.remaining === 1),
  };
}
export function transition(source: GameState, command: Command): GameState {
  const state: GameState = JSON.parse(JSON.stringify(source));
  switch (command.type) {
    case 'accept': {
      const order = state.orders.find((o) => o.id === command.id);
      check(
        order?.status === 'offered' && order.deadline >= state.day,
        '该委托已接下或不再开放。',
      );
      check(
        state.orders.filter((o) => o.status === 'accepted').length < 3,
        '最多同时承接 3 张委托，请先完成或放弃一张。',
      );
      order.status = 'accepted';
      allocate(state);
      log(state, `接下「${order.title}」，截止第 ${order.deadline} 日。`);
      break;
    }
    case 'abandon': {
      const order = state.orders.find((o) => o.id === command.id);
      check(order?.status === 'accepted', '只能放弃已接下的委托。');
      order.status = 'abandoned';
      order.reserved = 0;
      const penalty = state.day === 1 ? 0 : 1;
      state.reputation = Math.max(0, state.reputation - penalty);
      allocate(state);
      log(
        state,
        `放弃「${order.title}」，释放预留库存${penalty ? '，声望 -1' : '；教学日免处罚'}。`,
      );
      break;
    }
    case 'plan': {
      const order = state.orders.find((o) => o.id === command.id);
      check(
        order?.kind === 'repair' &&
          ['accepted', 'offered'].includes(order.status),
        '此工单无法修改。',
      );
      const plan = REPAIRS[order.repair as RepairId].plans.find(
        (p) => p.id === command.planId,
      );
      check(plan, '维修方案不存在。');
      order.planId = plan.id;
      order.reserved = 0;
      allocate(state);
      log(state, `「${order.title}」选择方案：${plan.label}。`);
      break;
    }
    case 'deliver': {
      const order = state.orders.find((o) => o.id === command.id);
      check(order, '订单不存在。');
      check(
        !deliveryIssue(state, order),
        deliveryIssue(state, order) ?? '不能交付。',
      );
      const cost = order.kind === 'goods' ? 1 : 2;
      spendActions(state, cost);
      const item = orderPart(order);
      if (item) state.inventory[item] -= order.quantity;
      const income = rewardFor(state, order);
      state.cash += income;
      state.reputation++;
      state.completed[order.kind]++;
      order.status = 'completed';
      order.reserved = 0;
      allocate(state);
      log(
        state,
        `${order.customer}验收「${order.title}」：声望 +1。`,
        income,
        -cost,
      );
      break;
    }
    case 'buy': {
      check(ITEM_IDS.includes(command.item), '物品不存在。');
      quantityCheck(command.quantity);
      check(
        !command.item.startsWith('potato') ||
          (state.day >= 5 && state.reputation >= 4),
        '土豆业务在第 5 日且声望达到 4 后解锁。',
      );
      const item = ITEMS[command.item];
      check(
        state.purchased[command.item] + command.quantity <= item.limit,
        '超出今天的采购限额。',
      );
      const cost = item.price * command.quantity;
      spendMoney(state, cost);
      state.inventory[command.item] += command.quantity;
      state.purchased[command.item] += command.quantity;
      allocate(state);
      log(state, `采购${item.name} ×${command.quantity}。`, -cost);
      break;
    }
    case 'sell': {
      check(
        command.item === 'radish' || command.item === 'potato',
        '该物品不能普通出售。',
      );
      quantityCheck(command.quantity);
      check(
        state.soldToday + command.quantity <= 12,
        '普通收购每日最多 12 份。',
      );
      check(
        available(state, command.item) >= command.quantity,
        '可用库存不足；已为订单预留的物品不能出售。',
      );
      spendActions(state, 1);
      const income = (ITEMS[command.item].sellPrice ?? 0) * command.quantity;
      state.inventory[command.item] -= command.quantity;
      state.cash += income;
      state.soldToday += command.quantity;
      log(
        state,
        `普通出售${ITEMS[command.item].name} ×${command.quantity}。`,
        income,
        -1,
      );
      break;
    }
    case 'plant': {
      check(
        command.crop === 'radish' || command.crop === 'potato',
        '作物不存在。',
      );
      check(
        command.crop !== 'potato' || (state.day >= 5 && state.reputation >= 4),
        '土豆业务尚未解锁。',
      );
      const plots = plotSelection(state, command.ids);
      check(
        plots.every((plot) => !plot.crop),
        '只能在空闲地块播种。',
      );
      const crop = CROPS[command.crop];
      check(
        available(state, crop.seed) >= plots.length,
        `需要${ITEMS[crop.seed].name} ×${plots.length}，请先采购。`,
      );
      spendActions(state, plots.length);
      state.inventory[crop.seed] -= plots.length;
      for (const plot of plots) {
        plot.crop = command.crop;
        plot.remaining = crop.days;
      }
      log(
        state,
        `播种${ITEMS[command.crop].name}，共 ${plots.length} 块地，第 ${state.day + crop.days} 日可收获。`,
        0,
        -plots.length,
      );
      break;
    }
    case 'harvest': {
      const plots = plotSelection(state, command.ids);
      check(
        plots.every((plot) => plot.crop && plot.remaining === 0),
        '所选地块尚未成熟。',
      );
      spendActions(state, plots.length);
      for (const plot of plots) {
        const crop = plot.crop as CropId;
        state.inventory[crop] += CROPS[crop].yield;
        plot.crop = null;
      }
      allocate(state);
      log(
        state,
        `收获 ${plots.length} 块地，产出已入库并优先预留给已接委托。`,
        0,
        -plots.length,
      );
      break;
    }
    case 'upgrade': {
      check(state.reputation >= 4, '设施升级需要声望达到 4。');
      check(
        command.facility === 'farm' || command.facility === 'workshop',
        '设施不存在。',
      );
      check(
        command.facility === 'farm'
          ? state.plots.length === 2
          : state.workshopLevel === 1,
        '该设施已升级到首版最高等级。',
      );
      spendMoney(state, 120);
      spendActions(state, 1);
      if (command.facility === 'farm')
        state.plots.push({ id: 3, crop: null, remaining: 0 });
      else state.workshopLevel = 2;
      log(
        state,
        command.facility === 'farm'
          ? '农场扩容完成，新增一块地。'
          : '维修台升级完成，之后每张维修委托收入 +10。',
        -120,
        -1,
      );
      break;
    }
    case 'rescue': {
      check(
        state.cash < 20 && state.rescueDay !== state.day,
        '整理委托只在现金不足 20 时开放，每天最多一次。',
      );
      spendActions(state, 2);
      state.cash += 25;
      state.rescueDay = state.day;
      log(state, '帮助老店长整理资料，获得恢复经营的周转资金。', 25, -2);
      break;
    }
    case 'end': {
      check(command.day === state.day, '这一天已经结算，请查看新一天。');
      const preview = endPreview(state);
      const today = state.ledger.filter(
        (entry) => entry.day === state.day && entry.id !== 1,
      );
      const completedToday = state.orders.filter(
        (order) =>
          order.status === 'completed' &&
          state.ledger.some(
            (entry) =>
              entry.day === state.day &&
              entry.text.includes(`「${order.title}」`) &&
              entry.cash > 0,
          ),
      ).length;
      for (const order of state.orders)
        if (
          order.deadline <= state.day &&
          ['offered', 'accepted'].includes(order.status)
        ) {
          order.status = 'expired';
          order.reserved = 0;
        }
      state.reputation = Math.max(0, state.reputation - preview.overdue.length);
      state.cash -= preview.fee;
      state.reports.push({
        day: state.day,
        completed: completedToday,
        income: today.reduce((n, e) => n + Math.max(0, e.cash), 0),
        spending: -today.reduce((n, e) => n + Math.min(0, e.cash), 0),
        fee: preview.fee,
        overdue: preview.overdue.length,
        cash: state.cash,
      });
      state.reports = state.reports.slice(-100);
      log(
        state,
        `营业结束：${preview.overdue.length ? `${preview.overdue.length} 张委托逾期，声望 -${preview.overdue.length}` : '没有已接委托逾期'}；作物生长推进一次。`,
        -preview.fee,
      );
      state.day++;
      state.actions = DAILY_ACTIONS;
      state.purchased = emptyInventory();
      state.soldToday = 0;
      for (const plot of state.plots) if (plot.remaining > 0) plot.remaining--;
      state.orders = state.orders
        .filter(
          (o) =>
            o.status === 'accepted' ||
            (o.status === 'offered' && o.deadline >= state.day),
        )
        .concat(makeOrders(state));
      allocate(state);
      break;
    }
    case 'rename': {
      const name = command.name.trim();
      check(name.length >= 1 && name.length <= 20, '名称须为 1—20 个字符。');
      state.name = name;
      break;
    }
    case 'dismissTutorial':
      state.tutorialDismissed = true;
      break;
  }
  if (
    !state.chapterComplete &&
    chapterProgress(state).every((goal) => goal.current >= goal.total) &&
    state.day >= 7
  ) {
    state.chapterComplete = true;
    log(state, '获得「正式营业」认证。小镇感谢你的照料，接下来可以自由经营。');
  }
  state.revision++;
  return state;
}

export function parseGameSave(raw: string): GameState {
  check(raw.length <= 2_000_000, '存档超过 2 MB，无法读取。');
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new GameError('存档不是有效的 JSON 数据。');
  }
  const object = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value);
  const integer = (
    value: unknown,
    min = 0,
    max = 1_000_000_000,
  ): value is number =>
    Number.isInteger(value) &&
    (value as number) >= min &&
    (value as number) <= max;
  const text = (value: unknown, max = 500): value is string =>
    typeof value === 'string' && value.length <= max;
  check(object(data), '存档结构不正确。');
  check(data.version === SAVE_VERSION, '存档版本不受支持，请保留原备份。');
  check(
    [
      'revision',
      'day',
      'actions',
      'cash',
      'reputation',
      'soldToday',
      'rescueDay',
    ].every((key) => integer(data[key])),
    '存档中的数值无效。',
  );
  check(
    integer(data.day, 1) &&
      integer(data.actions, 0, DAILY_ACTIONS) &&
      integer(data.soldToday, 0, 12) &&
      integer(data.seed, 0, 4294967295),
    '存档时间或资源无效。',
  );
  check(
    text(data.name, 20) &&
      data.name.trim().length > 0 &&
      typeof data.chapterComplete === 'boolean' &&
      typeof data.tutorialDismissed === 'boolean',
    '存档设置无效。',
  );
  check(
    object(data.inventory) &&
      object(data.purchased) &&
      ITEM_IDS.every(
        (id) =>
          integer(
            data.inventory && (data.inventory as Record<string, unknown>)[id],
          ) &&
          integer(
            data.purchased && (data.purchased as Record<string, unknown>)[id],
            0,
            ITEMS[id].limit,
          ),
      ),
    '库存数据不正确。',
  );
  check(
    object(data.completed) &&
      integer(data.completed.goods) &&
      integer(data.completed.repair),
    '完成记录不正确。',
  );
  check(
    data.workshopLevel === 1 || data.workshopLevel === 2,
    '设施等级不正确。',
  );
  check(
    Array.isArray(data.plots) &&
      [2, 3].includes(data.plots.length) &&
      data.plots.every(
        (p, index) =>
          object(p) &&
          p.id === index + 1 &&
          (p.crop === null || p.crop === 'radish' || p.crop === 'potato') &&
          integer(p.remaining, 0, 3) &&
          (p.crop !== null || p.remaining === 0),
      ),
    '地块数据不正确。',
  );
  check(
    Array.isArray(data.orders) &&
      data.orders.length <= 40 &&
      data.orders.every((o) => {
        if (
          !object(o) ||
          !text(o.id, 80) ||
          !text(o.customer, 80) ||
          !text(o.title, 160) ||
          !text(o.note) ||
          !integer(o.createdDay, 1, data.day as number) ||
          !integer(o.deadline, o.createdDay as number) ||
          !integer(o.reward, 1, 100_000) ||
          !integer(o.quantity, 1, 99) ||
          !integer(o.reserved, 0, o.quantity as number) ||
          ![
            'offered',
            'accepted',
            'completed',
            'expired',
            'abandoned',
          ].includes(o.status as string)
        )
          return false;
        if (o.status !== 'accepted' && o.reserved !== 0) return false;
        if (
          (o.status === 'offered' || o.status === 'accepted') &&
          (o.deadline as number) < (data.day as number)
        )
          return false;
        return o.kind === 'goods'
          ? o.crop === 'radish' || o.crop === 'potato'
          : o.kind === 'repair' &&
              (o.repair === 'keyboard' ||
                o.repair === 'thermal' ||
                o.repair === 'startup') &&
              o.quantity === 1 &&
              REPAIRS[o.repair].plans.some((p) => p.id === o.planId);
      }),
    '订单数据不正确。',
  );
  check(
    new Set((data.orders as Order[]).map((o) => o.id)).size ===
      data.orders.length &&
      (data.orders as Order[]).filter((o) => o.status === 'accepted').length <=
        3,
    '订单编号或在办数量不正确。',
  );
  check(
    Array.isArray(data.ledger) &&
      data.ledger.length <= 500 &&
      data.ledger.every(
        (e) =>
          object(e) &&
          integer(e.id, 1) &&
          integer(e.day, 1, data.day as number) &&
          text(e.text) &&
          integer(e.cash, -1_000_000) &&
          integer(e.action, -DAILY_ACTIONS, 0),
      ),
    '业务流水不正确。',
  );
  check(
    Array.isArray(data.reports) &&
      data.reports.length <= 100 &&
      data.reports.every(
        (r) =>
          object(r) &&
          [
            'day',
            'completed',
            'income',
            'spending',
            'fee',
            'overdue',
            'cash',
          ].every((k) => integer(r[k])) &&
          integer(r.day, 1, (data.day as number) - 1),
      ),
    '日报数据不正确。',
  );
  const result = data as unknown as GameState;
  check(
    ITEM_IDS.every((id) => reserved(result, id) <= result.inventory[id]),
    '库存预留超过实际数量。',
  );
  return result;
}
