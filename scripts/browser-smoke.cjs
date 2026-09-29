const assert = require('node:assert/strict');
const { mkdir } = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { assertContentScrollOnly } = require('./layout-check.cjs');

async function main() {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : process.platform === 'win32'
        ? { channel: 'msedge' }
        : {}),
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1024 },
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (entry) => {
    if (entry.type() === 'error' || entry.type() === 'warning')
      errors.push(entry.text());
  });
  const read = () =>
    page.evaluate(() =>
      JSON.parse(localStorage.getItem('town-office.save.v1')),
    );
  const wait = (predicate) => page.waitForFunction(predicate);
  const output = path.resolve('test-results');
  await mkdir(output, { recursive: true });
  try {
    await page.goto(process.env.GAME_URL ?? 'http://127.0.0.1:7712/', {
      waitUntil: 'networkidle',
    });
    await page.getByRole('heading', { name: '开门营业，慢慢来。' }).waitFor();
    await page.setViewportSize({ width: 1440, height: 640 });
    await assertContentScrollOnly(page);
    await page.screenshot({
      path: path.join(output, 'dashboard-scrolled.png'),
    });
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.getByRole('main').evaluate((element) => element.scrollTo(0, 0));
    await page.screenshot({
      path: path.join(output, 'dashboard.png'),
      fullPage: true,
    });
    await page
      .getByRole('row')
      .filter({ hasText: '萝卜供货 · 4 份' })
      .getByRole('button', { name: /接\s*单/ })
      .click();
    await wait(
      () =>
        JSON.parse(localStorage.getItem('town-office.save.v1'))?.orders[0]
          .status === 'accepted',
    );
    await page.locator('nav').getByRole('link', { name: '生产与设施' }).click();
    await page
      .getByRole('button', { name: '收获 · 1 行动', exact: true })
      .click();
    await wait(
      () =>
        JSON.parse(localStorage.getItem('town-office.save.v1')).inventory
          .radish === 6,
    );
    await page.getByRole('button', { name: '采购一份种子 · 12 金币' }).click();
    await wait(
      () =>
        JSON.parse(localStorage.getItem('town-office.save.v1')).inventory
          .radishSeed === 1,
    );
    await page
      .getByRole('button', { name: '播种 · 1 行动', exact: true })
      .first()
      .click();
    await wait(
      () =>
        JSON.parse(localStorage.getItem('town-office.save.v1')).plots[0]
          .remaining === 2,
    );
    await page.locator('nav').getByRole('link', { name: '订单中心' }).click();
    await page
      .getByRole('button', { name: '萝卜供货 · 4 份', exact: true })
      .click();
    await page.getByRole('button', { name: '交付订单 · 1 行动' }).click();
    await wait(
      () =>
        JSON.parse(localStorage.getItem('town-office.save.v1')).completed
          .goods === 1,
    );
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page
      .getByRole('row')
      .filter({ hasText: '键盘重复输入' })
      .getByRole('button', { name: /接\s*单/ })
      .click();
    await wait(
      () =>
        JSON.parse(localStorage.getItem('town-office.save.v1')).orders.find(
          (o) => o.kind === 'repair',
        ).status === 'accepted',
    );
    await page
      .getByRole('button', { name: '键盘重复输入', exact: true })
      .click();
    await page.getByRole('button', { name: '采购缺料 · 20 金币' }).click();
    await wait(
      () =>
        JSON.parse(localStorage.getItem('town-office.save.v1')).inventory
          .keyboard === 1,
    );
    await page.getByRole('radio', { name: /重装系统/ }).check();
    await wait(
      () =>
        JSON.parse(localStorage.getItem('town-office.save.v1')).orders.find(
          (o) => o.kind === 'repair',
        ).planId === 'reinstall',
    );
    assert.equal(
      await page
        .getByRole('button', { name: '执行并验收 · 2 行动' })
        .isDisabled(),
      true,
    );
    await page.getByRole('radio', { name: /更换键盘/ }).check();
    await page.getByRole('button', { name: '执行并验收 · 2 行动' }).click();
    await wait(
      () =>
        JSON.parse(localStorage.getItem('town-office.save.v1')).completed
          .repair === 1,
    );
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    let state = await read();
    assert.equal(state.cash, 256);
    assert.equal(state.actions, 1);
    assert.equal(state.inventory.radish, 2);
    assert.equal(state.reputation, 2);
    await page.reload({ waitUntil: 'networkidle' });
    assert.deepEqual(await read(), state);
    await page.getByRole('button', { name: '结束营业', exact: true }).click();
    await page.getByRole('button', { name: '确认结算，进入下一日' }).click();
    await wait(
      () => JSON.parse(localStorage.getItem('town-office.save.v1')).day === 2,
    );
    state = await read();
    assert.equal(state.actions, 6);
    assert.equal(state.plots[0].remaining, 1);
    assert.equal(state.reports[0].completed, 2);
    await page.locator('nav').getByRole('link', { name: '事务所设置' }).click();
    await page.getByRole('combobox', { name: '界面主题' }).click();
    await page.getByText('深色', { exact: true }).click();
    await page.getByRole('combobox', { name: '阅读字号' }).click();
    await page.getByText('较大', { exact: true }).click();
    assert.equal(
      await page
        .getByRole('banner')
        .evaluate((element) => getComputedStyle(element).fontSize),
      '16px',
    );
    await page.setViewportSize({ width: 1000, height: 640 });
    await assertContentScrollOnly(page);
    for (const [name, route] of [
      ['工作台', 'home'],
      ['生产与设施', 'production'],
      ['库存与采购', 'inventory'],
      ['订单中心', 'orders'],
      ['经营记录', 'records'],
    ]) {
      await page.locator('nav').getByRole('link', { name }).click();
      await page.waitForURL(`**/#/${route}`);
      await page.waitForFunction(
        () => document.querySelector('main').scrollTop === 0,
      );
      assert.equal(
        await page.getByRole('main').evaluate((element) => element.scrollTop),
        0,
        'Navigation resets only the content scroll',
      );
      await assertContentScrollOnly(page, {
        expectOverflow: ['工作台', '生产与设施', '库存与采购'].includes(name),
      });
    }
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.locator('nav').getByRole('link', { name: '工作台' }).click();
    await page.screenshot({
      path: path.join(output, 'dashboard-dark.png'),
      fullPage: true,
    });
    for (const width of [768, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.getByRole('button', { name: '打开导航' }).click();
      await page
        .getByRole('dialog')
        .getByRole('link', { name: '生产与设施' })
        .click();
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      await assertContentScrollOnly(page);
      await page.screenshot({
        path: path.join(output, `production-${width}.png`),
        fullPage: true,
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      'Browser flow passed: supply, farming, repair, settlement, persistence; fixed shell and content wheel scrolling at 1440/1000/768/375 px, dark theme and larger text.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
