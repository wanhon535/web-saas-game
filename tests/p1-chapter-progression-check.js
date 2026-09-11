/**
 * 《修仙御兽：万剑封妖》P1.1 第一章推进回归检查。
 *
 * 验证普通关解锁、首通奖励、重复奖励与固定装备归属，避免 P1
 * 的章节存档逻辑影响既有 P0 抓捕闭环。
 * 运行：node .\tests\p1-chapter-progression-check.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const dataSource = fs.readFileSync(path.join(root, "p1-data.js"), "utf8");
const gameSource = fs
  .readFileSync(path.join(root, "p0.js"), "utf8")
  .replace(
    /\}\)\(\);\s*$/,
    ";globalThis.__p1Test={P,B,stageById,isStageUnlocked,applyNormalStageRewards};})();",
  );

function makeElement() {
  return {
    textContent: "",
    innerHTML: "",
    style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {},
    appendChild() {},
  };
}

function boot(savedData = {}) {
  const storage = { wanjian_fengyao_p0_v3: JSON.stringify(savedData) };
  const context = {
    console,
    Math,
    setTimeout: () => 0,
    clearTimeout: () => {},
    performance: { now: () => 0 },
    requestAnimationFrame: () => 0,
    localStorage: {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => {
        storage[key] = value;
      },
    },
    document: {
      getElementById: () => makeElement(),
      querySelector: () => makeElement(),
      querySelectorAll: () => [],
      createElement: () => makeElement(),
      addEventListener: () => {},
    },
    window: { addEventListener: () => {} },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(dataSource, context, { filename: "p1-data.js" });
  vm.runInContext(gameSource, context, { filename: "p0.js" });
  return context.__p1Test;
}

let assertions = 0;
function assert(condition, message) {
  assertions += 1;
  if (!condition) throw new Error(`断言失败：${message}`);
}

const test = boot();
const stage101 = test.stageById("1-01");
const stage102 = test.stageById("1-02");
const stage103 = test.stageById("1-03");
const boss = test.stageById("1-09");

assert(
  Boolean(stage101 && stage102 && stage103 && boss),
  "第一章三普通关与后续 Boss 节点均存在",
);
assert(test.isStageUnlocked(stage101), "新档案默认仅解锁 1-01");
assert(!test.isStageUnlocked(stage102), "未通关 1-01 前 1-02 保持锁定");
assert(!test.isStageUnlocked(boss), "Boss 节点不因普通关完成而提前开放");

test.B.stage = stage101;
let rewards = test.applyNormalStageRewards(true);
assert(test.P.chapterProgress.cleared["1-01"], "首次通关写入已通关记录");
assert(test.P.chapterProgress.firstRewards["1-01"], "首次通关写入首通奖励记录");
assert(test.P.materials.swordIron === 2, "1-01 首通发放 2 个剑胚残铁");
assert(rewards.gold === 180 && rewards.firstClear, "1-01 首通使用首通仙石奖励");
assert(
  test.P.chapterProgress.currentStage === "1-02",
  "1-01 通关后默认指向 1-02",
);
assert(test.isStageUnlocked(stage102), "1-01 通关后解锁 1-02");

test.B.stage = stage101;
rewards = test.applyNormalStageRewards(true);
assert(test.P.materials.swordIron === 3, "重复挑战仅增加 1 个剑胚残铁");
assert(rewards.gold === 70 && !rewards.firstClear, "重复挑战使用重复仙石奖励");

test.B.stage = stage102;
rewards = test.applyNormalStageRewards(true);
assert(test.P.materials.swordIron === 6, "1-02 首通叠加 3 个剑胚残铁");
assert(test.P.ownedGear.includes("wildBracer"), "1-02 首通写入荒原护腕归属");
assert(
  test.P.equipment.includes("🪬 荒原护腕"),
  "1-02 首通同步至现有宝库展示列表",
);
assert(test.isStageUnlocked(stage103), "1-02 通关后解锁 1-03");

console.log(`P1 第一章推进检查通过：${assertions} 项断言全部通过。`);
