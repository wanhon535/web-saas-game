/**
 * 《修仙御兽：万剑封妖》P1+ 护阵重构与复生规则检查。
 *
 * 覆盖护阵缓慢修复、归零后的五秒快速重构、复生资格随当前护阵状态恢复、
 * 每局一次免费复生、内测模拟付费复生，以及普通妖物 / Boss 的既有战斗压力。
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
    ";globalThis.__combatTest={B,damagePlayer,damageWall,bothDefensesLost,canRevive,revivePlayer,repairWallIfQuiet,updateNormalEnemy,updateBoss,updateHostileShots};})();",
  );

function makeElement() {
  return {
    textContent: "",
    innerHTML: "",
    style: {},
    hidden: false,
    disabled: false,
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
    freeReviveUsed: false,
    paidReviveCount: 0,
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
assert(test.B.player.dead, "主角生命归零后进入原地战败观战状态");
assert(!test.B.finished, "护阵尚存时主角阵亡不会立即结束试炼");
assert(test.canRevive(), "护阵当前有生命时主角获得复生资格");
test.B.hostileShots = [{ target: "player" }, { target: "wall" }];
assert(test.revivePlayer("free"), "本局首次免费复生可执行");
assert(test.B.freeReviveUsed && !test.B.player.dead, "免费复生后记录已使用且主角重新起身");
assert(test.B.player.hp === 50, "免费复生恢复主角 50% 生命");
assert(test.B.hostileShots.length === 1 && test.B.hostileShots[0].target === "wall", "复生会清除仍锁定主角的妖术");

test.damagePlayer(100, "第二次战败");
assert(!test.revivePlayer("free"), "同一局免费复生仅可使用一次");
assert(test.revivePlayer("paid"), "免费次数用尽后可使用内测模拟付费复生");
assert(test.B.paidReviveCount === 1 && test.B.player.hp === 50, "首次内测模拟付费复生正确记录并恢复生命");
test.damagePlayer(100, "第三次战败");
assert(test.revivePlayer("paid") && test.B.paidReviveCount === 2, "内测模拟付费复生可不限次数重复使用");

resetBattle(test);
test.damagePlayer(100, "主角先战败");
test.damageWall(100, "测试攻阵");
assert(test.B.wallBroken && test.B.finished, "主角观战时护阵归零立即结算失败");
assert(!test.canRevive(), "结算失败后不能执行复生");

resetBattle(test);
test.damageWall(100, "护阵归零");
assert(test.B.wallBroken && test.B.hp === 0 && !test.B.finished, "主角存活时护阵归零不会立即结束试炼");
assert(!test.canRevive(), "护阵归零时不存在主角复生资格");
test.B.wallUnderAttack = false;
test.B.wallQuietFor = 4.89;
assert(!test.repairWallIfQuiet(0.1) && test.B.hp === 0, "护阵归零后未满约五秒静默期不会重构");
test.B.wallQuietFor = 4.99;
assert(test.repairWallIfQuiet(0.02), "护阵归零后静默约五秒开始快速重构");
assert(test.B.hp > 0 && !test.B.wallBroken, "护阵重构出生命后解除当前破阵状态");
test.damagePlayer(100, "重构后战败");
assert(test.canRevive(), "护阵重构后主角死亡会重新获得复生资格");

resetBattle(test);
test.B.hp = 70;
test.B.wallQuietFor = 2.4;
assert(test.repairWallIfQuiet(0.5), "护阵未破时停止受击达到等待时间后开始缓慢自修复");
assert(test.B.hp > 70 && test.B.hp <= test.B.maxHp, "护阵常规修复不会超过生命上限");
test.B.wallUnderAttack = true;
test.B.wallQuietFor = 1.8;
assert(!test.repairWallIfQuiet(1) && test.B.wallQuietFor === 0, "护阵再次受击会重置自修复等待时间");

resetBattle(test);
const normal = { x: 190, y: 450, r: 30, speed: 18, slow: 0, meleeDamage: 15, meleeInterval: 1.2, attackCooldown: 0, wallDamage: 25, wallInterval: 1.5, wallAttackCooldown: 1, name: "污化狼妖" };
test.updateNormalEnemy(normal, 0.1, { h: 680 });
assert(normal.mode === "melee" && normal.y === 450, "普通妖物接近主角后暂停推进并转为近战攻击");
assert(test.B.player.hp === 85, "普通妖物近战会实际扣除主角生命");
test.B.player.x = 360;
test.updateNormalEnemy(normal, 0.5, { h: 680 });
assert(normal.mode === "advance" && normal.y > 450, "主角拉开距离后普通妖物恢复向护阵推进");

resetBattle(test);
test.damagePlayer(100, "战败状态");
const enemyAfterDefeat = { x: 190, y: 450, r: 30, speed: 18, slow: 0, meleeDamage: 15, meleeInterval: 1.2, attackCooldown: 0, wallDamage: 25, wallInterval: 1.5, wallAttackCooldown: 1, name: "污化狼妖" };
test.updateNormalEnemy(enemyAfterDefeat, 0.1, { h: 680 });
assert(enemyAfterDefeat.mode !== "melee", "主角战败后普通妖物不再以主角为攻击目标");
assert(test.B.player.hp === 0, "主角血条归零后不会被普通妖物继续扣血");

resetBattle(test);
test.B.hp = 0;
const enemyAtBrokenWall = { x: 360, y: 535, r: 30, speed: 18, slow: 0, meleeDamage: 15, meleeInterval: 1.2, attackCooldown: 1, wallDamage: 25, wallInterval: 1.5, wallAttackCooldown: 0, name: "污化狼妖" };
test.updateNormalEnemy(enemyAtBrokenWall, 0.1, { h: 680 });
assert(enemyAtBrokenWall.mode === "breach", "护阵归零后普通妖物不再对零生命护阵持续攻击");
assert(!test.B.wallUnderAttack, "敌人停止攻阵后护阵可开始计算五秒重构静默期");

resetBattle(test);
const boss = { x: 190, y: 180, anchorY: 180, speed: 20, r: 44, enraged: false, meleeCooldown: 2, rangedCooldown: 0, mode: "guard", name: "寻木青雀" };
test.updateBoss(boss, 0.1, { w: 390, h: 680 });
assert(test.B.hostileShots.length === 2, "Boss 远程攻击会分别生成针对主角和护宗大阵的攻击");
assert(new Set(test.B.hostileShots.map((shot) => shot.target)).size === 2, "Boss 双目标远程攻击包含主角与护阵两个目标");

resetBattle(test);
test.B.hp = 0;
const breachedBoss = { x: 190, y: 180, anchorY: 180, speed: 20, r: 44, enraged: false, meleeCooldown: 2, rangedCooldown: 0, mode: "guard", name: "寻木青雀" };
test.updateBoss(breachedBoss, 0.1, { w: 390, h: 680 });
assert(breachedBoss.mode === "breachAdvance" && breachedBoss.y > 180, "护阵归零时 Boss 转为压进，不再驻守原地");
assert(test.B.hostileShots.length === 1 && test.B.hostileShots[0].target === "player", "护阵归零时 Boss 不再对零生命护阵持续发射妖术");

console.log(`P1+ 护阵重构与复生规则检查通过：${assertions} 项断言全部通过。`);
