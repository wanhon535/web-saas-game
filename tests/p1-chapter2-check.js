/**
 * P1+ 第二章《灵木妖林》客户端检查。
 * 覆盖连续解锁、内容配置、奖励、旧档迁移与第一章兼容。
 * 运行：node .\tests\p1-chapter2-check.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const dataSource = fs.readFileSync(path.join(root, 'p1-data.js'), 'utf8');
const gameSource = fs.readFileSync(path.join(root, 'p0.js'), 'utf8').replace(
  /\}\)\(\);\s*$/,
  ';globalThis.__p1Chapter2Test={P,B,stageById,isStageUnlocked,applyStageRewards,gearById,chapterConfig,stageChapter};})();',
);
function makeElement() {
  const classes = new Set();
  return { textContent: '', innerHTML: '', style: {}, hidden: false, disabled: false,
    classList: { add: (x) => classes.add(x), remove: (x) => classes.delete(x), toggle: (x, force) => { if (force === undefined) return classes.has(x) ? (classes.delete(x), false) : (classes.add(x), true); force ? classes.add(x) : classes.delete(x); return force; } },
    setAttribute() {}, appendChild() {},
  };
}
function boot(savedData = {}) {
  const storage = { wanjian_fengyao_p0_v3: JSON.stringify(savedData) }, elements = {};
  const context = {
    console, Math, setTimeout: () => 0, clearTimeout: () => {}, performance: { now: () => 0 }, requestAnimationFrame: () => 0, devicePixelRatio: 1,
    localStorage: { getItem: (key) => storage[key] ?? null, setItem: (key, value) => { storage[key] = value; } },
    document: { body: { classList: { toggle() {} } }, getElementById: (id) => elements[id] ?? (elements[id] = makeElement()), querySelector: () => makeElement(), querySelectorAll: () => [], createElement: () => makeElement(), addEventListener: () => {} },
    window: { addEventListener: () => {} },
  };
  context.globalThis = context; vm.createContext(context); vm.runInContext(dataSource, context, { filename: 'p1-data.js' }); vm.runInContext(gameSource, context, { filename: 'p0.js' }); return context.__p1Chapter2Test;
}
let assertions = 0;
function assert(condition, message) { assertions += 1; if (!condition) throw new Error(`断言失败：${message}`); }

const fresh = boot();
const chapterOneEnd = fresh.stageById('1-10');
const chapterTwo = Array.from({ length: 10 }, (_, index) => fresh.stageById(`2-${String(index + 1).padStart(2, '0')}`));
assert(chapterTwo.every(Boolean), '第二章 2-01 至 2-10 节点均存在');
assert(!fresh.isStageUnlocked(chapterTwo[0]), '新档不会提前开放 2-01');
fresh.P.chapterProgress.cleared['1-10'] = true;
assert(fresh.isStageUnlocked(chapterTwo[0]), '完成 1-10 后顺序解锁 2-01');
for (let i = 0; i < chapterTwo.length - 1; i += 1) { fresh.P.chapterProgress.cleared[chapterTwo[i].id] = true; assert(fresh.isStageUnlocked(chapterTwo[i + 1]), `${chapterTwo[i].id} 通关后顺序解锁 ${chapterTwo[i + 1].id}`); }
assert(fresh.stageChapter(chapterOneEnd) === 1 && fresh.stageChapter(chapterTwo[0]) === 2, '章节归属正确解析');
assert(fresh.chapterConfig(chapterTwo[0]).name === '灵木妖林', '第二章地图名为灵木妖林');
assert(chapterTwo[5].type === 'elite' && chapterTwo[5].boss.name === '玄藤鹿灵' && chapterTwo[5].boss.kind === 'forestElite', '2-06 配置玄藤鹿灵精英战');
assert(chapterTwo[8].type === 'boss' && chapterTwo[8].boss.name === '碧瞳树蛟' && chapterTwo[8].boss.kind === 'forestChapter', '2-09 配置碧瞳树蛟章节 Boss');
assert(chapterTwo[9].type === 'story', '2-10 为第二章结算节点');
assert(fresh.gearById('spiritwoodRobe') && fresh.gearById('vineBracer'), '第二章固定装备配置有效');

const reward = boot();
reward.B.stage = reward.stageById('2-02');
reward.applyStageRewards(true);
assert(reward.P.materials.woodEssence === 3 && reward.P.materials.spiritSand === 2, '2-02 正确发放灵木材料');
assert(reward.P.ownedGear.includes('spiritwoodRobe'), '2-02 首通获得灵木法衣');
reward.B.stage = reward.stageById('2-06'); reward.applyStageRewards(true);
assert(reward.P.ownedGear.includes('vineBracer') && reward.P.materials.vineCore === 3, '2-06 首通获得玄藤护腕与妖藤灵核');
reward.B.stage = reward.stageById('2-10'); reward.applyStageRewards(true);
assert(reward.P.chapterProgress.chapterCompletion['2'], '2-10 结算写入第二章完成记录');

const migrated = boot({ schemaVersion: 5, chapterProgress: { currentStage: '1-10', cleared: { '1-10': true }, firstRewards: { '1-10': true }, chapterCompleted: true }, materials: { swordIron: 9, qingqueFeather: 2 }, ownedGear: ['stoneTalisman'], equippedGear: { bracer: null, robe: null, jade: null, talisman: 'stoneTalisman' }, petRoster: ['xunmuQingque'], activePet: 'xunmuQingque', petProgress: { xunmuQingque: { level: 3 } } });
assert(migrated.P.schemaVersion === 6, '第一章旧档平滑升级至 schema 6');
assert(migrated.P.chapterProgress.chapterCompletion['1'] && !migrated.P.chapterProgress.chapterCompletion['2'], '旧第一章完成记录迁移为分章节记录');
assert(migrated.P.materials.swordIron === 9 && migrated.P.materials.woodEssence === 0 && migrated.P.materials.vineCore === 0, '新增材料不会破坏旧档材料');
assert(migrated.P.activePet === 'xunmuQingque' && migrated.P.petProgress.xunmuQingque.level === 3, '旧档出战御兽与培养等级保持不变');
assert(migrated.P.equippedGear.talisman === 'stoneTalisman', '旧档装备穿戴状态保持不变');

console.log(`P1+ 第二章检查通过：${assertions} 项断言全部通过。`);
