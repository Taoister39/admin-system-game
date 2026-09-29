import { describe, expect, test } from '@rstest/core';
import {
  type Command,
  type GameState,
  available,
  initialGame,
  parseGameSave,
  reserved,
  transition,
} from '../src/common/game';

function firstDay() {
  let state = initialGame();
  for (const command of [
    { type: 'accept', id: 'd1-canteen' },
    { type: 'harvest', ids: [1] },
    { type: 'deliver', id: 'd1-canteen' },
    { type: 'buy', item: 'radishSeed', quantity: 1 },
    { type: 'plant', ids: [1], crop: 'radish' },
    { type: 'accept', id: 'd1-keyboard' },
    { type: 'buy', item: 'keyboard', quantity: 1 },
    { type: 'deliver', id: 'd1-keyboard' },
  ] satisfies Command[])
    state = transition(state, command);
  return state;
}
describe('经营规则', () => {
  test('首日闭环具有明确收支、库存和行动', () => {
    const state = firstDay();
    expect(state.cash).toBe(256);
    expect(state.actions).toBe(1);
    expect(state.reputation).toBe(2);
    expect(state.inventory.radish).toBe(2);
    expect(state.inventory.keyboard).toBe(0);
    expect(state.completed).toEqual({ goods: 1, repair: 1 });
    expect(parseGameSave(JSON.stringify(state))).toEqual(state);
  });
  test('缺料、重复交付、错误方案均不消耗资源', () => {
    let state = initialGame();
    state = transition(state, { type: 'accept', id: 'd1-keyboard' });
    const snapshot = JSON.stringify(state);
    expect(() =>
      transition(state, { type: 'deliver', id: 'd1-keyboard' }),
    ).toThrow();
    expect(JSON.stringify(state)).toBe(snapshot);
    state = transition(state, { type: 'buy', item: 'keyboard', quantity: 1 });
    state = transition(state, {
      type: 'plan',
      id: 'd1-keyboard',
      planId: 'reinstall',
    });
    expect(() =>
      transition(state, { type: 'deliver', id: 'd1-keyboard' }),
    ).toThrow();
    expect(state.inventory.keyboard).toBe(1);
    const done = firstDay();
    expect(() =>
      transition(done, { type: 'deliver', id: 'd1-keyboard' }),
    ).toThrow();
    expect(done.cash).toBe(256);
  });
  test('预留物品不能出售，放弃后释放', () => {
    let state = transition(initialGame(), { type: 'harvest', ids: [1] });
    state = transition(state, { type: 'accept', id: 'd1-canteen' });
    expect(reserved(state, 'radish')).toBe(4);
    expect(available(state, 'radish')).toBe(2);
    expect(() =>
      transition(state, { type: 'sell', item: 'radish', quantity: 3 }),
    ).toThrow();
    state = transition(state, { type: 'abandon', id: 'd1-canteen' });
    expect(reserved(state, 'radish')).toBe(0);
    expect(state.reputation).toBe(0);
  });
  test('采购不扣行动，补料自动预留；每日限购无法绕过', () => {
    let state = transition(initialGame(), { type: 'accept', id: 'd1-canteen' });
    state = transition(state, { type: 'buy', item: 'radish', quantity: 4 });
    expect(state.actions).toBe(6);
    expect(reserved(state, 'radish')).toBe(4);
    expect(() =>
      transition(state, { type: 'buy', item: 'radish', quantity: 3 }),
    ).toThrow();
    expect(() =>
      transition(state, { type: 'buy', item: 'radish', quantity: -1 }),
    ).toThrow();
  });
  test('日末一次推进且成熟不腐烂', () => {
    let state = firstDay();
    state = transition(state, { type: 'end', day: 1 });
    expect(state.day).toBe(2);
    expect(state.plots[0].remaining).toBe(1);
    expect(state.cash).toBe(256);
    expect(state.reports[0]).toMatchObject({
      completed: 2,
      income: 88,
      spending: 32,
      fee: 0,
    });
    expect(() => transition(state, { type: 'end', day: 1 })).toThrow();
    state = transition(state, { type: 'end', day: 2 });
    expect(state.plots[0].remaining).toBe(0);
    expect(state.cash).toBe(246);
    state = transition(state, { type: 'end', day: 3 });
    expect(state.plots[0].crop).toBe('radish');
    expect(state.plots[0].remaining).toBe(0);
  });
  test('截止当天仍可交付，未接订单逾期不扣声望', () => {
    let state = initialGame();
    state.reputation = 5;
    state = transition(state, { type: 'accept', id: 'd1-keyboard' });
    state = transition(state, { type: 'buy', item: 'keyboard', quantity: 1 });
    const completed = transition(state, { type: 'deliver', id: 'd1-keyboard' });
    expect(completed.reputation).toBe(6);
    const expired = transition(state, { type: 'end', day: 1 });
    expect(expired.reputation).toBe(4);
    expect(reserved(expired, 'keyboard')).toBe(0);
    expect(transition(completed, { type: 'end', day: 1 }).reputation).toBe(6);
  });
  test('批量动作按业务数量扣行动，非法地块不会部分提交', () => {
    let state = transition(initialGame(), { type: 'harvest', ids: [1] });
    state = transition(state, { type: 'buy', item: 'radishSeed', quantity: 2 });
    expect(() =>
      transition(state, { type: 'plant', ids: [1, 1], crop: 'radish' }),
    ).toThrow();
    expect(() =>
      transition(state, { type: 'plant', ids: [1, 99], crop: 'radish' }),
    ).toThrow();
    const planted = transition(state, {
      type: 'plant',
      ids: [1, 2],
      crop: 'radish',
    });
    expect(planted.actions).toBe(3);
    expect(planted.inventory.radishSeed).toBe(0);
    planted.actions = 0;
    expect(() =>
      transition(planted, { type: 'upgrade', facility: 'farm' }),
    ).toThrow();
    expect(planted.cash).toBe(state.cash);
  });
  test('种植闭环可以交付，维修与供货分享行动', () => {
    let state = firstDay();
    state = transition(state, { type: 'end', day: 1 });
    state = transition(state, { type: 'end', day: 2 });
    state = transition(state, { type: 'accept', id: 'd3-ai' });
    state = transition(state, { type: 'harvest', ids: [1] });
    state = transition(state, { type: 'deliver', id: 'd3-ai' });
    expect(state.completed.goods).toBe(2);
    expect(state.actions).toBe(4);
  });
  test('恢复委托有门槛与每日上限，现金不会因开支变负', () => {
    let state = initialGame();
    state.cash = 5;
    state = transition(state, { type: 'rescue' });
    expect(state.cash).toBe(30);
    expect(state.actions).toBe(4);
    state.cash = 0;
    expect(() => transition(state, { type: 'rescue' })).toThrow();
    state = transition(state, { type: 'end', day: 1 });
    state = transition(state, { type: 'end', day: 2 });
    expect(state.cash).toBe(0);
    expect(transition(state, { type: 'rescue' }).cash).toBe(25);
  });
  test('同一存档生成相同委托，读档不会自动推进', () => {
    const state = firstDay();
    const loaded = parseGameSave(JSON.stringify(state));
    expect(loaded.day).toBe(1);
    expect(transition(state, { type: 'end', day: 1 })).toEqual(
      transition(loaded, { type: 'end', day: 1 }),
    );
  });
  test('可通过真实业务完成章节，升级改变后续收益', () => {
    let state = firstDay();
    for (let day = 1; day <= 7; day++) {
      if (day > 1) {
        state = transition(state, { type: 'accept', id: `d${day}-keyboard` });
        state = transition(state, {
          type: 'buy',
          item: 'keyboard',
          quantity: 1,
        });
        state = transition(state, { type: 'deliver', id: `d${day}-keyboard` });
        if (day === 3) {
          state = transition(state, { type: 'accept', id: 'd3-ai' });
          state = transition(state, { type: 'harvest', ids: [1] });
          state = transition(state, { type: 'deliver', id: 'd3-ai' });
        }
        if (day === 4)
          state = transition(state, { type: 'upgrade', facility: 'workshop' });
      }
      expect(parseGameSave(JSON.stringify(state))).toEqual(state);
      if (day < 7) state = transition(state, { type: 'end', day });
    }
    expect(state.chapterComplete).toBe(true);
    expect(state.completed.goods).toBe(2);
    expect(state.completed.repair).toBe(7);
    expect(state.workshopLevel).toBe(2);
    const upgradedIncome = state.ledger.filter(
      (entry) => entry.day === 7 && entry.cash > 0,
    );
    expect(upgradedIncome[0].cash).toBe(70);
  });
});
describe('存档验证', () => {
  const invalidCases = [
    (s: GameState) => {
      s.version = 99 as 1;
    },
    (s: GameState) => {
      s.cash = -1;
    },
    (s: GameState) => {
      s.inventory.keyboard = Number.NaN;
    },
    (s: GameState) => {
      s.orders[0].status = 'accepted';
      s.orders[0].reserved = 4;
    },
    (s: GameState) => {
      s.orders[0].deadline = 0;
    },
    (s: GameState) => {
      s.orders.push(s.orders[0]);
    },
  ];
  for (const [index, change] of invalidCases.entries()) {
    test(`拒绝破坏业务约束的存档 ${index + 1}`, () => {
      const state = initialGame();
      change(state);
      expect(() => parseGameSave(JSON.stringify(state))).toThrow();
    });
  }
});
