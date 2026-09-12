/**
 * 《修仙御兽：万剑封妖》P0 关键规则回归检查。
 *
 * 这是无依赖的 Node 脚本：它加载真实 p0.js，并以隔离的最小 DOM
 * 验证首次结契教学、旧存档迁移及后续挑战的抓捕分支。
 * 运行：node .\tests\p0-regression-check.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const gamePath = path.resolve(__dirname, '..', 'p0.js');
const source = fs
  .readFileSync(gamePath, 'utf8')
  .replace(/\}\)\(\);\s*$/, ';globalThis.__p0Test={P,B,capture,declineCapture,updateCapturePanel};})();');

function makeElement() {
  const classes = new Set();
  return {
    textContent: '',
    innerHTML: '',
    style: {},
    attributes: {},
    children: [],
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      toggle: (name, force) => {
        if (force === undefined) {
          if (classes.has(name)) {
            classes.delete(name);
            return false;
          }
          classes.add(name);
          return true;
        }
        if (force) classes.add(name);
        else classes.delete(name);
        return force;
      },
      contains: (name) => classes.has(name),
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return this.attributes[name] ?? null;
    },
    appendChild(child) {
      this.children.push(child);
    },
  };
}

function boot(savedData = {}) {
  const elements = Object.fromEntries(
    [
      'catchTitle',
      'catchDesc',
      'catchSealRate',
      'catchGourdRate',
      'declineCatchHint',
      'catchPanel',
      'battleMsg',
      'toast',
    ].map((id) => [id, makeElement()]),
  );
  const declineButton = makeElement();
  const storage = { wanjian_fengyao_p0_v3: JSON.stringify(savedData) };
  const context = {
    console,
    Math: Object.create(Math),
    setTimeout: () => 0,
    clearTimeout: () => {},
    performance: { now: () => 0 },
    requestAnimationFrame: () => 0,
    devicePixelRatio: 1,
    localStorage: {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => {
        storage[key] = value;
      },
    },
    document: {
      getElementById: (id) => elements[id] ?? (elements[id] = makeElement()),
      querySelector: (selector) =>
        selector === '[data-action="decline-catch"]' ? declineButton : null,
      querySelectorAll: () => [],
      createElement: () => makeElement(),
      addEventListener: () => {},
    },
    window: { addEventListener: () => {} },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'p0.js' });
  return { context, test: context.__p0Test, elements, declineButton };
}

let assertionCount = 0;
function assert(condition, message) {
  assertionCount += 1;
  if (!condition) throw new Error(`断言失败：${message}`);
}

function showCapturePanel(instance) {
  instance.test.B.running = true;
  instance.test.B.catchShown = true;
  instance.test.updateCapturePanel();
}

// 1. 新手教学：显示、阻止诛灭、镇妖符必定成功。
const firstSeal = boot();
assert(firstSeal.test.P.schemaVersion === 5, '旧 P0 存档迁移至 P1 第一章完整版存档版本');
assert(firstSeal.test.P.chapterProgress.currentStage === '1-01', '新存档默认从第一章第一关开始');
assert(firstSeal.test.P.materials.swordIron === 0, '旧存档补齐剑胚残铁材料字段');
assert(
  firstSeal.test.P.equippedGear.bracer === null &&
    firstSeal.test.P.equippedGear.robe === null &&
    firstSeal.test.P.equippedGear.jade === null,
  '旧存档补齐三个基础装备栏位',
);
showCapturePanel(firstSeal);
assert(firstSeal.elements.catchTitle.textContent === '结契引导：首次抓捕必定成功', '首次抓捕标题');
assert(
  firstSeal.elements.catchSealRate.textContent === '必定成功' &&
    firstSeal.elements.catchGourdRate.textContent === '必定成功',
  '首次两种抓捕工具的成功率文案',
);
assert(firstSeal.declineButton.getAttribute('aria-disabled') === 'true', '首次继续诛灭限制状态');
firstSeal.test.declineCapture();
assert(!firstSeal.test.B.catchDone, '首次教学不能继续诛灭');
assert(firstSeal.elements.toast.textContent === '首次试炼请完成结契引导', '首次诛灭提示');
firstSeal.context.Math.random = () => 0.999;
firstSeal.test.capture('seal');
assert(
  firstSeal.test.P.pet === '寻木青雀' && firstSeal.test.P.tutorialCaptureDone,
  '首次镇妖符在任意随机值下必定成功并写入教学进度',
);

// 2. 新手教学：镇妖葫芦同样必定成功，且正常消耗 1 个库存。
const firstGourd = boot();
showCapturePanel(firstGourd);
firstGourd.context.Math.random = () => 0.999;
firstGourd.test.capture('gourd');
assert(firstGourd.test.P.pet === '寻木青雀', '首次镇妖葫芦必定成功');
assert(firstGourd.test.P.gourds === 2, '首次镇妖葫芦正确消耗 1 个库存');

// 3. 旧存档与后续挑战：恢复常规概率、允许继续诛灭。
const repeat = boot({ pet: '寻木青雀', tutorialCaptureDone: false });
assert(repeat.test.P.tutorialCaptureDone, '拥有寻木青雀的旧存档自动完成教学迁移');
showCapturePanel(repeat);
assert(
  repeat.elements.catchSealRate.textContent === '30%' &&
    repeat.elements.catchGourdRate.textContent === '65%',
  '重复挑战恢复常规抓捕概率文案',
);
assert(repeat.declineButton.getAttribute('aria-disabled') === 'false', '重复挑战允许继续诛灭');
repeat.test.declineCapture();
assert(repeat.test.B.catchDone && !repeat.test.B.paused, '重复挑战继续诛灭可正常恢复战斗');

// 4. 常规失败：保留原有狂暴补救分支。
const failure = boot({ pet: '寻木青雀', tutorialCaptureDone: true });
showCapturePanel(failure);
failure.test.B.boss = { maxHp: 320, hp: 100, speed: 13, enraged: false };
failure.context.Math.random = () => 0.5;
failure.test.capture('seal');
assert(failure.test.B.boss.enraged, '常规镇妖符失败后 Boss 进入狂暴');
assert(failure.test.B.boss.speed === 22, '常规镇妖符失败后 Boss 使用狂暴速度');
assert(Math.abs(failure.test.B.boss.hp - 176.8) < 0.001, '常规镇妖符失败后 Boss 回复 24% 最大生命');

console.log(`P0 回归检查通过：${assertionCount} 项断言全部通过。`);
