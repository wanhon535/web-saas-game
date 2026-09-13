(() => {
  const KEY = "wanjian_fengyao_p0_v3",

P1_DEFAULT = {
      schemaVersion: 6,
      chapterProgress: { currentStage: "1-01", cleared: {}, firstRewards: {}, chapterCompleted: false, chapterCompletion: { "1": false, "2": false } },
      materials: { swordIron: 0, spiritSand: 0, pactCharm: 0, qingqueFeather: 0, woodEssence: 0, vineCore: 0 },
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
    const chapterCompletion = { "1": Boolean(c.chapterCompletion?.["1"] || c.chapterCompleted), "2": Boolean(c.chapterCompletion?.["2"]) };
    P.schemaVersion = 6;
    P.chapterProgress = { currentStage: typeof c.currentStage === "string" ? c.currentStage : "1-01", cleared: { ...(c.cleared || {}) }, firstRewards: { ...(c.firstRewards || {}) }, chapterCompleted: chapterCompletion["1"], chapterCompletion };
    P.materials = { swordIron: number(m.swordIron), spiritSand: number(m.spiritSand), pactCharm: number(m.pactCharm), qingqueFeather: number(m.qingqueFeather), woodEssence: number(m.woodEssence), vineCore: number(m.vineCore) };
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
    MAGNET_SPEED = 9,
    PLAYER_MAX_HP = 260,
    WALL_REPAIR_DELAY = 2.4,
    WALL_REPAIR_PER_SECOND = 20,
    WALL_RECONSTRUCT_DELAY = 5,
    WALL_RECONSTRUCT_PER_SECOND = 160,
    REVIVE_HP_RATIO = 0.5;
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
    hostileShots: [],
    hp: 1200,
    maxHp: 1200,
    wallBroken: false,
    wallQuietFor: 0,
    wallUnderAttack: false,
    freeReviveUsed: false,
    paidReviveCount: 0,
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
    player: { x: 0, y: 0, targetX: 0, targetY: 0, dragging: false, hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP, dead: false, hit: 0 },
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
  function stageChapter(stage) {
    return Number(stage?.chapter || String(stage?.id || "1-01").split("-")[0]) || 1;
  }
  function chapterConfig(stage) {
    const chapter = stageChapter(stage);
    return globalThis.P1_CONFIG?.chapters?.[chapter] || { id: chapter, name: `第${chapter}章`, eyebrow: `第${chapter}章`, tagline: "天衍剑宗，万剑封妖", bossName: "守关大妖", bossIcon: "☯", drawerNote: "选择已解锁关卡后进入试炼。" };
  }
  function stagesForChapter(chapter) {
    return chapterStages().filter((stage) => stageChapter(stage) === Number(chapter));
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
    if (reward.gold) lines.push(`🪙 ${reward.gold} 灵石`);
    Object.entries(reward.materials || {}).forEach(([id, amount]) => { const material = globalThis.P1_CONFIG?.materials?.[id]; if (material && amount) lines.push(`${material.icon} ${material.name} ×${amount}`); });
    if (reward.gear) { const gear = gearById(reward.gear); if (gear) lines.push(`${gear.icon} ${gear.name}`); }
    if (reward.pet) { const pet = petById(reward.pet); if (pet) lines.push(`${pet.icon} ${pet.name}`); }
    return lines.join(" · ") || "暂无额外奖励";
  }
  function stageTypeLabel(stage) { return { normal: "普通试炼", elite: "精英试炼", boss: "章节 Boss", story: "章节结算" }[stage.type] || "试炼"; }
  function toggleChapterDrawer(show) {
    const drawer = $("chapterDrawer"), toggle = $("chapterDrawerToggle");
    if (!drawer) return;
    const shouldOpen = typeof show === "boolean" ? show : drawer.hidden;
    drawer.hidden = !shouldOpen;
    document.body.classList.toggle("chapter-drawer-open", shouldOpen);
    if (toggle) toggle.setAttribute("aria-expanded", String(shouldOpen));
  }
  function toggleHomePromos(show) {
    const panel = $("homePromoPanel"), toggle = $("homePromoToggle");
    if (!panel) return;
    const shouldOpen = typeof show === "boolean" ? show : panel.hidden;
    panel.hidden = !shouldOpen;
    if (toggle) { toggle.setAttribute("aria-expanded", String(shouldOpen)); toggle.classList.toggle("is-open", shouldOpen); }
  }
  function openHomePlaceholder(title, icon = "✦") {
    const panel = $("homePlaceholderPanel");
    if (!panel) return;
    $("homePlaceholderTitle").textContent = title || "功能筹备中";
    $("homePlaceholderIcon").textContent = icon || "✦";
    $("homePlaceholderText").textContent = `「${title || "该功能"}」暂未开放，后续版本将补充完整内容。`;
    panel.hidden = false;
  }
  function closeHomePlaceholder() {
    const panel = $("homePlaceholderPanel");
    if (panel) panel.hidden = true;
  }

  function renderChapterPresentation(stage) {
    const chapter = chapterConfig(stage), chapterNumber = stageChapter(stage);
    const set = (id, value) => { const node = $(id); if (node) node.textContent = value; };
    set("chapterEyebrow", chapter.eyebrow);
    set("chapterTitle", chapter.name.split("").join(" "));
    set("chapterTagline", chapter.tagline);
    set("chapterBossIcon", chapter.bossIcon);
    set("chapterBossLabel", `章节 Boss · ${chapter.bossName}`);
    set("chapterBossHint", chapterNumber === 1 ? "完成 1-08 后开放首次结契" : "斩灭妖核，夺回封印碎片");
    set("chapterProgressLabel", `第${chapterNumber}章进度`);
    set("chapterDrawerEyebrow", `天衍剑宗 · ${chapter.name}`);
    set("chapterDrawerNote", chapter.drawerNote);
    const map = $("stageMap"); if (map) map.setAttribute("aria-label", `第${chapterNumber}章关卡地图`);
    if (document.body?.classList) document.body.classList.toggle("chapter-two-theme", chapterNumber === 2);
  }
  function renderChapterMap() {
    const map = $("stageMap"), brief = $("stageBrief"), startButton = $("stageStart"); if (!map || !brief || !startButton) return;
    const stages = chapterStages(), active = selectedStage();
    renderChapterPresentation(active);
    const chapterIds = [...new Set(stages.map(stageChapter))];
    map.innerHTML = chapterIds.map((chapter) => {
      const chapterStagesList = stagesForChapter(chapter), config = chapterConfig(chapterStagesList[0]);
      const cards = chapterStagesList.map((stage, index) => {
        const cleared = Boolean(P.chapterProgress.cleared[stage.id]), unlocked = isStageUnlocked(stage), selected = active?.id === stage.id, state = cleared ? "cleared" : unlocked ? "open" : "locked";
        const status = cleared ? "已完成" : unlocked ? (stage.type === "story" ? "可结算" : "可挑战") : "尚未解锁";
        const badge = stage.type === "boss" ? config.bossIcon : stage.type === "elite" ? "◆" : stage.type === "story" ? "☯" : index + 1;
        return `<button class="stage-card ${state} ${selected ? "selected" : ""}" data-action="select-stage" data-stage-id="${stage.id}" ${unlocked ? "" : 'aria-disabled="true"'}><span class="stage-number">${badge}</span><span class="stage-card-copy"><b>${stage.id} · ${stage.title}</b><small>${stageTypeLabel(stage)} · ${status}</small></span><span class="stage-state">${cleared ? "✓" : unlocked ? "✦" : "🔒"}</span></button>`;
      }).join("");
      const locked = !chapterStagesList.some(isStageUnlocked);
      return `<section class="stage-chapter-group ${locked ? "chapter-locked" : ""}"><header><b>第${chapter}章 · ${config.name}</b><small>${locked ? "完成前章后开启" : config.tagline}</small></header>${cards}</section>`;
    }).join("");
    const progressText = $("chapterProgressText");
    if (progressText && active) {
      const currentStages = stagesForChapter(stageChapter(active));
      progressText.textContent = `${currentStages.filter((stage) => P.chapterProgress.cleared[stage.id]).length} / ${currentStages.length}`;
    }
    if (!active) { brief.innerHTML = "<b>章节试炼尚未配置</b>"; startButton.disabled = true; return; }
    const cleared = Boolean(P.chapterProgress.cleared[active.id]), reward = cleared ? active.repeat : active.firstClear, chapter = chapterConfig(active);
    const objective = active.type === "story" ? `完成${chapter.name}结算，整理本章战果` : active.type === "boss" ? `击败 ${active.boss?.name || "守关首领"}，夺回封印碎片` : active.type === "elite" ? `清剿妖潮后，击败 ${active.boss?.name || "精英首领"}` : `守住护宗大阵，清剿 ${active.waves} 波妖潮`;
    brief.innerHTML = `<div class="stage-brief-top"><span>${active.id}</span><b>${active.title}</b><em>${cleared ? "已完成" : "当前目标"}</em></div><p class="stage-objective">${objective}</p><small>${stageTypeLabel(active)} · 推荐剑意 ${active.recommendedPower}</small><div class="stage-reward"><b>${cleared ? "重复所得" : "首通所得"}</b><span>${rewardSummary(reward)}</span></div>`;
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
    toggleChapterDrawer(false);
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
    return `灵石结算 +${Math.round(gear.stats.goldBonus * 100)}%`;
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
    const stats = equipmentStats(); const setText = (id, value) => { const node = $(id); if (node) node.textContent = value; }; document.querySelectorAll(".gold-value").forEach((x) => (x.textContent = fmt(P.gold)));
    setText("goldTop", fmt(P.gold)); setText("jadeTop", "0"); setText("gourdTop", P.gourds); setText("gourdPet", P.gourds); setText("gourdCatchCount", P.gourds); setText("homePowerValue", currentPower());
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
  function returnHomeFromRift() {
    toggleChapterDrawer(false);
    open("home");
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
    B.player.maxHp = PLAYER_MAX_HP;
    B.player.hp = PLAYER_MAX_HP;
    B.player.dead = false;
    B.player.hit = 0;
    keys.clear();
    playerHud();
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
    const p = Math.max(0, (B.hp / B.maxHp) * 100);
    $("wallHpText").textContent = `${Math.ceil(B.hp)} / ${B.maxHp}`;
    $("wallHpBar").style.width = p + "%";
    const state = $("wallState"), hud = $("wallHud");
    const reconstructing = B.hp <= 0;
    const repairDelay = reconstructing ? WALL_RECONSTRUCT_DELAY : WALL_REPAIR_DELAY;
    const repairing = !B.wallUnderAttack && B.hp < B.maxHp && B.wallQuietFor >= repairDelay;
    if (state) {
      state.textContent = reconstructing
        ? (B.wallUnderAttack ? "护阵已破 · 敌方持续压阵" : repairing ? "护阵已破 · 阵纹快速重构中" : "护阵已破 · " + Math.ceil(Math.max(0, WALL_RECONSTRUCT_DELAY - B.wallQuietFor)) + " 秒后重构")
        : B.wallUnderAttack ? "护阵受袭" : repairing ? "阵纹缓慢自修复中" : "护阵运转正常";
    }
    hud?.classList?.toggle("is-broken", reconstructing);
    hud?.classList?.remove?.("is-compromised");
  }
  function playerHud() {
    const p = Math.max(0, (B.player.hp / B.player.maxHp) * 100);
    $("playerHpText").textContent = `${Math.ceil(B.player.hp)} / ${B.player.maxHp}`;
    $("playerHpBar").style.width = p + "%";
    const state = $("playerState"), hud = $("playerHud");
    if (state) state.textContent = B.player.dead ? (B.hp <= 0 ? "真君战败 · 等待护阵重构" : "真君战败 · 可执行复生") : "御剑守阵";
    hud?.classList?.toggle("is-dead", Boolean(B.player.dead));
  }
  function bothDefensesLost() {
    return Boolean(B.player.dead && B.hp <= 0);
  }
  function canRevive() {
    return Boolean(B.running && !B.finished && B.player.dead && B.hp > 0);
  }
  function reviveHud() {
    const panel = $("revivePanel"), title = $("reviveTitle"), desc = $("reviveDesc"), free = $("freeRevive"), paid = $("paidRevive");
    const show = Boolean(B.running && !B.finished && B.player.dead);
    panel?.classList?.toggle("show", show);
    if (!show) return;
    const available = canRevive();
    if (title) title.textContent = available ? "万剑真君战败" : "护宗大阵已破";
    if (desc) desc.textContent = available ? "护阵尚存，可选择复生后继续守阵。" : "等待护宗大阵停止受袭并完成重构，复生资格将自动恢复。";
    if (free) { free.disabled = !available || B.freeReviveUsed; free.innerHTML = B.freeReviveUsed ? "免费复生<br /><small>本局已使用</small>" : "免费复生<br /><small>本局剩余 1 次</small>"; }
    if (paid) { paid.disabled = !available; paid.innerHTML = "付费复生<br /><small>内测模拟 · 不限次数</small>"; }
  }
  function revivePlayer(mode) {
    if (!canRevive()) { toast("护阵尚未重构，暂时无法复生"); return false; }
    if (mode === "free" && B.freeReviveUsed) { toast("本局免费复生已使用"); return false; }
    if (mode === "free") B.freeReviveUsed = true;
    else if (mode === "paid") B.paidReviveCount += 1;
    else return false;
    B.player.hp = Math.ceil(B.player.maxHp * REVIVE_HP_RATIO);
    B.player.dead = false;
    B.player.dragging = false;
    B.player.hit = 0.4;
    B.hostileShots = B.hostileShots.filter((shot) => shot.target !== "player");
    playerHud();
    reviveHud();
    updatePetSkillButton();
    msg("剑意重燃", mode === "free" ? "已使用本局免费复生，恢复 50% 生命" : "内测模拟复生成功，恢复 50% 生命");
    return true;
  }
  function resolveDefenseFailure() {
    if (!bothDefensesLost() || B.finished) return false;
    B.outcome = "阵毁身陨";
    finish(false);
    return true;
  }
  function damagePlayer(amount, source = "妖物近身") {
    if (B.player.dead || !B.running) return false;
    B.player.hp = Math.max(0, B.player.hp - Math.max(0, amount));
    B.player.hit = 0.22;
    playerHud();
    if (B.player.hp > 0) {
      msg(source, `真君 -${Math.ceil(amount)} HP`);
      return true;
    }
    B.player.dead = true;
    B.player.dragging = false;
    B.swords = [];
    playerHud();
    reviveHud();
    msg("万剑真君战败", B.hp <= 0 ? "护阵已破，等待重构后才可复生" : "护阵尚存，可选择复生；当前进入观战", true);
    resolveDefenseFailure();
    return true;
  }
  function damageWall(amount, source = "妖物攻阵") {
    if (!B.running) return false;
    B.wallUnderAttack = true;
    B.wallQuietFor = 0;
    B.hp = Math.max(0, B.hp - Math.max(0, amount));
    const firstBreak = B.hp <= 0 && !B.wallBroken;
    B.wallBroken = B.hp <= 0;
    wall();
    reviveHud();
    if (firstBreak) {
      msg("护宗大阵已破", B.player.dead ? "真君已战败，试炼终止" : "真君仍可继续斩妖；停战约 5 秒后可快速重构", true);
    } else if (B.hp > 0) {
      msg(source, `护阵 -${Math.ceil(amount)}`);
    }
    resolveDefenseFailure();
    return true;
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
    B.stage = stage; B.isNormalStage = stage.type === "normal"; B.running = false; B.paused = false; B.last = performance.now(); B.fire = 0.6; B.spawn = 0; B.wave = 0; B.queue = []; B.enemies = []; B.swords = []; B.drops = []; B.hostileShots = [];
    B.maxHp = effectiveWallMaxHp(); B.hp = B.maxHp; B.wallBroken = false; B.wallQuietFor = 0; B.wallUnderAttack = false; B.freeReviveUsed = false; B.paidReviveCount = 0; B.gold = 0; B.damage = 0; B.boss = null; B.bossCreated = false; B.catchShown = false; B.catchDone = false; B.finished = false; B.pendingFinish = false; B.outcome = ""; B.petSkillCooldown = 0; B.eliteSummon = 0;
    const chapter = chapterConfig(stage);
    if (stage.type === "story") { B.outcome = `${chapter.name}结算`; finish(true); return; }
    B.running = true; $("battleTitle").textContent = `${chapter.eyebrow} · ${stage.title}`; $("bossHud").classList.remove("show"); $("catchPanel").classList.remove("show"); $("revivePanel").classList.remove("show"); $("runGold").textContent = 0;
    wall(); open("battle"); size(); resetPlayer(); wave(1); msg(`踏入 ${stage.title}`, `「${stage.intro.speaker}」${stage.intro.text}`); requestAnimationFrame(loop);
  }
  function wave(n) {
    B.wave = n;
    const stage = B.stage || { waves: 3, enemyTier: 0, type: "normal" }; const index = Math.max(0, chapterStages().findIndex((item) => item.id === stage.id)); const tier = Number(stage.enemyTier) || Math.max(0, index);
    const isForest = stageChapter(stage) === 2; const labels = isForest ? ["妖藤初醒", "腐根蔓延", "灵木震颤", "林心妖潮", "妖核翻涌"] : ["妖气初现", "残阵震荡", "剑痕守望", "妖潮压境", "阵眼震颤"], names = isForest ? ["妖藤小灵", "腐木妖鼠", "藤甲妖猿", "裂隙木魅"] : ["污化狼妖", "裂隙妖灵", "荒原妖兵", "噬魂妖灵"];
    $("waveText").textContent = `第 ${n} / ${stage.waves || 3} 波 · ${labels[Math.min(n - 1, labels.length - 1)]}`;
    const count = 5 + n + Math.floor(tier / 2);
    B.queue = Array.from({ length: count }, (_, i) => { const hp = 28 + tier * 7 + n * 7 + (i % 3) * 4; return { name: names[(i + n + tier) % names.length], hp, maxHp: hp, speed: 10 + tier * 0.9 + n * 0.65, r: 30 + (i % 2) * 3 + Math.min(7, Math.floor(tier / 2)), value: 5 + tier + n, meleeDamage: 12 + n + Math.floor(tier / 3), wallDamage: 26 + n * 2 + Math.floor(tier / 2), meleeInterval: 1.22, wallInterval: 1.55, boss: false, kind: isForest ? "forestNormal" : "normal" }; });
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
      attackCooldown: 0.45 + Math.random() * 0.35,
      wallAttackCooldown: 0.55 + Math.random() * 0.3,
      mode: "advance",
    });
  }

  function spawnBoss() {
    const c = cs(), config = B.stage?.boss || { name: "寻木青雀", hp: 320, speed: 13, r: 44, value: 28, kind: "chapter" };
    B.boss = { name: config.name, hp: config.hp, maxHp: config.hp, speed: config.speed, r: config.r, x: c.w / 2, y: -68, anchorY: Math.min(265, c.h * 0.42), hit: 0, slow: 0, boss: true, enraged: false, value: config.value, kind: config.kind, meleeCooldown: 0.9, rangedCooldown: 1.65, mode: "guard" };
    B.enemies.push(B.boss); B.bossCreated = true; B.eliteSummon = (config.kind === "elite" || config.kind === "forestElite") ? 1.6 : 0; $("bossHud").classList.add("show"); bossHud(); $("waveText").textContent = `首领来袭 · ${config.name}`;
    const isForestBoss = stageChapter(B.stage) === 2; msg("守关首领现身", B.stage?.capture ? `血量低于 ${Math.round(B.stage.capture.threshold * 100)}% 可结契` : isForestBoss ? "击破妖核，夺回封印碎片" : "击破首领，稳住荒原阵路");
  }
  function shoot() {
    if (B.player.dead) return;
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
    if (B.stage.type === "story") { const chapter = String(stageChapter(B.stage)); P.chapterProgress.chapterCompletion[chapter] = true; if (chapter === "1") P.chapterProgress.chapterCompleted = true; }
    const stages = chapterStages(), next = stages[stages.findIndex((stage) => stage.id === B.stage.id) + 1]; P.chapterProgress.currentStage = next?.id || B.stage.id; selectedStageId = P.chapterProgress.currentStage;
    return { gold: reward.gold || 0, items, firstClear, showEquipmentGuide };
  }
  function applyNormalStageRewards(win) { return applyStageRewards(win); }
  function finish(win) {
    if (B.finished) return; B.finished = true; B.running = false; $("catchPanel").classList.remove("show"); $("revivePanel").classList.remove("show");
    const stageRewards = B.stage ? applyStageRewards(win) : null; const baseEarned = B.gold + (stageRewards ? stageRewards.gold : win ? 80 : 20) + (win && B.outcome === "狂暴后斩杀" ? 40 : 0); const earned = applyGoldBonus(baseEarned); P.gold += earned; P.cleared = win || P.cleared; save();
    const stageChapterName = chapterConfig(B.stage).name; const successTitle = B.outcome === "收服寻木青雀" ? "结契功成" : B.stage?.type === "story" ? `${stageChapterName}告一段落` : B.stage?.type === "elite" ? "精英试炼告捷" : "守阵告捷";
    $("resultTitle").textContent = win ? successTitle : B.outcome === "阵毁身陨" ? "阵毁身陨" : "守阵失守"; const resultChapter = $("resultChapter"); if (resultChapter) resultChapter.textContent = chapterConfig(B.stage).eyebrow;
    $("resultSub").textContent = win ? (stageRewards?.showEquipmentGuide ? "「叶轻舟」荒原残器尚有灵性。去法宝页穿戴它，让剑意真正归于你手。" : B.stage?.outro ? `「${B.stage.outro.speaker}」${B.stage.outro.text}` : "万剑归鞘，荒原妖气暂息。") : "本次已自动拾取的基础战利品将带回洞府。";
    $("resultWall").textContent = Math.max(0, Math.ceil((B.hp / B.maxHp) * 100)) + "%"; $("resultDamage").textContent = fmt(B.damage); $("resultBoss").textContent = win ? B.outcome || (B.stage?.type === "story" ? "章节结算完成" : "妖潮已退") : "妖潮突破";
    const rewards = [["🪙", `灵石 +${earned}`], ...(stageRewards?.items?.length ? stageRewards.items : win ? [["📜", "试炼完成"]] : [["📜", "基础战利品"]]), ...(stageRewards ? [["✦", stageRewards.firstClear ? "首通记录已写入" : "重复试炼记录"]] : [])];
    $("rewards").innerHTML = rewards.map((item) => `<div class="reward"><i>${item[0]}</i>${item[1]}</div>`).join(""); open("result");
  }
  function updatePetSkillButton() {
    const button = $("petSkill"), pet = activePetConfig(); if (!button) return; const visible = Boolean(pet && B.running && !B.player.dead); button.hidden = !visible; if (!visible) return;
    button.disabled = B.paused || B.petSkillCooldown > 0; button.textContent = B.petSkillCooldown > 0 ? `${pet.activeSkill.name} ${B.petSkillCooldown.toFixed(1)}s` : `✦ ${pet.activeSkill.name}`;
  }
  function usePetSkill() {
    const pet = activePetConfig(); if (!B.running || B.paused || B.player.dead || !pet || B.petSkillCooldown > 0) return;
    const target = B.enemies.filter((e) => e.hp > 0).sort((a, b) => b.y - a.y)[0]; if (!target) { toast("暂无可协战的妖物"); return; }
    const damage = activePetSkillDamage(); B.enemies.slice().forEach((enemy) => { if (Math.hypot(enemy.x - target.x, enemy.y - target.y) <= 105) { enemy.slow = Math.max(enemy.slow || 0, pet.activeSkill.slow); hit(enemy, damage); } });
    B.petSkillCooldown = activePetSkillCooldown(); msg("青翎回风", `${pet.name} 掠阵，周遭妖物已被迟缓`); updatePetSkillButton();
  }
  function upgradePet() {
    const pet = activePetConfig(); if (!pet) { toast("尚未结契可培养的御兽"); return false; }
    const level = activePetLevel(); if (level >= pet.levelCap) { toast("寻木青雀已达当前培养上限"); return false; }
    if (P.gold < pet.upgrade.gold || P.materials.qingqueFeather < pet.upgrade.feather) { toast("灵石或青雀灵羽不足"); return false; }
    P.gold -= pet.upgrade.gold; P.materials.qingqueFeather -= pet.upgrade.feather; P.petProgress[pet.id].level = level + 1; save(); profile(); toast(`${pet.name} 升至 Lv.${level + 1}，协战更强`); return true;
  }
  function distanceBetween(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  function updateNormalEnemy(e, dt, c) {
    const playerNear = !B.player.dead && distanceBetween(e, B.player) <= e.r + 34;
    e.attackCooldown = Math.max(0, (e.attackCooldown || 0) - dt);
    e.wallAttackCooldown = Math.max(0, (e.wallAttackCooldown || 0) - dt);
    if (playerNear) {
      e.mode = "melee";
      if (e.attackCooldown <= 0) {
        damagePlayer(e.meleeDamage || 14, e.name + "近身扑击");
        e.attackCooldown = e.meleeInterval || 1.22;
      }
      return;
    }
    const wallLine = c.h - 145;
    if (e.y < wallLine) {
      e.mode = "advance";
      e.y = Math.min(wallLine, e.y + e.speed * dt * (e.slow > 0 ? 0.7 : 1));
      return;
    }
    e.y = wallLine;
    if (B.hp <= 0) {
      e.mode = "breach";
      return;
    }
    e.mode = "siege";
    if (e.wallAttackCooldown <= 0) {
      damageWall(e.wallDamage || 28, e.name + "冲击护阵");
      e.wallAttackCooldown = e.wallInterval || 1.55;
    }
  }
  function fireBossProjectile(e, target, c) {
    B.hostileShots.push({
      x: e.x,
      y: e.y + e.r * 0.45,
      targetX: target === "player" ? B.player.x : c.w * 0.5,
      targetY: target === "player" ? B.player.y : c.h - 140,
      target,
      speed: e.enraged ? 255 : 220,
      damage: target === "player" ? (e.enraged ? 34 : 26) : (e.enraged ? 62 : 46),
      life: 3.2,
      r: target === "player" ? 7 : 8,
    });
  }
  function updateBoss(e, dt, c) {
    e.meleeCooldown = Math.max(0, (e.meleeCooldown || 0) - dt);
    e.rangedCooldown = Math.max(0, (e.rangedCooldown || 0) - dt);
    if (B.hp > 0) {
      e.mode = "guard";
      const anchorX = c.w * 0.5;
      e.x += Math.sign(anchorX - e.x) * Math.min(Math.abs(anchorX - e.x), e.speed * dt);
      e.y += Math.sign(e.anchorY - e.y) * Math.min(Math.abs(e.anchorY - e.y), e.speed * dt);
    } else {
      e.mode = "breachAdvance";
      const targetX = B.player.dead ? c.w * 0.5 : B.player.x;
      e.x += Math.sign(targetX - e.x) * Math.min(Math.abs(targetX - e.x), e.speed * 0.48 * dt);
      e.y = Math.min(c.h - 118, e.y + e.speed * 0.48 * dt);
    }
    if (!B.player.dead && distanceBetween(e, B.player) <= e.r + 86 && e.meleeCooldown <= 0) {
      damagePlayer(e.enraged ? 34 : 25, e.name + "近战重击");
      e.meleeCooldown = e.enraged ? 0.95 : 1.25;
    }
    if (e.rangedCooldown <= 0) {
      if (!B.player.dead) fireBossProjectile(e, "player", c);
      if (B.hp > 0) fireBossProjectile(e, "wall", c);
      e.rangedCooldown = e.enraged ? 1.55 : 2.25;
      msg(e.name + "施展妖术", B.wallBroken ? "首领已越过破阵缺口" : "远程妖术同时锁定真君与护阵");
    }
  }
  function updateHostileShots(dt) {
    B.hostileShots.slice().forEach((shot) => {
      shot.life -= dt;
      const dx = shot.targetX - shot.x, dy = shot.targetY - shot.y, distance = Math.hypot(dx, dy) || 1, step = shot.speed * dt;
      if (shot.target === "player" && !B.player.dead && distanceBetween(shot, B.player) <= shot.r + 24) {
        damagePlayer(shot.damage, "Boss 远程妖术");
        B.hostileShots.splice(B.hostileShots.indexOf(shot), 1);
        return;
      }
      if (distance <= step + 4) {
        shot.x = shot.targetX;
        shot.y = shot.targetY;
        if (shot.target === "wall" && B.hp > 0) damageWall(shot.damage, "Boss 远程轰阵");
        B.hostileShots.splice(B.hostileShots.indexOf(shot), 1);
      } else if (shot.life <= 0) {
        B.hostileShots.splice(B.hostileShots.indexOf(shot), 1);
      } else {
        shot.x += dx / distance * step;
        shot.y += dy / distance * step;
      }
    });
  }
  function repairWallIfQuiet(dt) {
    if (B.wallUnderAttack) {
      B.wallQuietFor = 0;
      return false;
    }
    B.wallQuietFor += dt;
    const reconstructing = B.hp <= 0;
    const delay = reconstructing ? WALL_RECONSTRUCT_DELAY : WALL_REPAIR_DELAY;
    const rate = reconstructing ? WALL_RECONSTRUCT_PER_SECOND : WALL_REPAIR_PER_SECOND;
    if (B.hp >= B.maxHp || B.wallQuietFor < delay) return false;
    B.hp = Math.min(B.maxHp, B.hp + rate * dt);
    B.wallBroken = B.hp <= 0;
    wall();
    if (reconstructing && B.hp > 0) {
      playerHud();
      reviveHud();
      msg("护阵重构", "阵纹重燃，真君已恢复复生条件");
    }
    return true;
  }
  function update(dt) {
    if (!B.running || B.paused) return;
    const c = cs(), b = playerBounds();
    if (!B.player.dead) {
      const x = (keys.has("arrowright") || keys.has("d") ? 1 : 0) - (keys.has("arrowleft") || keys.has("a") ? 1 : 0);
      const y = (keys.has("arrowdown") || keys.has("s") ? 1 : 0) - (keys.has("arrowup") || keys.has("w") ? 1 : 0);
      if (x || y) {
        const length = Math.hypot(x, y);
        B.player.x = clamp(B.player.x + x / length * 260 * dt, b.minX, b.maxX);
        B.player.y = clamp(B.player.y + y / length * 260 * dt, b.minY, b.maxY);
        B.player.targetX = B.player.x;
        B.player.targetY = B.player.y;
      } else {
        const dx = B.player.targetX - B.player.x, dy = B.player.targetY - B.player.y, distance = Math.hypot(dx, dy), step = 360 * dt;
        if (distance > 1) {
          B.player.x += dx / distance * Math.min(step, distance);
          B.player.y += dy / distance * Math.min(step, distance);
        }
      }
    } else {
      keys.clear();
    }
    B.player.hit = Math.max(0, (B.player.hit || 0) - dt);
    B.petSkillCooldown = Math.max(0, (B.petSkillCooldown || 0) - dt);
    updatePetSkillButton();
    if (B.eliteSummon > 0 && B.boss && B.enemies.includes(B.boss)) {
      B.eliteSummon -= dt;
      if (B.eliteSummon <= 0) {
        const count = B.stage?.boss?.summonCount || 3, forestElite = B.stage?.boss?.kind === "forestElite";
        for (let i = 0; i < count; i++) makeEnemy({ name: forestElite ? "妖藤小灵" : "碎石妖鼠", hp: forestElite ? 64 : 54, maxHp: forestElite ? 64 : 54, speed: forestElite ? 10 : 12, r: 27, value: 7, meleeDamage: 14, wallDamage: 28, meleeInterval: 1.2, wallInterval: 1.5, boss: false, kind: forestElite ? "forestNormal" : "normal" });
        msg(forestElite ? "玄藤唤灵" : "石甲震地", forestElite ? "玄藤鹿灵唤来妖藤小灵" : "荒原石甲兽唤来碎石妖鼠");
      }
    }
    B.fire -= dt;
    if (!B.player.dead && B.fire <= 0) {
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
      if (B.wave < waves) {
        B.bossCreated = true;
        setTimeout(() => { B.bossCreated = false; wave(B.wave + 1); }, 280);
      } else if (type === "normal") {
        if (!B.pendingFinish) {
          B.pendingFinish = true;
          B.outcome = "妖潮已退";
          setTimeout(() => finish(true), 620);
        }
      } else {
        spawnBoss();
      }
    }
    B.wallUnderAttack = false;
    B.enemies.slice().forEach((e) => {
      e.hit = Math.max(0, e.hit - dt);
      e.slow = Math.max(0, e.slow - dt);
      if (e.boss) updateBoss(e, dt, c);
      else updateNormalEnemy(e, dt, c);
    });
    updateHostileShots(dt);
    repairWallIfQuiet(dt);
    if (B.hp > 0 && B.wallUnderAttack) wall();
    B.swords.slice().forEach((sword) => {
      sword.life -= dt;
      if (!sword.target || !B.enemies.includes(sword.target)) {
        B.swords.splice(B.swords.indexOf(sword), 1);
        return;
      }
      const dx = sword.target.x - sword.x, dy = sword.target.y - sword.y, distance = Math.hypot(dx, dy) || 1, step = sword.speed * dt;
      if (distance < step + 10) {
        hit(sword.target, sword.damage);
        B.swords.splice(B.swords.indexOf(sword), 1);
      } else {
        sword.x += dx / distance * step;
        sword.y += dy / distance * step;
      }
    });
    B.drops.slice().forEach((dropItem) => {
      const hx = B.player.x, hy = B.player.y - 8, dx = hx - dropItem.x, dy = hy - dropItem.y, distance = Math.hypot(dx, dy);
      if (!B.player.dead && distance < MAGNET_RANGE) {
        dropItem.x += dx * Math.min(1, dt * MAGNET_SPEED);
        dropItem.y += dy * Math.min(1, dt * MAGNET_SPEED);
        if (distance < MAGNET_COLLECT_DISTANCE) {
          if (dropItem.type === "gold") B.gold += dropItem.val;
          else if (!P.equipment.includes("🛡️ 幽冥战甲")) P.equipment.push("🛡️ 幽冥战甲");
          B.drops.splice(B.drops.indexOf(dropItem), 1);
          $("runGold").textContent = fmt(B.gold);
        }
      }
      dropItem.spin += dt * 4;
    });
  }
  function drawForestBattleScene(w, h) {
    const stageType = B.stage?.type || "normal", sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, stageType === "boss" ? "#102b2c" : "#143a37"); sky.addColorStop(0.43, "#275d4c"); sky.addColorStop(1, "#5f7050"); ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.globalAlpha = stageType === "boss" ? 0.42 : 0.25; ctx.fillStyle = "#a8ef8d";
    for (let i = 0; i < 17; i++) { const x = (i * 71 + 29) % w, y = 28 + (i % 5) * 39; ctx.beginPath(); ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 0.22; ctx.fillStyle = "#d7ffe0"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(w * (0.16 + i * 0.27), h * (0.33 + (i % 2) * .055), w * .31, 17, -.12, 0, Math.PI * 2); ctx.fill(); } ctx.restore();
    const trunks = [[w*.04, h*.06, 31], [w*.2, h*.18, 23], [w*.82, h*.04, 36], [w*.66, h*.2, 22], [w*.97, h*.2, 26]];
    trunks.forEach(([x, y, r]) => { ctx.fillStyle = "#183f37"; ctx.fillRect(x - r*.24, y, r*.48, h*.51 - y); ctx.fillStyle = "#2b684d"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.arc(x-r*.65, y+r*.22, r*.65, 0, Math.PI*2); ctx.arc(x+r*.67, y+r*.16, r*.7, 0, Math.PI*2); ctx.fill(); });
    ctx.strokeStyle = "#67b576"; ctx.globalAlpha = .42; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { const x = w * (0.1 + i*.17); ctx.beginPath(); ctx.moveTo(x, h*.35); ctx.quadraticCurveTo(x + 25, h*.48, x - 12, h*.68); ctx.stroke(); } ctx.globalAlpha = 1;
    const groundY = h*.43, ground = ctx.createLinearGradient(0, groundY, 0, h); ground.addColorStop(0, "#557154"); ground.addColorStop(1, "#29463a"); ctx.fillStyle = ground; ctx.fillRect(0, groundY, w, h-groundY);
    ctx.fillStyle = "#769264"; ctx.beginPath(); ctx.moveTo(w*.43,groundY);ctx.lineTo(w*.59,groundY);ctx.lineTo(w*.87,h);ctx.lineTo(w*.08,h);ctx.closePath();ctx.fill();
    ctx.strokeStyle = "#3f674e"; ctx.globalAlpha=.55; ctx.lineWidth=2; for(let y=groundY+26;y<h;y+=39){ctx.beginPath();ctx.moveTo(0,y);ctx.quadraticCurveTo(w*.5,y-12,w,y);ctx.stroke();} ctx.globalAlpha=1;
    ctx.save(); ctx.strokeStyle="#92f0ae";ctx.shadowColor="#72e796";ctx.shadowBlur=12;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(18,h-114);ctx.lineTo(w-18,h-114);ctx.stroke();ctx.globalAlpha=.4;ctx.lineWidth=1;for(let x=38;x<w-20;x+=54){ctx.beginPath();ctx.arc(x,h-114,10,0,Math.PI*2);ctx.stroke();}ctx.restore();
  }
  function drawBattleScene(w, h) {
    if (stageChapter(B.stage) === 2) { drawForestBattleScene(w, h); return; }
    const stageType = B.stage?.type || "normal";
    const palette = stageType === "boss" ? ["#152d43", "#355d67", "#9a8466"] : stageType === "elite" ? ["#233a4b", "#57736d", "#b59b75"] : ["#284b5b", "#74988d", "#d1ad79"];
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, palette[0]); sky.addColorStop(0.43, palette[1]); sky.addColorStop(1, palette[2]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.globalAlpha = stageType === "boss" ? 0.55 : 0.34; ctx.fillStyle = "#f4e7a6";
    ctx.beginPath(); ctx.arc(w * 0.76, h * 0.15, Math.min(38, w * 0.1), 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.18; ctx.fillStyle = "#d6fff2";
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc((i * 91 + 17) % w, 40 + (i % 3) * 34, 1.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    const mountains = [[-90, h * 0.37, 150, h * 0.13, 325, h * 0.4], [w * 0.31, h * 0.42, w * 0.57, h * 0.16, w * 0.86, h * 0.43], [w * 0.7, h * 0.4, w * 0.9, h * 0.2, w + 120, h * 0.42]];
    ctx.fillStyle = "#183d47aa";
    mountains.forEach(([x1, y1, x2, y2, x3, y3]) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x3, h * 0.57); ctx.lineTo(x1, h * 0.57); ctx.closePath(); ctx.fill(); });
    ctx.save(); ctx.globalAlpha = 0.17; ctx.fillStyle = "#e8fff3";
    for (let i = 0; i < 4; i++) { const y = h * (0.3 + i * 0.055); ctx.beginPath(); ctx.ellipse(w * (0.18 + i * 0.2), y, w * 0.32, 16, -0.1, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    const groundY = h * 0.43, ground = ctx.createLinearGradient(0, groundY, 0, h);
    ground.addColorStop(0, "#a98a67"); ground.addColorStop(1, "#5a654d"); ctx.fillStyle = ground; ctx.fillRect(0, groundY, w, h - groundY);
    ctx.fillStyle = "#d7bc8b"; ctx.beginPath(); ctx.moveTo(w * 0.42, groundY); ctx.lineTo(w * 0.61, groundY); ctx.lineTo(w * 0.86, h); ctx.lineTo(w * 0.1, h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#795d45"; ctx.globalAlpha = 0.45; ctx.lineWidth = 1;
    for (let y = groundY + 32; y < h; y += 43) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    for (let x = -w; x < w * 2; x += 58) { ctx.beginPath(); ctx.moveTo(w * 0.51, groundY); ctx.lineTo(x, h); ctx.stroke(); }
    ctx.globalAlpha = 1;
    ctx.save(); ctx.strokeStyle = "#8af0c4"; ctx.shadowColor = "#65efc6"; ctx.shadowBlur = 12; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(18, h - 114); ctx.lineTo(w - 18, h - 114); ctx.stroke();
    ctx.globalAlpha = 0.42; ctx.lineWidth = 1;
    for (let x = 38; x < w - 20; x += 54) { ctx.beginPath(); ctx.arc(x, h - 114, 10, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
  function drawDrop(d) {
    ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.spin);
    const equip = d.type === "equip"; ctx.shadowColor = equip ? "#cfadff" : "#ffd85b"; ctx.shadowBlur = 12;
    ctx.fillStyle = equip ? "#b994ec" : "#f7c84b"; ctx.strokeStyle = "#6b4730"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(9, 0); ctx.lineTo(0, 10); ctx.lineTo(-9, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff8c9"; ctx.fillRect(-1.5, -5, 3, 10); ctx.restore();
  }
  function drawHostileShot(shot) {
    ctx.save();
    ctx.translate(shot.x, shot.y);
    ctx.shadowColor = shot.target === "wall" ? "#f4b66b" : "#df786a";
    ctx.shadowBlur = 14;
    ctx.fillStyle = shot.target === "wall" ? "#f0cb6f" : "#df786a";
    ctx.beginPath(); ctx.arc(0, 0, shot.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff5bf"; ctx.beginPath(); ctx.arc(-shot.r * 0.22, -shot.r * 0.24, shot.r * 0.36, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function drawPlayerSprite(x, y) {
    ctx.save();
    const downed = B.player.dead;
    if (downed) ctx.globalAlpha = 0.72;
    ctx.fillStyle = "#1a2630aa"; ctx.beginPath(); ctx.ellipse(x, y + 24, downed ? 43 : 33, 10, 0, 0, Math.PI * 2); ctx.fill();
    if (!downed) {
      const aura = ctx.createRadialGradient(x, y + 2, 4, x, y + 2, 44); aura.addColorStop(0, "#dfffd788"); aura.addColorStop(1, "#8be6c000"); ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(x, y + 2, 44, 0, Math.PI * 2); ctx.fill();
    }
    if (downed) { ctx.save(); ctx.translate(x, y + 15); ctx.rotate(-Math.PI * 0.42); ctx.translate(-x, -(y + 15)); }
    ctx.strokeStyle = B.player.hit > 0 ? "#ff6d61" : "#f3d47d"; ctx.shadowColor = B.player.hit > 0 ? "#ff7967" : "#fff1a3"; ctx.shadowBlur = 8; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 19, y + 16); ctx.lineTo(x + 36, y - 19); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = "#1f3248"; ctx.beginPath(); ctx.moveTo(x - 26, y + 27); ctx.lineTo(x + 26, y + 27); ctx.lineTo(x + 16, y - 6); ctx.lineTo(x - 16, y - 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#49649a"; ctx.beginPath(); ctx.moveTo(x - 15, y - 4); ctx.lineTo(x + 15, y - 4); ctx.lineTo(x + 10, y + 24); ctx.lineTo(x - 10, y + 24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#d8b76d"; ctx.fillRect(x - 14, y + 5, 28, 4);
    ctx.fillStyle = "#f4d7ae"; ctx.beginPath(); ctx.arc(x, y - 19, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#23304b"; ctx.beginPath(); ctx.arc(x, y - 25, 16, Math.PI, Math.PI * 2); ctx.fill(); ctx.fillRect(x - 16, y - 26, 32, 6);
    ctx.fillStyle = "#fff0be"; ctx.fillRect(x - 9, y - 24, 18, 3); ctx.fillStyle = "#25314a"; ctx.fillRect(x - 8, y - 18, 4, 2); ctx.fillRect(x + 4, y - 18, 4, 2);
    if (downed) { ctx.restore(); ctx.globalAlpha = 1; ctx.fillStyle = "#f17a6b"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center"; ctx.fillText("战败观战", x, y - 48); }
    ctx.restore();
  }
  function drawPetSprite() {
    const pet = activePetConfig();
    if (!pet || B.player.dead) return;
    const c = cs();
    const bob = Math.sin(performance.now() / 180) * 3;
    const x = clamp(B.player.x + 43, 28, c.w - 28);
    const y = clamp(B.player.y - 18 + bob, 78, c.h - 142);
    const skillReady = B.petSkillCooldown <= 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#142e36a8";
    ctx.beginPath(); ctx.ellipse(0, 18, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = skillReady ? "#a8f4b1" : "#78bea0";
    ctx.shadowBlur = skillReady ? 15 : 8;
    ctx.fillStyle = "#c9f1b2aa";
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#438a70";
    ctx.strokeStyle = "#254d4d";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-5, 1); ctx.lineTo(-27, -12); ctx.lineTo(-18, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 1); ctx.lineTo(27, -12); ctx.lineTo(18, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#74bd95";
    ctx.beginPath(); ctx.ellipse(0, 0, 12, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f3d273";
    ctx.beginPath(); ctx.moveTo(8, -1); ctx.lineTo(18, 3); ctx.lineTo(8, 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff4c7";
    ctx.beginPath(); ctx.arc(-4, -4, 2.2, 0, Math.PI * 2); ctx.arc(4, -4, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#eff8d0";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(pet.name, 0, -28);
    ctx.restore();
  }
  function drawEnemySprite(e) {
    const r = e.r, isBird = e.boss && e.kind === "chapter", isElite = e.boss && e.kind === "elite", isForestElite = e.boss && e.kind === "forestElite", isForestChapter = e.boss && e.kind === "forestChapter", isForestNormal = !e.boss && e.kind === "forestNormal";
    ctx.save(); ctx.translate(e.x, e.y); ctx.fillStyle = "#162f30aa"; ctx.beginPath(); ctx.ellipse(0, r * 0.72, r * 0.9, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    if (isForestChapter) {
      ctx.strokeStyle = e.enraged ? "#d86d68" : "#1f5f57"; ctx.fillStyle = e.enraged ? "#b75350" : "#347b66"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-r*.92,r*.2); ctx.quadraticCurveTo(-r*.72,-r*.72,-r*.1,-r*.42); ctx.quadraticCurveTo(r*.58,-r*.68,r*.86,-r*.08); ctx.quadraticCurveTo(r*.45,r*.5,0,r*.36); ctx.quadraticCurveTo(-r*.48,r*.65,-r*.92,r*.2); ctx.fill(); ctx.stroke();
      ctx.fillStyle="#73c890";ctx.beginPath();ctx.arc(-r*.04,-r*.34,r*.35,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#97f6cf";ctx.beginPath();ctx.arc(-r*.16,-r*.38,r*.07,0,Math.PI*2);ctx.arc(r*.16,-r*.38,r*.07,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#d7f397";ctx.beginPath();ctx.moveTo(r*.58,r*.02);ctx.lineTo(r*1.1,-r*.35);ctx.stroke();
    } else if (isForestElite) {
      ctx.fillStyle = e.enraged ? "#b45450" : "#608a59"; ctx.strokeStyle = "#244a3c"; ctx.lineWidth=4; ctx.beginPath();ctx.ellipse(0,r*.05,r*.67,r*.78,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.strokeStyle="#b7d67e";ctx.lineWidth=3;[-1,1].forEach(side=>{ctx.beginPath();ctx.moveTo(side*r*.19,-r*.38);ctx.lineTo(side*r*.56,-r*.86);ctx.lineTo(side*r*.77,-r*.61);ctx.moveTo(side*r*.56,-r*.86);ctx.lineTo(side*r*.78,-r*1.03);ctx.stroke();});ctx.fillStyle="#dce9ad";ctx.beginPath();ctx.arc(0,-r*.23,r*.26,0,Math.PI*2);ctx.fill();ctx.stroke();
    } else if (isForestNormal) {
      ctx.fillStyle="#427a58";ctx.strokeStyle="#1f4b3c";ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,1,r*.7,r*.8,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#83be77";for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse((i-1)*r*.32,-r*.37,r*.17,r*.38,(i-1)*.45,0,Math.PI*2);ctx.fill();}ctx.fillStyle="#d8f3a9";
    } else if (isBird) {
      const wingColor = e.enraged ? "#bd5959" : "#5c9b80"; ctx.fillStyle = wingColor; ctx.strokeStyle = "#274e4c"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-r * 0.2, 0); ctx.lineTo(-r * 1.1, -r * 0.55); ctx.lineTo(-r * 0.72, r * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(r * 0.2, 0); ctx.lineTo(r * 1.1, -r * 0.55); ctx.lineTo(r * 0.72, r * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = e.enraged ? "#e16a5d" : "#78bea0"; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.52, r * 0.72, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#f3d273"; ctx.beginPath(); ctx.moveTo(0, -r * 0.08); ctx.lineTo(r * 0.45, r * 0.08); ctx.lineTo(0, r * 0.18); ctx.closePath(); ctx.fill();
    } else if (isElite) {
      ctx.fillStyle = e.enraged ? "#b8544e" : "#78816b"; ctx.strokeStyle = "#3e483b"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-r * 0.85, r * 0.45); ctx.lineTo(-r * 0.72, -r * 0.4); ctx.lineTo(-r * 0.25, -r * 0.82); ctx.lineTo(r * 0.48, -r * 0.66); ctx.lineTo(r * 0.86, -r * 0.08); ctx.lineTo(r * 0.7, r * 0.56); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#a9a58e"; [[-r * .35,-r*.3],[r*.3,-r*.22],[0,r*.25]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,r*.17,0,Math.PI*2);ctx.fill();});
    } else {
      const spirit = e.name.includes("灵"); ctx.fillStyle = spirit ? "#75649b" : "#58735d"; ctx.strokeStyle = "#263d3a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 1, r * 0.72, r * 0.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); if (!spirit) { ctx.beginPath(); ctx.moveTo(-r*.48,-r*.48); ctx.lineTo(-r*.24,-r*.94); ctx.lineTo(0,-r*.5); ctx.lineTo(r*.28,-r*.94); ctx.lineTo(r*.48,-r*.42); ctx.closePath(); ctx.fill(); } else { ctx.globalAlpha = .4; ctx.fillStyle = "#cdb9ed"; ctx.beginPath(); ctx.moveTo(-r*.7,r*.1);ctx.lineTo(-r*.95,r*.85);ctx.lineTo(0,r*.57);ctx.lineTo(r*.9,r*.88);ctx.lineTo(r*.64,r*.05);ctx.closePath();ctx.fill();ctx.globalAlpha=1; }
    }
    ctx.fillStyle = "#f8e9a7"; ctx.beginPath(); ctx.arc(-r * 0.23, -r * 0.1, 3.4, 0, Math.PI * 2); ctx.arc(r * 0.23, -r * 0.1, 3.4, 0, Math.PI * 2); ctx.fill();
    if (e.hit > 0) { ctx.globalAlpha = Math.min(0.9, e.hit * 5); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, r + 7, 0, Math.PI * 2); ctx.fill(); }
    if (e.boss) { ctx.globalAlpha = 1; ctx.fillStyle = "#fff4c7"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center"; ctx.fillText(e.enraged ? `狂暴 · ${e.name}` : e.name, 0, -r - 13); ctx.fillStyle = "#342b32"; ctx.fillRect(-r, r + 10, r * 2, 5); ctx.fillStyle = e.enraged ? "#ef6559" : "#f2ba58"; ctx.fillRect(-r, r + 10, r * 2 * Math.max(0, e.hp / e.maxHp), 5); }
    ctx.restore();
  }
  function drawSwordSprite(s) {
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.atan2(s.target.y - s.y, s.target.x - s.x) + Math.PI / 2);
    ctx.shadowColor = "#fff5a3"; ctx.shadowBlur = 11; ctx.fillStyle = "#fff3a4"; ctx.strokeStyle = "#a96f35"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(5, 8); ctx.lineTo(0, 16); ctx.lineTo(-5, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#64d9e7"; ctx.fillRect(-1.5, -8, 3, 17); ctx.restore();
  }
  function draw() {
    if (!ctx) return;
    const { w, h } = cs(); ctx.clearRect(0, 0, w, h); drawBattleScene(w, h);
    B.drops.forEach(drawDrop); B.hostileShots.forEach(drawHostileShot); drawPetSprite(); drawPlayerSprite(B.player.x, B.player.y); B.enemies.forEach(drawEnemySprite); B.swords.forEach(drawSwordSprite);
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
      toast("灵石不足，完成试炼可获得更多灵石");
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
    if (e.key === "Escape" && !$("homePlaceholderPanel")?.hidden) {
      closeHomePlaceholder();
      return;
    }
    if (e.key === "Escape" && !$("chapterDrawer")?.hidden) {
      toggleChapterDrawer(false);
      return;
    }
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
      toggleChapterDrawer(false);
      open(b.dataset.nav);
      return;
    }
    let a = b.dataset.action;
    if (b.dataset.placeholderTitle && a !== "open-home-placeholder") openHomePlaceholder(b.dataset.placeholderTitle, b.dataset.placeholderIcon);
    if (a === "toggle-home-promos") toggleHomePromos();
    if (a === "close-home-placeholder") closeHomePlaceholder();
    if (a === "open-home-placeholder") { open("home"); openHomePlaceholder(b.dataset.placeholderTitle, b.dataset.placeholderIcon); }
    if (a === "toggle-chapter-drawer") toggleChapterDrawer();
    if (a === "open-home") returnHomeFromRift();
    if (a === "close-chapter-drawer") toggleChapterDrawer(false);
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
    if (a === "revive-free") revivePlayer("free");
    if (a === "revive-paid") revivePlayer("paid");
    if (a === "decline-catch") declineCapture();
    if (a === "hint") toast(b.textContent.replace(/\s+/g, " ").trim());
    if (a === "back-home") open("home");
  });
  window.addEventListener("resize", () => {
    $("battle").classList.contains("active") && size();
  });
  window.addEventListener("DOMContentLoaded", profile);
})();
