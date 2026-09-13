/**
 * 《修仙御兽：万剑封妖》P1+ 战斗生存规则检查。
 *
 * 验证主角生命、护宗大阵、普通妖物近战拦截、Boss 双目标远程攻击、
 * 护阵自修复及“主角与护阵同时失守才失败”的确认规则。
 * 运行：node .\tests\p1-combat-survival-check.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const source = fs
  .readFileSync(path.join(root, "p0.js"), "utf8")
  .replace(
    /\}\)\(\);\s*$/,
    ";globalThis.__combatTest={B,damagePlayer,damageWall,bothDefensesLost,repairWallIfQuiet,updateNormalEnemy,updateBoss};})();",
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

function boot() {
  const elements = {};
  const context = {
    console,
    Math: Object.create(Math),
    setTimeout: () => 0,
    clearTimeout: () => {},
    performance: { now: () => 0 },
    requestAnimationFrame: () => 0,
    localStorage: { getItem: () => null, setItem: () => {} },
    document: {
      getElementById: (id) => (elements[id] ||= makeElement()),
      querySelector: () => makeElement(),
      querySelectorAll: () => [],
      createElement: () => makeElement(),
      addEventListener: () => {},
    },
    window: { addEventListener: () => {} },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "p0.js" });
  return context.__combatTest;
}

let assertions = 0;
function assert(condition, message) {
  assertions += 1;
  if (!condition) throw new Error(`断言失败：${message}`);
}
function resetBattle(test) {
  Object.assign(test.B, {
    running: true,
    paused: false,
    finished: false,
    hp: 100,
    maxHp: 100,
    wallBroken: false,
    wallQuietFor: 0,
    wallUnderAttack: false,
    hostileShots: [],
    swords: [],
    enemies: [],
    stage: null,
  });
  Object.assign(test.B.player, {
    x: 190,
    y: 500,
    hp: 100,
    maxHp: 100,
    dead: false,
    hit: 0,
    dragging: false,
  });
}

const test = boot();
resetBattle(test);

test.damagePlayer(100, "测试近战");
assert(test.B.player.dead, "主角生命归零后进入重伤观战状态");
assert(!test.B.finished, "护阵尚存时主角阵亡不会立即结束试炼");
assert(!test.bothDefensesLost(), "只有主角阵亡时不满足双失守失败条件");

test.damageWall(100, "测试攻阵");
assert(test.B.wallBroken, "护阵生命归零后写入已破状态");
assert(test.B.finished, "主角已阵亡且护阵被击破时才结算失败");

resetBattle(test);
test.damageWall(100, "测试攻阵");
assert(test.B.wallBroken && !test.B.finished, "主角仍存活时护阵击破不会立即结束试炼");
test.damagePlayer(100, "测试近战");
assert(test.B.finished, "护阵已破后主角阵亡会立即结算失败");

resetBattle(test);
test.B.hp = 70;
test.B.wallQuietFor = 2.4;
assert(test.repairWallIfQuiet(0.5), "护阵停止受击达到等待时间后开始自我修复");
assert(test.B.hp > 70 && test.B.hp <= test.B.maxHp, "护阵修复不会超过生命上限");
test.B.wallUnderAttack = true;
test.B.wallQuietFor = 1.8;
assert(!test.repairWallIfQuiet(1), "护阵持续受击时不会自我修复");
assert(test.B.wallQuietFor === 0, "护阵再次受击会重置修复等待时间");

resetBattle(test);
const normal = { x: 190, y: 450, r: 30, speed: 18, slow: 0, meleeDamage: 15, meleeInterval: 1.2, attackCooldown: 0, wallDamage: 25, wallInterval: 1.5, wallAttackCooldown: 1, name: "污化狼妖" };
test.updateNormalEnemy(normal, 0.1, { h: 680 });
assert(normal.mode === "melee" && normal.y === 450, "普通妖物接近主角后暂停推进并转为近战攻击");
assert(test.B.player.hp === 85, "普通妖物近战会实际扣除主角生命");
test.B.player.x = 360;
test.updateNormalEnemy(normal, 0.5, { h: 680 });
assert(normal.mode === "advance" && normal.y > 450, "主角拉开距离后普通妖物恢复向护阵推进");

resetBattle(test);
const boss = { x: 190, y: 180, anchorY: 180, speed: 20, r: 44, enraged: false, meleeCooldown: 2, rangedCooldown: 0, mode: "guard", name: "寻木青雀" };
test.updateBoss(boss, 0.1, { w: 390, h: 680 });
assert(test.B.hostileShots.length === 2, "Boss 远程攻击会分别生成针对主角和护宗大阵的攻击");
assert(new Set(test.B.hostileShots.map((shot) => shot.target)).size === 2, "Boss 双目标远程攻击包含主角与护阵两个目标");

console.log(`P1+ 战斗生存规则检查通过：${assertions} 项断言全部通过。`);
