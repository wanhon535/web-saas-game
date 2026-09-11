/**
 * 《修仙御兽：万剑封妖》P1.1 基础装备回归检查。
 *
 * 验证装备归属、穿戴/卸下、战斗属性和仙石结算实际生效，
 * 同时防止无效旧存档装备进入栏位。
 * 运行：node .\tests\p1-equipment-check.js
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
    ";globalThis.__p1EquipmentTest={P,B,gearById,gearInSlot,equipmentStats,effectiveWeaponDamage,effectiveWallMaxHp,applyGoldBonus,currentPower,equipGear,unequipGear,start,shoot,applyNormalStageRewards,renderEquipmentGuide};})();",
  );

function makeElement(id = "") {
  return {
    textContent: "",
    innerHTML: "",
    style: {},
    dataset: {},
    className: "",
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {},
    appendChild() {},
    addEventListener() {},
    setPointerCapture() {},
    getBoundingClientRect: () => ({ width: 390, height: 680, left: 0, top: 0 }),
    getContext: () => ({ setTransform() {} }),
    id,
  };
}

function boot(savedData = {}) {
  const storage = { wanjian_fengyao_p0_v3: JSON.stringify(savedData) };
  const elements = {};
  const element = (id) => (elements[id] ||= makeElement(id));
  const context = {
    console,
    Math,
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
      getElementById: (id) => element(id),
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
  context.__p1EquipmentTest.elements = elements;
  return context.__p1EquipmentTest;
}

let assertions = 0;
function assert(condition, message) {
  assertions += 1;
  if (!condition) throw new Error(`断言失败：${message}`);
}

const test = boot({
  ownedGear: ["wildBracer", "arrayRobe", "warmJade"],
});

assert(test.effectiveWeaponDamage() === 16, "未穿戴时保留飞剑基础伤害");
assert(test.effectiveWallMaxHp() === 1200, "未穿戴时保留护阵基础上限");
assert(test.applyGoldBonus(100) === 100, "未穿戴时不改变仙石结算");
assert(test.equipGear("wildBracer"), "已拥有的荒原护腕可以穿戴");
assert(test.P.equippedGear.bracer === "wildBracer", "护腕写入对应装备栏");
assert(test.effectiveWeaponDamage() === 19, "荒原护腕实际增加飞剑伤害 3");
assert(test.currentPower() === 135, "护腕穿戴后剑意立即变化");
assert(test.equipGear("arrayRobe"), "已拥有的守阵法衣可以穿戴");
assert(test.effectiveWallMaxHp() === 1290, "守阵法衣实际增加护阵上限 90");
assert(test.equipGear("warmJade"), "已拥有的温灵玉佩可以穿戴");
assert(test.applyGoldBonus(1000) === 1080, "温灵玉佩实际增加仙石结算 8%");
assert(test.unequipGear("bracer"), "已穿戴护腕可以卸下");
assert(test.P.equippedGear.bracer === null, "卸下后对应装备栏清空");
assert(test.effectiveWeaponDamage() === 16, "卸下护腕后飞剑伤害恢复基础值");
assert(!test.equipGear("missingGear"), "未拥有或不存在的装备不能穿戴");

const battle = boot({ ownedGear: ["wildBracer", "arrayRobe"] });
battle.equipGear("wildBracer");
battle.equipGear("arrayRobe");
battle.start("1-01");
assert(battle.B.maxHp === 1290 && battle.B.hp === 1290, "守阵法衣实际写入每局战斗的初始护阵");
battle.B.enemies = [{ hp: 99, y: 10 }];
battle.shoot();
assert(battle.B.swords[0].damage === 19, "荒原护腕实际写入每柄自动飞剑伤害");

const migrated = boot({
  ownedGear: ["wildBracer"],
  equippedGear: { bracer: "arrayRobe", robe: "wildBracer", jade: "warmJade" },
});
assert(migrated.P.equippedGear.bracer === null, "旧存档中未拥有装备不会进入栏位");
assert(migrated.P.equippedGear.robe === null, "旧存档中栏位不匹配装备会被清空");
assert(migrated.P.equippedGear.jade === null, "旧存档中不存在玉佩归属会被清空");

const freshTutorial = boot();
assert(!freshTutorial.P.equipmentTutorial.firstGearReceived, "新存档默认未领取首件法器引导");
assert(!freshTutorial.P.equipmentTutorial.firstGearEquipped, "新存档默认未完成首次穿戴引导");

const migratedOwnedGear = boot({ ownedGear: ["wildBracer"] });
assert(migratedOwnedGear.P.equipmentTutorial.firstGearReceived, "旧存档已有法器时跳过首次获得引导");
assert(!migratedOwnedGear.P.equipmentTutorial.firstGearEquipped, "旧存档仅拥有法器时仍保留首次穿戴提示");

const migratedEquippedGear = boot({
  ownedGear: ["wildBracer"],
  equippedGear: { bracer: "wildBracer", robe: null, jade: null },
});
assert(migratedEquippedGear.P.equipmentTutorial.firstGearEquipped, "旧存档已有有效穿戴时跳过首次穿戴引导");

const firstGearReward = boot();
firstGearReward.B.stage = {
  id: "1-02",
  firstClear: { gold: 220, materials: { swordIron: 3 }, gear: "wildBracer" },
  repeat: { gold: 85, materials: { swordIron: 1 } },
};
const firstGearRewards = firstGearReward.applyNormalStageRewards(true);
assert(firstGearRewards.showEquipmentGuide, "首次获得荒原护腕时请求展示装备引导");
assert(firstGearReward.P.equipmentTutorial.firstGearReceived, "首次装备奖励写入已获得引导状态");
firstGearReward.renderEquipmentGuide();
assert(!firstGearReward.elements.equipmentGuide.hidden && firstGearReward.elements.equipmentGuide.innerHTML.includes("叶轻舟 · 残器指引"), "首页渲染叶轻舟轻量装备引导卡");
assert(firstGearReward.equipGear("wildBracer"), "首次奖励的荒原护腕可直接穿戴");
assert(firstGearReward.P.equipmentTutorial.firstGearEquipped, "首次成功穿戴写入引导完成状态");
assert(firstGearReward.elements.equipmentGuide.hidden, "首次穿戴后首页装备引导自动隐藏");
assert(firstGearReward.elements.toast.textContent.includes("灵纹已合") && firstGearReward.elements.toast.textContent.includes("飞剑伤害 +3"), "首次穿戴提示明确实际属性变化");
firstGearReward.unequipGear("bracer");
firstGearReward.equipGear("wildBracer");
assert(!firstGearReward.elements.toast.textContent.includes("灵纹已合"), "首次穿戴引导只提示一次");

console.log(`P1 基础装备检查通过：${assertions} 项断言全部通过。`);
