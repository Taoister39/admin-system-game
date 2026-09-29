const assert = require('node:assert/strict');

async function assertContentScrollOnly(page, { expectOverflow = true } = {}) {
  const content = page.getByRole('main', { name: '经营内容' });
  // A closing Ant Design popup can retain its pre-resize position during its exit animation.
  await page.waitForFunction(
    () => document.documentElement.scrollWidth === innerWidth,
    undefined,
    { timeout: 3000 },
  );
  await content.evaluate((element) => element.scrollTo(0, 0));
  const measure = () =>
    page.evaluate(() => {
      const main = document.querySelector('main');
      const header = document.querySelector('header[aria-label="营业操作栏"]');
      const anchors = [
        ...document.querySelectorAll(
          '[aria-label="窗口标题栏"], [aria-label="事务所侧栏"], header[aria-label="营业操作栏"]',
        ),
      ].filter((element) => element.getBoundingClientRect().height > 0);
      return {
        anchors: anchors.map((element) => ({
          name: element.getAttribute('aria-label'),
          top: element.getBoundingClientRect().top,
          bottom: element.getBoundingClientRect().bottom,
        })),
        scrollTop: main.scrollTop,
        overflow: main.scrollHeight > main.clientHeight,
        contentWidth: main.scrollWidth,
        clientWidth: main.clientWidth,
        mainTop: main.getBoundingClientRect().top,
        mainBottom: main.getBoundingClientRect().bottom,
        headerBottom: header.getBoundingClientRect().bottom,
        viewport: innerHeight,
        documentTop: document.scrollingElement.scrollTop,
        documentHeight: document.documentElement.scrollHeight,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
      };
    });
  const before = await measure();
  assert.equal(
    before.mainTop,
    before.headerBottom,
    'Content starts below the fixed operation bar',
  );
  assert.equal(
    before.mainBottom,
    before.viewport,
    'Content fills the remaining viewport',
  );
  assert.equal(
    before.documentHeight,
    before.viewport,
    'The document must not grow beyond the window',
  );
  assert.equal(
    before.documentWidth,
    before.viewportWidth,
    'The document must not overflow horizontally',
  );
  assert.equal(
    before.contentWidth,
    before.clientWidth,
    'Wide tables must scroll inside their own containers',
  );
  if (expectOverflow)
    assert.equal(
      before.overflow,
      true,
      'This fixture must exercise real scrolling',
    );
  const box = await content.boundingBox();
  await page.mouse.move(box.x + 8, box.y + box.height - 16);
  await page.mouse.wheel(0, 1200);
  if (before.overflow)
    await page.waitForFunction(
      () => document.querySelector('main').scrollTop > 0,
    );
  const after = await measure();
  assert.deepEqual(
    after.anchors,
    before.anchors,
    'Scrolling must not move the titlebar, sidebar or operation bar',
  );
  assert.equal(after.documentTop, 0, 'The outer document must never scroll');
  if (before.overflow)
    assert.ok(after.scrollTop > 0, 'Wheel input scrolls the content');
  await content.evaluate((element) =>
    element.scrollTo(0, element.scrollHeight),
  );
  await page.mouse.wheel(0, 1200);
  const atBottom = await measure();
  assert.deepEqual(
    atBottom.anchors,
    before.anchors,
    'Scrolling past the content end must keep the shell fixed',
  );
  assert.equal(atBottom.documentTop, 0);
  assert.equal(
    await page
      .getByRole('button', { name: '结束营业', exact: true })
      .isVisible(),
    true,
  );
}

module.exports = { assertContentScrollOnly };
