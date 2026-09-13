/**
 * P1 第一章完整版客户端回归检查。
 * 覆盖关卡全量配置、章节推进、精英/Boss 奖励、御兽迁移、培养、战斗可见性与章节结算。
 * 运行：node .\tests\p1-full-chapter-check.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const dataSource = fs.readFileSync(path.join(root, 'p1-data.js'), 'utf8');
const gameSource = fs.readFileSync(path.join(root, 'p0.js'), 'utf8').replace(
  /\}\)\(\);\s*$/,
  ';globalThis.__p1FullTest={P,B,stageById,isStageUnlocked,applyStageRewards,applyNormalStageRewards,grantPet,activePetLevel,activePetSkillDamage,activePetSkillCooldown,upgradePet,equipGear,effectiveWallMaxHp};})();',
);

function makeElement() {
  const classes = new Set();
  return {
    textContent: '', innerHTML: '', style: {}, hidden: false, disabled: false,
    classList: { add: (x) => classes.add(x), remove: (x) => classes.delete(x), toggle: (x, force) => { if (force === undefined) return classes.has(x) ? (classes.delete(x), false) : (classes.add(x), true); force ? classes.add(x) : classes.delete(x); return force; } },
    setAttribute() {}, appendChild() {},
  };
}
function boot(savedData = {}) {
  const storage = { wanjian_fengyao_p0_v3: JSON.stringify(savedData) };
  const elements = {};
  const context = {
    console, Math, setTimeout: () => 0, clearTimeout: () => {}, performance: { now: () => 0 }, requestAnimationFrame: () => 0, devicePixelRatio: 1,
    localStorage: { getItem: (key) => storage[key] ?? null, setItem: (key, value) => { storage[key] = value; } },
    document: { getElementById: (id) => elements[id] ?? (elements[id] = makeElement()), querySelector: () => makeElement(), querySelectorAll: () => [], createElement: () => makeElement(), addEventListener: () => {} },
    window: { addEventListener: () => {} },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(dataSource, context, { filename: 'p1-data.js' });
  vm.runInContext(gameSource, context, { filename: 'p0.js' });
  return context.__p1FullTest;
}
let assertions = 0;
function assert(condition, message) { assertions += 1; if (!condition) throw new Error(`断言失败：${message}`); }

const fresh = boot();
const stages = Array.from({ length: 10 }, (_, index) => fresh.stageById(`1-${String(index + 1).padStart(2, '0')}`));
assert(stages.every(Boolean), '第一章 1-01 至 1-10 节点均存在');
assert(fresh.isStageUnlocked(stages[0]), '新档默认解锁 1-01');
assert(!fresh.isStageUnlocked(stages[1]), '新档不会越级解锁 1-02');
for (let i = 0; i < stages.length - 1; i += 1) { fresh.P.chapterProgress.cleared[stages[i].id] = true; assert(fresh.isStageUnlocked(stages[i + 1]), `${stages[i].id} 通关后顺序解锁 ${stages[i + 1].id}`); }
assert(stages[5].type === 'elite' && stages[5].boss.name === '荒原石甲兽' && stages[5].boss.summonCount === 3, '1-06 配置精英首领和召唤机制');
assert(stages[8].type === 'boss' && stages[8].capture.tutorialFixedSuccess && stages[8].firstClear.pet === 'xunmuQingque', '1-09 配置首次必成结契与寻木青雀奖励');
assert(stages[9].type === 'story', '1-10 为非战斗章节结算节点');
assert(gameSource.includes('function drawPetSprite()') && gameSource.includes('drawPetSprite(); drawPlayerSprite'), '已出战御兽会在战斗 Canvas 中实体绘制并位于主角层之前');

const rewardTest = boot();
rewardTest.B.stage = rewardTest.stageById('1-04');
rewardTest.applyStageRewards(true);
assert(rewardTest.P.materials.swordIron === 3 && rewardTest.P.materials.pactCharm === 1, '普通关可发放多种材料');
rewardTest.B.stage = rewardTest.stageById('1-06');
rewardTest.applyStageRewards(true);
assert(rewardTest.P.ownedGear.includes('stoneTalisman'), '精英首通获得石甲镇符');
assert(rewardTest.equipGear('stoneTalisman'), '石甲镇符可穿戴');
assert(rewardTest.effectiveWallMaxHp() === 1320, '石甲镇符为护阵增加 120 上限');
rewardTest.B.stage = rewardTest.stageById('1-09');
rewardTest.applyStageRewards(true);
assert(rewardTest.P.materials.qingqueFeather === 3 && rewardTest.P.materials.pactCharm === 2, '章节 Boss 首通发放青雀灵羽和结契符');
assert(rewardTest.P.activePet === 'xunmuQingque' && rewardTest.activePetLevel() === 1, '章节 Boss 首通获得并默认出战寻木青雀');
assert(rewardTest.activePetSkillDamage() === 42 && rewardTest.activePetSkillCooldown() === 12, '寻木青雀 Lv.1 协战伤害与冷却正确');
assert(rewardTest.upgradePet(), '御兽满足资源时可培养');
assert(rewardTest.activePetLevel() === 2 && rewardTest.P.materials.qingqueFeather === 2, '培养消耗青雀灵羽并提升等级');
assert(rewardTest.activePetSkillDamage() === 52 && rewardTest.activePetSkillCooldown() === 11.5, '培养后协战伤害和冷却实际变化');
rewardTest.B.stage = rewardTest.stageById('1-10');
rewardTest.applyStageRewards(true);
assert(rewardTest.P.chapterProgress.chapterCompleted, '章节结算写入第一章完成记录');

const migrated = boot({ pet: '寻木青雀', tutorialCaptureDone: false });
assert(migrated.P.schemaVersion === 6, '旧档升级至 schema 6');
assert(migrated.P.petRoster.includes('xunmuQingque') && migrated.P.activePet === 'xunmuQingque', '旧 P0 灵宠字段迁移为御兽列表和出战位');
assert(migrated.P.petProgress.xunmuQingque.level === 1 && migrated.P.tutorialCaptureDone, '旧灵宠迁移为 Lv.1 且保留已完成引导');

console.log(`P1 第一章完整版检查通过：${assertions} 项断言全部通过。`);
