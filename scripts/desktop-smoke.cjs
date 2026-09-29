const assert = require('node:assert/strict');
const { mkdtemp, rm, readFile } = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { _electron } = require('playwright');
const { assertContentScrollOnly } = require('./layout-check.cjs');

async function main() {
  const prefix = path.join(os.tmpdir(), 'town-office-desktop-');
  const directory = await mkdtemp(prefix);
  const environment = {
    ...Object.fromEntries(
      Object.entries(process.env).filter(
        ([name]) =>
          !['ELECTRON_RUN_AS_NODE', 'RSBUILD_DEV_SERVER_URL'].includes(name),
      ),
    ),
    TOWN_OFFICE_TEST_DATA: directory,
  };
  let application;
  try {
    const launch = () =>
      _electron.launch({
        executablePath: require('electron'),
        args: [process.env.GAME_APP_PATH ?? path.resolve('packer')],
        env: environment,
      });
    application = await launch();
    const page = await application.firstWindow();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.getByRole('heading', { name: '开门营业，慢慢来。' }).waitFor();
    const viewport = await application.evaluate(({ BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows()[0];
      window.setSize(1000, 640);
      return window.getContentBounds();
    });
    // Windows may add border pixels to a hidden titlebar window's requested height.
    await page.waitForFunction(
      ({ width, height }) => innerWidth === width && innerHeight === height,
      viewport,
      { timeout: 5000 },
    );
    await assertContentScrollOnly(page);
    assert.equal(
      await page
        .getByLabel('窗口标题栏')
        .evaluate((element) => element.getBoundingClientRect().top),
      0,
    );
    assert.equal(
      await page
        .getByLabel('窗口标题栏')
        .evaluate((element) => element.getBoundingClientRect().height),
      36,
    );
    assert.ok(page.url().startsWith('file:'));
    assert.equal(
      await page.evaluate(() => typeof window.gameStorage.save),
      'function',
    );
    const target = await page.evaluate(() => window.gameStorage.saveLocation());
    assert.ok(path.resolve(target).startsWith(path.resolve(directory)));
    await page
      .getByRole('row')
      .filter({ hasText: '萝卜供货 · 4 份' })
      .getByRole('button', { name: /接\s*单/ })
      .click();
    await page.waitForFunction(
      async () =>
        JSON.parse((await window.gameStorage.load()).raw)?.orders[0].status ===
        'accepted',
    );
    const saved = JSON.parse(await readFile(target, 'utf8'));
    assert.equal(saved.revision, 1);
    assert.equal(saved.orders[0].status, 'accepted');
    await application.close();
    application = await launch();
    const reopened = await application.firstWindow();
    await reopened
      .getByRole('heading', { name: '开门营业，慢慢来。' })
      .waitFor();
    const restored = await reopened.evaluate(async () =>
      JSON.parse((await window.gameStorage.load()).raw),
    );
    assert.deepEqual(restored, saved);
    assert.deepEqual(errors, []);
    console.log(
      `Desktop flow passed: fixed titlebar, sidebar and operation bar at ${viewport.width} x ${viewport.height}; content wheel scrolling, offline loading, isolated bridge, atomic file save and restart persistence.`,
    );
  } finally {
    if (application) await application.close();
    if (path.resolve(directory).startsWith(path.resolve(prefix)))
      await rm(directory, { recursive: true, force: true });
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
