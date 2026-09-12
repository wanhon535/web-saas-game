(() => {
  const KEY = "wanjian_fengyao_p0_v3",

P1_DEFAULT = {
      schemaVersion: 5,
      chapterProgress: { currentStage: "1-01", cleared: {}, firstRewards: {}, chapterCompleted: false },
      materials: { swordIron: 0, spiritSand: 0, pactCharm: 0, qingqueFeather: 0 },
      ownedGear: [],
      equippedGear: { bracer: null, robe: null, jade: null, talisman: null },
      equipmentTutorial: { firstGearReceived: false, firstGearEquipped: false },
      petRoster: [], activePet: null, petProgress: {},
    },
    D = {
      gold: 8800, gourds: 3, weaponLevel: 1, weaponDamage: 16,
      equipment: ["🗡️ 青霄飞剑", "🪬 镇妖符"], pet: null, cleared: false, tutorialCaptureDone: false,
      ...P1_DEFAULT,
    };
  let P = { ...D }, storedData = {};
  try { storedData = JSON.parse(localStorage.getItem(KEY) || "{}"); P = { ...D, ...storedData }; } catch (e) {}
  function migrateP1() {
    const c = P.chapterProgress || {}, m = P.materials || {}, e = P.equippedGear || {}, t = P.equipmentTutorial || {};
    const storedTutorial = storedData.equipmentTutorial || {};
    const hasTutorialField = (field) => Object.prototype.hasOwnProperty.call(storedTutorial, field);
    const number = (value) => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    const oldPet = P.pet === "寻木青雀";
    const roster = Array.isArray(P.petRoster) ? [...new Set(P.petRoster.filter((id) => typeof id === "string"))] : [];
    if (oldPet && !roster.includes("xunmuQingque")) roster.push("xunmuQingque");
    const progress = { ...(P.petProgress || {}) };
    if (roster.includes("xunmuQingque")) progress.xunmuQingque = { level: Math.max(1, number(progress.xunmuQingque?.level) || 1) };
    P.schemaVersion = 5;
    P.chapterProgress = { currentStage: typeof c.currentStage === "string" ? c.currentStage : "1-01", cleared: { ...(c.cleared || {}) }, firstRewards: { ...(c.firstRewards || {}) }, chapterCompleted: Boolean(c.chapterCompleted) };
    P.materials = { swordIron: number(m.swordIron), spiritSand: number(m.spiritSand), pactCharm: number(m.pactCharm), qingqueFeather: number(m.qingqueFeather) };
    P.ownedGear = Array.isArray(P.ownedGear) ? [...new Set(P.ownedGear)] : [];
    P.equippedGear = { bracer: typeof e.bracer === "string" ? e.bracer : null, robe: typeof e.robe === "string" ? e.robe : null, jade: typeof e.jade === "string" ? e.jade : null, talisman: typeof e.talisman === "string" ? e.talisman : null };
    P.equipmentTutorial = { firstGearReceived: hasTutorialField("firstGearReceived") ? Boolean(t.firstGearReceived) : P.ownedGear.length > 0, firstGearEquipped: hasTutorialField("firstGearEquipped") ? Boolean(t.firstGearEquipped) : false };
    P.petRoster = roster; P.activePet = roster.includes(P.activePet) ? P.activePet : (roster[0] || null); P.petProgress = progress;
    if (oldPet) P.tutorialCaptureDone = true;
  }
  migrateP1();

  function petById(id) { return globalThis.P1_CONFIG?.pets?.[id] || null; }
  function activePetConfig() { return petById(P.activePet); }
  function activePetLevel() { const id = P.activePet; return id && P.petProgress?.[id] ? Math.max(1, Number(P.petProgress[id].level) || 1) : 0; }
  function activePetSkillDamage() { const pet = activePetConfig(); return pet ? pet.activeSkill.damage + Math.max(0, activePetLevel() - 1) * pet.upgrade.damage : 0; }
  function activePetSkillCooldown() { const pet = activePetConfig(); return pet ? Math.max(1, pet.activeSkill.cooldown - Math.max(0, activePetLevel() - 1) * pet.upgrade.cooldownReduction) : 0; }
  function grantPet(id) { const pet = petById(id) || (id === "xunmuQingque" ? { id, name: "寻木青雀" } : null); if (!pet) return false; if (!P.petRoster.includes(id)) P.petRoster.push(id); P.activePet = id; P.petProgress[id] = { level: Math.max(1, Number(P.petProgress[id]?.level) || 1) }; if (id === "xunmuQingque") P.pet = "寻木青雀"; return true; }
  function gearById(id) {
    return globalThis.P1_CONFIG?.gear?.[id] || null;
  }
  function gearInSlot(slot) {
    const gear = gearById(P.equippedGear?.[slot]);
    return gear && gear.slot === slot && P.ownedGear.includes(gear.id) ? gear : null;
  }
  function equipmentStats() {
    return ["bracer", "robe", "jade", "talisman"].reduce(
      (total, slot) => {
        const stats = gearInSlot(slot)?.stats || {};
        total.damage += stats.damage || 0;
        total.wallHp += stats.wallHp || 0;
        total.goldBonus += stats.goldBonus || 0;
        return total;
      },
      { damage: 0, wallHp: 0, goldBonus: 0 },
    );
  }
  function effectiveWeaponDamage() {
    return P.weaponDamage + equipmentStats().damage;
  }
  function effectiveWallMaxHp() {
    return 1200 + equipmentStats().wallHp;
  }
  function applyGoldBonus(amount) {
    return Math.floor(amount * (1 + equipmentStats().goldBonus));
  }
  function currentPower() {
    const stats = equipmentStats();
    return 110 + P.weaponLevel * 16 + stats.damage * 3 + Math.round(stats.wallHp / 10) + Math.round(stats.goldBonus * 100) + activePetLevel() * 10;
  }
  Object.keys(P.equippedGear).forEach((slot) => {
    if (!gearInSlot(slot)) P.equippedGear[slot] = null;
  });
  if (Object.values(P.equippedGear).some(Boolean)) {
    P.equipmentTutorial.firstGearEquipped = true;
  }
  const $ = (id) => document.getElementById(id),
    fmt = (n) => Math.floor(n).toLocaleString("zh-CN");
  let timer, canvas, ctx;
  const keys = new Set();
  const ATTACK_INTERVAL = 0.85,
    MAGNET_RANGE = 380,
    MAGNET_COLLECT_DISTANCE = 18,
    MAGNET_SPEED = 9;
  const B = {
    running: false,
    paused: false,
    last: 0,
    fire: 0,
    spawn: 0,
    wave: 0,
    queue: [],
    enemies: [],
    swords: [],
    drops: [],
    hp: 1200,
    maxHp: 1200,
    gold: 0,
    damage: 0,
    boss: null,
    bossCreated: false,
    catchShown: false,
    catchDone: false,
    finished: false,
    outcome: "",
    stage: null,
    isNormalStage: false,
    pendingFinish: false,
    petSkillCooldown: 0,
    eliteSummon: 0,
    player: { x: 0, y: 0, targetX: 0, targetY: 0, dragging: false },
  };
  function save() {
    localStorage.setItem(KEY, JSON.stringify(P));
  }
  function toast(s) {
    let e = $("toast");
    e.textContent = s;
    e.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => e.classList.remove("show"), 1800);
  }
  function chapterStages() {
    return globalThis.P1_CONFIG?.stages || [];
  }
  function stageById(id) {
    return chapterStages().find((stage) => stage.id === id) || null;
  }

  function isStageUnlocked(stage) {
    if (!stage) return false;
    if (stage.unlockedByDefault) return true;
    const stages = chapterStages(), index = stages.findIndex((item) => item.id === stage.id), previous = stages[index - 1];
    return Boolean(previous && P.chapterProgress.cleared[previous.id]);
  }
  function firstAvailableStage() {
    return chapterStages().find(isStageUnlocked) || null;
  }
  let selectedStageId = P.chapterProgress.currentStage;
  function selectedStage() {
    const current = stageById(selectedStageId);
    if (isStageUnlocked(current)) return current;
    const saved = stageById(P.chapterProgress.currentStage);
    if (isStageUnlocked(saved)) {
      selectedStageId = saved.id;
      return saved;
    }
    const first = firstAvailableStage();
    selectedStageId = first?.id || "";
    return first;
  }

  function rewardSummary(reward = {}) {
    const lines = [];
    if (reward.gold) lines.push(`🪙 ${reward.gold} 仙石`);
    Object.entries(reward.materials || {}).forEach(([id, amount]) => { const material = globalThis.P1_CONFIG?.materials?.[id]; if (material && amount) lines.push(`${material.icon} ${material.name} ×${amount}`); });
    if (reward.gear) { const gear = gearById(reward.gear); if (gear) lines.push(`${gear.icon} ${gear.name}`); }
    if (reward.pet) { const pet = petById(reward.pet); if (pet) lines.push(`${pet.icon} ${pet.name}`); }
    return lines.join(" · ") || "暂无额外奖励";
  }
  function stageTypeLabel(stage) { return { normal: "普通试炼", elite: "精英试炼", boss: "章节 Boss", story: "章节结算" }[stage.type] || "试炼"; }
  function renderChapterMap() {
    const map = $("stageMap"), brief = $("stageBrief"), startButton = $("stageStart"); if (!map || !brief || !startButton) return;
    const stages = chapterStages(), active = selectedStage();
    map.innerHTML = stages.map((stage, index) => {
      const cleared = Boolean(P.chapterProgress.cleared[stage.id]), unlocked = isStageUnlocked(stage), selected = active?.id === stage.id, state = cleared ? "cleared" : unlocked ? "open" : "locked";
      const status = cleared ? "已完成" : unlocked ? (stage.type === "story" ? "可结算" : "可挑战") : "尚未解锁";
      const badge = stage.type === "boss" ? "🦅" : stage.type === "elite" ? "◆" : stage.type === "story" ? "☯" : index + 1;
      return `<button class="stage-card ${state} ${selected ? "selected" : ""}" data-action="select-stage" data-stage-id="${stage.id}" ${unlocked ? "" : 'aria-disabled="true"'}><span class="stage-number">${badge}</span><span class="stage-card-copy"><b>${stage.id} · ${stage.title}</b><small>${stageTypeLabel(stage)} · ${status} · 推荐剑意 ${stage.recommendedPower}</small></span><span class="stage-state">${cleared ? "✓" : unlocked ? "✦" : "🔒"}</span></button>`;
    }).join("");
    if (!active) { brief.innerHTML = "<b>第一章试炼尚未配置</b>"; startButton.disabled = true; return; }
    const cleared = Boolean(P.chapterProgress.cleared[active.id]), reward = cleared ? active.repeat : active.firstClear;
    const battleText = active.type === "story" ? "完成章节结算" : active.type === "elite" || active.type === "boss" ? `${active.waves} 波妖潮后迎战首领` : `${active.waves} 波妖潮`;
    brief.innerHTML = `<div class="stage-brief-top"><span>${active.id}</span><b>${active.title}</b><em>${cleared ? "重复挑战" : "首通奖励"}</em></div><p>「${active.intro.speaker}」${active.intro.text}</p><small>${stageTypeLabel(active)} · 推荐剑意 ${active.recommendedPower} · ${battleText}</small><div class="stage-reward">${rewardSummary(reward)}</div>`;
    startButton.disabled = false; startButton.innerHTML = `✦ ${active.type === "story" ? "完成" : "进入"} ${active.id} · ${active.title}<small>${cleared ? "重复奖励：" : "首通奖励："}${rewardSummary(reward)}</small>`;
  }
  function selectStage(id) {
    const stage = stageById(id);
    if (!stage || !isStageUnlocked(stage)) {
      toast(stage?.lockedReason || "此关尚未解锁");
      return;
    }
    selectedStageId = stage.id;
    P.chapterProgress.currentStage = stage.id;
    save();
    renderChapterMap();
  }

  function renderGearSlots() {
    const target = $("gearSlots"); if (!target) return;
    const labels = { bracer: "护腕", robe: "法衣", jade: "玉佩", talisman: "镇符" };
    target.innerHTML = ["bracer", "robe", "jade", "talisman"].map((slot) => { const gear = gearInSlot(slot); return gear ? `<button class="gear-slot equipped" data-action="unequip-gear" data-slot="${slot}" title="点击卸下">${gear.icon}<small>${labels[slot]} · ${gear.name}</small><em>卸下</em></button>` : `<div class="gear-slot empty-gear">＋<small>${labels[slot]} · 未穿戴</small></div>`; }).join("");
  }
  function gearStatLabel(gear) {
    if (!gear) return "法器属性已生效";
    if (gear.stats.damage) return `飞剑伤害 +${gear.stats.damage}`;
    if (gear.stats.wallHp) return `护阵上限 +${gear.stats.wallHp}`;
    return `仙石结算 +${Math.round(gear.stats.goldBonus * 100)}%`;
  }
  function renderEquipmentGuide() {
    const target = $("equipmentGuide");
    if (!target) return;
    const tutorial = P.equipmentTutorial;
    if (!tutorial.firstGearReceived || tutorial.firstGearEquipped) {
      target.hidden = true;
      target.innerHTML = "";
      return;
    }
    const gear = P.ownedGear.map(gearById).find(Boolean);
    const gearLine = gear
      ? `<small>已获 ${gear.icon}「${gear.name}」· ${gearStatLabel(gear)}</small>`
      : "";
    target.hidden = false;
    target.innerHTML = `<div class="equipment-guide-seal">叶</div><div class="equipment-guide-copy"><b>叶轻舟 · 残器指引</b><p>荒原残器尚有灵性。此物可助你御剑，莫让它埋在妖尘里。</p>${gearLine}</div><button class="equipment-guide-btn" data-nav="equip">前往法宝</button>`;
  }
  function renderGearInventory() {
    const target = $("gearInventory");
    if (!target) return;
    const owned = P.ownedGear.map(gearById).filter(Boolean);
    target.innerHTML = owned.length
      ? owned
          .map((gear) => {
            const equipped = gearInSlot(gear.slot)?.id === gear.id;
            const stats = gearStatLabel(gear);
            return `<article class="gear-card ${equipped ? "equipped" : ""}"><i>${gear.icon}</i><div><b>${gear.name}</b><small>${gear.rarity} · ${stats}</small><p>${gear.description}</p></div><button class="small-btn" data-action="${equipped ? "unequip-gear" : "equip-gear"}" data-${equipped ? "slot" : "gear-id"}="${equipped ? gear.slot : gear.id}">${equipped ? "卸下" : "穿戴"}</button></article>`;
          })
          .join("")
      : '<div class="gear-empty">尚未获得法器。首通 1-02 可获得荒原护腕。</div>';
  }

  function profile() {
    const stats = equipmentStats(); document.querySelectorAll(".gold-value").forEach((x) => (x.textContent = fmt(P.gold)));
    $("goldTop").textContent = fmt(P.gold); $("gourdTop").textContent = P.gourds; $("gourdPet").textContent = P.gourds; $("gourdCatchCount").textContent = P.gourds;
    $("damageValue").textContent = effectiveWeaponDamage(); $("baseDamageValue").textContent = P.weaponDamage; $("wallMaxValue").textContent = effectiveWallMaxHp(); $("goldBonusValue").textContent = `+${Math.round(stats.goldBonus * 100)}%`;
    $("swordIronValue").textContent = P.materials.swordIron; $("attackInterval").textContent = ATTACK_INTERVAL.toFixed(2); $("magnetRange").textContent = MAGNET_RANGE; $("weaponName").textContent = `青霄飞剑 +${P.weaponLevel}`; $("powerValue").textContent = currentPower(); $("upgradeCost").textContent = 300 + P.weaponLevel * 180;
    renderGearSlots(); renderGearInventory(); renderEquipmentGuide();
    const bag = $("bag"); bag.innerHTML = ""; const items = [...P.equipment.filter((x) => !Object.values(globalThis.P1_CONFIG?.gear || {}).some((gear) => x === `${gear.icon} ${gear.name}`)).map((x) => ({ i: x.split(" ")[0], n: x.split(" ")[1] })), ...Array(8).fill(null)];
    items.slice(0, 10).forEach((x) => { const d = document.createElement("div"); d.className = x ? "" : "empty"; d.innerHTML = x ? `${x.i}<span>${x.n}</span>` : "+"; bag.appendChild(d); });
    const pet = activePetConfig(), has = Boolean(pet); $("petFace").textContent = has ? pet.icon : "✦"; $("formationPet").textContent = has ? pet.icon : "✦";
    $("formationState").textContent = has ? `已出战 ${pet.name} · Lv.${activePetLevel()}` : "未结契灵宠 · 初始一柄飞剑";
    $("petState").innerHTML = has ? `<b>已出战：${pet.name} · Lv.${activePetLevel()}</b><br>${pet.description}` : "<b>尚未缔结灵宠</b><br>于寻木青雀虚弱时祭出结契符。";
    $("petDesc").textContent = has ? `主动技能「${pet.activeSkill.name}」：${pet.activeSkill.description}` : "完成 1-09 的首次结契引导后，寻木青雀可实际协战。";
    $("petLevel").textContent = has ? `Lv.${activePetLevel()} / ${pet.levelCap}` : "未结契"; $("petFeather").textContent = P.materials.qingqueFeather; $("petSkillInfo").textContent = has ? `${pet.activeSkill.name} · 灵伤 ${activePetSkillDamage()} · 冷却 ${activePetSkillCooldown().toFixed(1)} 秒` : "尚未开放协战技能";
    const upgradeButton = $("petUpgrade"); upgradeButton.disabled = !has || activePetLevel() >= pet.levelCap || P.gold < pet.upgrade.gold || P.materials.qingqueFeather < pet.upgrade.feather;
    renderChapterMap(); updatePetSkillButton();
  }
  function open(n) {
    document
      .querySelectorAll(".screen")
      .forEach((e) => e.classList.remove("active"));
    $(n).classList.add("active");
    document
      .querySelectorAll(".tab")
      .forEach((e) => e.classList.toggle("active", e.dataset.nav === n));
    if (n !== "battle") profile();
  }
  function msg(a, b = "", stay = false) {
    let e = $("battleMsg");
    e.innerHTML = `${a}${b ? `<small>${b}</small>` : ""}`;
    e.classList.add("show");
    e.classList.toggle("permanent", stay);
    if (!stay) setTimeout(() => e.classList.remove("show"), 1300);
  }
  function size() {
    canvas = $("canvas");
    ctx = canvas.getContext("2d");
    let r = canvas.getBoundingClientRect(),
      d = devicePixelRatio || 1;
    canvas.width = Math.round(r.width * d);
    canvas.height = Math.round(r.height * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    bindInput();
  }
  function cs() {
    return {
      w: canvas.width / (devicePixelRatio || 1),
      h: canvas.height / (devicePixelRatio || 1),
    };
  }
  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }
  function playerBounds() {
    let c = cs();
    return {
      minX: 38,
      maxX: c.w - 38,
      minY: Math.max(170, c.h * 0.54),
      maxY: c.h - 188,
    };
  }
  function resetPlayer() {
    let c = cs(),
      b = playerBounds();
    B.player.x = B.player.targetX = clamp(c.w / 2, b.minX, b.maxX);
    B.player.y = B.player.targetY = clamp(c.h - 230, b.minY, b.maxY);
    B.player.dragging = false;
    keys.clear();
  }
  function setPlayerTarget(x, y) {
    let b = playerBounds();
    B.player.targetX = clamp(x, b.minX, b.maxX);
    B.player.targetY = clamp(y, b.minY, b.maxY);
  }
  function pointerTarget(e) {
    if (!B.running || B.paused) return;
    let r = canvas.getBoundingClientRect(),
      c = cs();
    setPlayerTarget(
      ((e.clientX - r.left) / r.width) * c.w,
      ((e.clientY - r.top) / r.height) * c.h,
    );
  }
  function bindInput() {
    if (canvas.dataset.inputBound) return;
    canvas.dataset.inputBound = "1";
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", (e) => {
      B.player.dragging = true;
      pointerTarget(e);
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (B.player.dragging) pointerTarget(e);
    });
    canvas.addEventListener("pointerup", () => (B.player.dragging = false));
    canvas.addEventListener("pointercancel", () => (B.player.dragging = false));
  }
  function wall() {
    let p = Math.max(0, (B.hp / B.maxHp) * 100);
    $("wallHpText").textContent = `${Math.ceil(B.hp)} / ${B.maxHp}`;
    $("wallHpBar").style.width = p + "%";
  }

  function bossHud() {
    if (!B.boss) return;
    const p = Math.max(0, (B.boss.hp / B.boss.maxHp) * 100);
    $("bossHpText").textContent = `${Math.max(0, Math.ceil(B.boss.hp))} / ${B.boss.maxHp}`;
    $("bossHpBar").style.width = p + "%";
    $("bossName").textContent = B.boss.enraged ? `狂暴 · ${B.boss.name}` : `守关首领 · ${B.boss.name}`;
  }
  function equipGear(id) {
    const gear = gearById(id);
    if (!gear || !P.ownedGear.includes(id)) {
      toast("尚未获得这件法器");
      return false;
    }
    P.equippedGear[gear.slot] = gear.id;
    const firstEquip = !P.equipmentTutorial.firstGearEquipped;
    if (firstEquip) P.equipmentTutorial.firstGearEquipped = true;
    save();
    profile();
    toast(
      firstEquip
        ? `叶轻舟：灵纹已合。${gearStatLabel(gear)}，往后的妖潮便多一分胜算。`
        : `已穿戴「${gear.name}」`,
    );
    return true;
  }
  function unequipGear(slot) {
    const gear = gearInSlot(slot);
    if (!gear) {
      toast("该栏位当前未穿戴法器");
      return false;
    }
    P.equippedGear[slot] = null;
    save();
    profile();
    toast(`已卸下「${gear.name}」`);
    return true;
  }

  function start(stageId = selectedStageId) {
    const stage = stageById(stageId);
    if (!stage || !isStageUnlocked(stage)) { toast("此关尚未解锁"); return; }
    B.stage = stage; B.isNormalStage = stage.type === "normal"; B.running = false; B.paused = false; B.last = performance.now(); B.fire = 0.6; B.spawn = 0; B.wave = 0; B.queue = []; B.enemies = []; B.swords = []; B.drops = [];
    B.maxHp = effectiveWallMaxHp(); B.hp = B.maxHp; B.gold = 0; B.damage = 0; B.boss = null; B.bossCreated = false; B.catchShown = false; B.catchDone = false; B.finished = false; B.pendingFinish = false; B.outcome = ""; B.petSkillCooldown = 0; B.eliteSummon = 0;
    if (stage.type === "story") { B.outcome = "第一章结算"; finish(true); return; }
    B.running = true; $("battleTitle").textContent = `第一章 · ${stage.title}`; $("bossHud").classList.remove("show"); $("catchPanel").classList.remove("show"); $("runGold").textContent = 0;
    wall(); open("battle"); size(); resetPlayer(); wave(1); msg(`踏入 ${stage.title}`, `「${stage.intro.speaker}」${stage.intro.text}`); requestAnimationFrame(loop);
  }
  function wave(n) {
    B.wave = n;
    const stage = B.stage || { waves: 3, enemyTier: 0, type: "normal" }; const index = Math.max(0, chapterStages().findIndex((item) => item.id === stage.id)); const tier = Number(stage.enemyTier) || Math.max(0, index);
    const labels = ["妖气初现", "残阵震荡", "剑痕守望", "妖潮压境", "阵眼震颤"], names = ["污化狼妖", "裂隙妖灵", "荒原妖兵", "噬魂妖灵"];
    $("waveText").textContent = `第 ${n} / ${stage.waves || 3} 波 · ${labels[Math.min(n - 1, labels.length - 1)]}`;
    const count = 5 + n + Math.floor(tier / 2);
    B.queue = Array.from({ length: count }, (_, i) => { const hp = 28 + tier * 7 + n * 7 + (i % 3) * 4; return { name: names[(i + n + tier) % names.length], hp, maxHp: hp, speed: 10 + tier * 0.9 + n * 0.65, r: 30 + (i % 2) * 3 + Math.min(7, Math.floor(tier / 2)), value: 5 + tier + n, boss: false }; });
    B.spawn = 0.42;
  }
  function makeEnemy(x) {
    let c = cs();
    B.enemies.push({
      ...x,
      x: 44 + Math.random() * (c.w - 88),
      y: -45,
      hit: 0,
      slow: 0,
    });
  }

  function spawnBoss() {
    const c = cs(), config = B.stage?.boss || { name: "寻木青雀", hp: 320, speed: 13, r: 44, value: 28, kind: "chapter" };
    B.boss = { name: config.name, hp: config.hp, maxHp: config.hp, speed: config.speed, r: config.r, x: c.w / 2, y: -68, hit: 0, slow: 0, boss: true, enraged: false, value: config.value, kind: config.kind };
    B.enemies.push(B.boss); B.bossCreated = true; B.eliteSummon = config.kind === "elite" ? 1.6 : 0; $("bossHud").classList.add("show"); bossHud(); $("waveText").textContent = `首领来袭 · ${config.name}`;
    msg("守关首领现身", B.stage?.capture ? `血量低于 ${Math.round(B.stage.capture.threshold * 100)}% 可结契` : "击破首领，稳住荒原阵路");
  }
  function shoot() {
    let a = B.enemies.filter((e) => e.hp > 0);
    if (!a.length) return;
    let t = a.sort((a, b) => b.y - a.y)[0],
      c = cs();
    B.swords.push({
      x: B.player.x,
      y: B.player.y - 22,
      target: t,
      damage: effectiveWeaponDamage(),
      speed: 390,
      life: 1.5,
    });
  }
  function drop(x, y, type, val) {
    B.drops.push({ x, y, type, val, spin: Math.random() * 6.2 });
  }
  function kill(e) {
    let i = B.enemies.indexOf(e);
    if (i >= 0) B.enemies.splice(i, 1);
    let n = e.boss ? (e.enraged ? 4 : 3) : 1;
    for (let z = 0; z < n; z++)
      drop(
        e.x + (Math.random() - 0.5) * 22,
        e.y + (Math.random() - 0.5) * 18,
        e.boss && z === 0 ? "equip" : "gold",
        e.boss && z === 0 ? 1 : e.value,
      );
    if (e.boss) {
      $("bossHud").classList.remove("show");
      if (!B.finished) {
        B.outcome = e.enraged ? "狂暴后斩杀" : "斩妖";
        setTimeout(() => finish(true), 1100);
      }
    }
  }

  function isTutorialCapture() { return !P.tutorialCaptureDone && (Boolean(B.stage?.capture?.tutorialFixedSuccess) || !B.stage); }
  function updateCapturePanel() {
    const tutorial = isTutorialCapture();
    $("catchTitle").textContent = tutorial ? "结契引导：首次抓捕必定成功" : "妖气衰竭，可祭镇妖器！";
    $("catchDesc").textContent = tutorial ? "天衍剑宗首训：任选镇妖器即可缔结寻木青雀。本次必须完成结契引导。" : "失败后首领狂暴、回血；击杀狂暴大妖将多掉一件法器。";
    $("catchSealRate").textContent = tutorial ? "必定成功" : "30%"; $("catchGourdRate").textContent = tutorial ? "必定成功" : "65%";
    const decline = document.querySelector('[data-action="decline-catch"]'); if (!decline) return;
    decline.classList.toggle("guide-locked", tutorial); decline.setAttribute("aria-disabled", String(tutorial)); $("declineCatchHint").textContent = tutorial ? "首次引导必须结契" : "不消耗道具";
  }
  function hit(e, d) {
    e.hp -= d;
    e.hit = 0.16;
    B.damage += d;
    if (e.boss) {
      bossHud();
      if (B.stage?.capture && !B.catchShown && !B.catchDone && e.hp / e.maxHp <= B.stage.capture.threshold) {
        B.catchShown = true;
        B.paused = true;
        updateCapturePanel();
        $("catchPanel").classList.add("show");
        msg(
          isTutorialCapture() ? "结契引导" : "首领虚弱",
          isTutorialCapture() ? "首次抓捕必定成功" : "选择抓捕，或继续战斗",
          true,
        );
      }
    }
    if (e.hp <= 0) kill(e);
  }

  function capture(tool) {
    if (!B.running || !B.catchShown || B.catchDone) return;
    const tutorial = isTutorialCapture(), rate = tutorial ? 1 : tool === "gourd" ? 0.65 : 0.3;
    if (tool === "gourd") { if (P.gourds <= 0) { toast("灵葫芦不足，可使用镇妖符"); return; } P.gourds--; }
    B.catchDone = true; $("catchPanel").classList.remove("show");
    if (Math.random() < rate) { grantPet("xunmuQingque"); P.tutorialCaptureDone = true; if (!P.equipment.includes("🪶 青雀灵羽")) P.equipment.push("🪶 青雀灵羽"); B.outcome = "收服寻木青雀"; msg("灵契已成", "寻木青雀归入御兽录"); finish(true); }
    else { B.paused = false; if (B.boss) { B.boss.enraged = true; B.boss.hp = Math.min(B.boss.maxHp, B.boss.hp + B.boss.maxHp * 0.24); B.boss.speed = 22; bossHud(); } save(); profile(); msg("收妖失败！", "大妖狂暴，击杀后额外掉落"); }
  }
  function declineCapture() { if (!B.running || !B.catchShown || B.catchDone) return; if (isTutorialCapture()) { toast("首次试炼请完成结契引导"); return; } B.catchDone = true; B.paused = false; $("catchPanel").classList.remove("show"); msg("暂缓收服", "继续诛灭首领"); }

  function applyStageRewards(win) {
    if (!win || !B.stage) return { gold: 20, items: [["📜", "基础战利品"]], firstClear: false, showEquipmentGuide: false };
    const firstClear = !P.chapterProgress.firstRewards[B.stage.id], reward = firstClear ? B.stage.firstClear : B.stage.repeat, items = [];
    P.chapterProgress.cleared[B.stage.id] = true; if (firstClear) P.chapterProgress.firstRewards[B.stage.id] = true;
    Object.entries(reward.materials || {}).forEach(([id, amount]) => { P.materials[id] = (P.materials[id] || 0) + amount; const material = globalThis.P1_CONFIG?.materials?.[id]; if (material) items.push([material.icon, `${material.name} ×${amount}`]); });
    let showEquipmentGuide = false;
    if (reward.gear) { const gear = gearById(reward.gear); if (gear && !P.ownedGear.includes(gear.id)) { P.ownedGear.push(gear.id); P.equipment.push(`${gear.icon} ${gear.name}`); if (!P.equipmentTutorial.firstGearReceived) { P.equipmentTutorial.firstGearReceived = true; showEquipmentGuide = true; } } if (gear) items.push([gear.icon, gear.name]); }
    if (reward.pet) { const pet = petById(reward.pet); if (pet) { grantPet(pet.id); items.push([pet.icon, `结契 ${pet.name}`]); } }
    if (B.stage.type === "story") P.chapterProgress.chapterCompleted = true;
    const stages = chapterStages(), next = stages[stages.findIndex((stage) => stage.id === B.stage.id) + 1]; P.chapterProgress.currentStage = next?.id || B.stage.id; selectedStageId = P.chapterProgress.currentStage;
    return { gold: reward.gold || 0, items, firstClear, showEquipmentGuide };
  }
  function applyNormalStageRewards(win) { return applyStageRewards(win); }
  function finish(win) {
    if (B.finished) return; B.finished = true; B.running = false; $("catchPanel").classList.remove("show");
    const stageRewards = B.stage ? applyStageRewards(win) : null; const baseEarned = B.gold + (stageRewards ? stageRewards.gold : win ? 80 : 20) + (win && B.outcome === "狂暴后斩杀" ? 40 : 0); const earned = applyGoldBonus(baseEarned); P.gold += earned; P.cleared = win || P.cleared; save();
    const successTitle = B.outcome === "收服寻木青雀" ? "结契功成" : B.stage?.type === "story" ? "第一章告一段落" : B.stage?.type === "elite" ? "精英试炼告捷" : "守阵告捷";
    $("resultTitle").textContent = win ? successTitle : "护阵受损";
    $("resultSub").textContent = win ? (stageRewards?.showEquipmentGuide ? "「叶轻舟」荒原残器尚有灵性。去法宝页穿戴它，让剑意真正归于你手。" : B.stage?.outro ? `「${B.stage.outro.speaker}」${B.stage.outro.text}` : "万剑归鞘，荒原妖气暂息。") : "本次已自动拾取的基础战利品将带回洞府。";
    $("resultWall").textContent = Math.max(0, Math.ceil((B.hp / B.maxHp) * 100)) + "%"; $("resultDamage").textContent = fmt(B.damage); $("resultBoss").textContent = win ? B.outcome || (B.stage?.type === "story" ? "章节结算完成" : "妖潮已退") : "妖潮突破";
    const rewards = [["🪙", `仙石 +${earned}`], ...(stageRewards?.items?.length ? stageRewards.items : win ? [["📜", "试炼完成"]] : [["📜", "基础战利品"]]), ...(stageRewards ? [["✦", stageRewards.firstClear ? "首通记录已写入" : "重复试炼记录"]] : [])];
    $("rewards").innerHTML = rewards.map((item) => `<div class="reward"><i>${item[0]}</i>${item[1]}</div>`).join(""); open("result");
  }
  function updatePetSkillButton() {
    const button = $("petSkill"), pet = activePetConfig(); if (!button) return; const visible = Boolean(pet && B.running); button.hidden = !visible; if (!visible) return;
    button.disabled = B.paused || B.petSkillCooldown > 0; button.textContent = B.petSkillCooldown > 0 ? `${pet.activeSkill.name} ${B.petSkillCooldown.toFixed(1)}s` : `✦ ${pet.activeSkill.name}`;
  }
  function usePetSkill() {
    const pet = activePetConfig(); if (!B.running || B.paused || !pet || B.petSkillCooldown > 0) return;
    const target = B.enemies.filter((e) => e.hp > 0).sort((a, b) => b.y - a.y)[0]; if (!target) { toast("暂无可协战的妖物"); return; }
    const damage = activePetSkillDamage(); B.enemies.slice().forEach((enemy) => { if (Math.hypot(enemy.x - target.x, enemy.y - target.y) <= 105) { enemy.slow = Math.max(enemy.slow || 0, pet.activeSkill.slow); hit(enemy, damage); } });
    B.petSkillCooldown = activePetSkillCooldown(); msg("青翎回风", `${pet.name} 掠阵，周遭妖物已被迟缓`); updatePetSkillButton();
  }
  function upgradePet() {
    const pet = activePetConfig(); if (!pet) { toast("尚未结契可培养的御兽"); return false; }
    const level = activePetLevel(); if (level >= pet.levelCap) { toast("寻木青雀已达当前培养上限"); return false; }
    if (P.gold < pet.upgrade.gold || P.materials.qingqueFeather < pet.upgrade.feather) { toast("仙石或青雀灵羽不足"); return false; }
    P.gold -= pet.upgrade.gold; P.materials.qingqueFeather -= pet.upgrade.feather; P.petProgress[pet.id].level = level + 1; save(); profile(); toast(`${pet.name} 升至 Lv.${level + 1}，协战更强`); return true;
  }
  function update(dt) {
    if (!B.running || B.paused) return;
    let c = cs(),
      b = playerBounds(),
      x =
        (keys.has("arrowright") || keys.has("d") ? 1 : 0) -
        (keys.has("arrowleft") || keys.has("a") ? 1 : 0),
      y =
        (keys.has("arrowdown") || keys.has("s") ? 1 : 0) -
        (keys.has("arrowup") || keys.has("w") ? 1 : 0);
    if (x || y) {
      let l = Math.hypot(x, y);
      B.player.x = clamp(B.player.x + (x / l) * 260 * dt, b.minX, b.maxX);
      B.player.y = clamp(B.player.y + (y / l) * 260 * dt, b.minY, b.maxY);
      B.player.targetX = B.player.x;
      B.player.targetY = B.player.y;
    } else {
      let dx = B.player.targetX - B.player.x,
        dy = B.player.targetY - B.player.y,
        d = Math.hypot(dx, dy),
        st = 360 * dt;
      if (d > 1) {
        B.player.x += (dx / d) * Math.min(st, d);
        B.player.y += (dy / d) * Math.min(st, d);
      }
    }
    B.petSkillCooldown = Math.max(0, (B.petSkillCooldown || 0) - dt);
    updatePetSkillButton();
    if (B.eliteSummon > 0 && B.boss && B.enemies.includes(B.boss)) { B.eliteSummon -= dt; if (B.eliteSummon <= 0) { const count = B.stage?.boss?.summonCount || 3; for (let i = 0; i < count; i++) makeEnemy({ name: "碎石妖鼠", hp: 54, maxHp: 54, speed: 12, r: 27, value: 7, boss: false }); msg("石甲震地", "荒原石甲兽唤来碎石妖鼠"); } }
    B.fire -= dt;
    if (B.fire <= 0) {
      shoot();
      B.fire = ATTACK_INTERVAL;
    }
    if (B.queue.length) {
      B.spawn -= dt;
      if (B.spawn <= 0) {
        makeEnemy(B.queue.shift());
        B.spawn = 0.82;
      }

    } else if (!B.enemies.length && !B.bossCreated) {
      const type = B.stage?.type || (B.isNormalStage ? "normal" : "boss"), waves = B.stage?.waves || 3;
      if (B.wave < waves) { B.bossCreated = true; setTimeout(() => { B.bossCreated = false; wave(B.wave + 1); }, 280); }
      else if (type === "normal") { if (!B.pendingFinish) { B.pendingFinish = true; B.outcome = "妖潮已退"; setTimeout(() => finish(true), 620); } }
      else spawnBoss();
    }
    B.enemies.slice().forEach((e) => {
      e.hit = Math.max(0, e.hit - dt);
      e.y += e.speed * dt * (e.slow > 0 ? 0.7 : 1);
      e.slow = Math.max(0, e.slow - dt);
      if (e.y > c.h - 145) {
        let k = B.enemies.indexOf(e);
        if (k >= 0) B.enemies.splice(k, 1);
        B.hp -= e.boss ? 220 : 75;
        wall();
        msg("妖物冲阵！", `护阵 -${e.boss ? 220 : 75}`);

        if (e.boss) { B.boss = null; $("bossHud").classList.remove("show"); finish(false); return; }
        if (B.hp <= 0) finish(false);
      }
    });
    B.swords.slice().forEach((s) => {
      s.life -= dt;
      if (!s.target || !B.enemies.includes(s.target)) {
        B.swords.splice(B.swords.indexOf(s), 1);
        return;
      }
      let dx = s.target.x - s.x,
        dy = s.target.y - s.y,
        d = Math.hypot(dx, dy) || 1,
        st = s.speed * dt;
      if (d < st + 10) {
        hit(s.target, s.damage);
        B.swords.splice(B.swords.indexOf(s), 1);
      } else {
        s.x += (dx / d) * st;
        s.y += (dy / d) * st;
      }
    });
    B.drops.slice().forEach((d) => {
      let hx = B.player.x,
        hy = B.player.y - 8,
        dx = hx - d.x,
        dy = hy - d.y,
        dis = Math.hypot(dx, dy);
      if (dis < MAGNET_RANGE) {
        d.x += dx * Math.min(1, dt * MAGNET_SPEED);
        d.y += dy * Math.min(1, dt * MAGNET_SPEED);
        if (dis < MAGNET_COLLECT_DISTANCE) {
          if (d.type === "gold") B.gold += d.val;
          else if (!P.equipment.includes("🛡️ 幽冥战甲"))
            P.equipment.push("🛡️ 幽冥战甲");
          B.drops.splice(B.drops.indexOf(d), 1);
          $("runGold").textContent = fmt(B.gold);
        }
      }
      d.spin += dt * 4;
    });
  }
  function draw() {
    if (!ctx) return;
    let { w, h } = cs();
    ctx.clearRect(0, 0, w, h);
    let g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#365a65");
    g.addColorStop(0.42, "#749a91");
    g.addColorStop(1, "#d2ad79");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#173f4a99";
    for (let i = 0; i < 6; i++) {
      let x = (i * w) / 5 - 50;
      ctx.beginPath();
      ctx.moveTo(x, 80);
      ctx.lineTo(x + 110, 25 + (i % 2) * 38);
      ctx.lineTo(x + 220, 100);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#e6cea1";
    ctx.fillRect(0, h * 0.36, w, h * 0.64);
    ctx.fillStyle = "#c49e70";
    for (let y = h * 0.42; y < h - 120; y += 52) ctx.fillRect(0, y, w, 2);
    for (let x = 0; x < w; x += 42) ctx.fillRect(x, h * 0.36, 2, h * 0.64);
    ctx.fillStyle = "#1d4a48";
    [
      [0, 180],
      [w, 210],
      [0, h * 0.58],
      [w, h * 0.61],
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + 120);
      ctx.lineTo(x + (x === 0 ? 70 : -70), y);
      ctx.lineTo(x + (x === 0 ? 115 : -115), y + 130);
      ctx.closePath();
      ctx.fill();
    });
    B.drops.forEach((d) => {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.spin);
      ctx.fillStyle = d.type === "equip" ? "#b182df" : "#ffd45b";
      ctx.strokeStyle = "#754c30";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, d.type === "equip" ? 11 : 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff7bd";
      ctx.fillRect(-2, -5, 4, 10);
      ctx.restore();
    });
    let hx = B.player.x,
      hy = B.player.y;
    ctx.strokeStyle = "#79e2b0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(15, h - 91);
    ctx.lineTo(w - 15, h - 91);
    ctx.stroke();
    ctx.fillStyle = "#284a59";
    ctx.fillRect(hx - 38, hy - 3, 76, 37);
    ctx.fillStyle = "#ffe7b0";
    ctx.beginPath();
    ctx.arc(hx, hy - 20, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5b3e88";
    ctx.beginPath();
    ctx.moveTo(hx - 23, hy + 25);
    ctx.lineTo(hx + 23, hy + 25);
    ctx.lineTo(hx + 16, hy - 9);
    ctx.lineTo(hx - 16, hy - 9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff1b4";
    ctx.fillRect(hx - 9, hy - 22, 18, 4);
    B.enemies.forEach((e) => {
      ctx.save();
      ctx.translate(e.x, e.y);
      let r = e.r;
      ctx.fillStyle = e.boss ? (e.enraged ? "#db5b52" : "#3f907a") : "#66806e";
      ctx.strokeStyle = e.boss ? "#5a2730" : "#263d3a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f2dfa0";
      ctx.beginPath();
      ctx.arc(-r * 0.3, -3, 4, 0, Math.PI * 2);
      ctx.arc(r * 0.3, -3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#342231";
      ctx.fillRect(-r * 0.38, r * 0.25, r * 0.76, 4);
      if (e.hit > 0) {
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = e.hit * 4;
        ctx.beginPath();
        ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (e.boss) {
        ctx.fillStyle = "#fff3c0";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(e.enraged ? `狂暴 · ${e.name}` : e.name, 0, -r - 11);
        ctx.fillStyle = "#3b2d2f";
        ctx.fillRect(-r, r + 9, r * 2, 5);
        ctx.fillStyle = "#ed6354";
        ctx.fillRect(-r, r + 9, r * 2 * Math.max(0, e.hp / e.maxHp), 5);
      }
      ctx.restore();
    });
    B.swords.forEach((s) => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(Math.atan2(s.target.y - s.y, s.target.x - s.x) + Math.PI / 2);
      ctx.fillStyle = "#fff3a4";
      ctx.strokeStyle = "#b77631";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(4, 10);
      ctx.lineTo(0, 15);
      ctx.lineTo(-4, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  }
  function loop(t) {
    if (!B.running) return;
    let dt = Math.min(0.04, (t - B.last) / 1000 || 0);
    B.last = t;
    update(dt);
    draw();
    if (B.running) requestAnimationFrame(loop);
  }
  function upgrade() {
    let cost = 300 + P.weaponLevel * 180;
    if (P.gold < cost) {
      toast("仙石不足，完成试炼可获得更多仙石");
      return;
    }
    P.gold -= cost;
    P.weaponLevel++;
    P.weaponDamage += 3;
    save();
    profile();
    toast("本命飞剑已祭炼，伤害 +3");
  }
  window.addEventListener("keydown", (e) => {
    let k = e.key.toLowerCase();
    if (
      [
        "arrowleft",
        "arrowright",
        "arrowup",
        "arrowdown",
        "a",
        "d",
        "w",
        "s",
      ].includes(k) &&
      $("battle").classList.contains("active")
    ) {
      keys.add(k);
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener("blur", () => keys.clear());
  document.addEventListener("click", (e) => {
    let b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.nav) {
      open(b.dataset.nav);
      return;
    }
    let a = b.dataset.action;
    if (a === "start") start(selectedStageId);
    if (a === "select-stage") selectStage(b.dataset.stageId);
    if (a === "toast") toast(b.dataset.text);
    if (a === "upgrade") upgrade();
    if (a === "upgrade-pet") upgradePet();
    if (a === "pet-skill") usePetSkill();
    if (a === "equip-gear") equipGear(b.dataset.gearId);
    if (a === "unequip-gear") unequipGear(b.dataset.slot);
    if (a === "pause") {
      B.paused = !B.paused;
      b.textContent = B.paused ? "▶" : "Ⅱ";
      if (B.paused) msg("试炼暂停", "点击右上角继续", true);
      else $("battleMsg").classList.remove("show");
    }
    if (a === "catch") capture(b.dataset.tool);
    if (a === "decline-catch") declineCapture();
    if (a === "hint") toast(b.textContent.replace(/\s+/g, " ").trim());
    if (a === "back-home") open("home");
  });
  window.addEventListener("resize", () => {
    $("battle").classList.contains("active") && size();
  });
  window.addEventListener("DOMContentLoaded", profile);
})();
