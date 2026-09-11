(() => {
  const KEY = "wanjian_fengyao_p0_v3",
    P1_DEFAULT = {
      schemaVersion: 4,
      chapterProgress: { currentStage: "1-01", cleared: {}, firstRewards: {} },
      materials: { swordIron: 0 },
      ownedGear: [],
      equippedGear: { bracer: null, robe: null, jade: null },
    },
    D = {
      gold: 8800,
      gourds: 3,
      weaponLevel: 1,
      weaponDamage: 16,
      equipment: ["🗡️ 青霄飞剑", "🪬 镇妖符"],
      pet: null,
      cleared: false,
      tutorialCaptureDone: false,
      ...P1_DEFAULT,
    };
  let P = { ...D };
  try {
    P = { ...D, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch (e) {}
  function migrateP1() {
    let c = P.chapterProgress || {},
      m = P.materials || {},
      e = P.equippedGear || {};
    P.schemaVersion = 4;
    P.chapterProgress = {
      currentStage:
        typeof c.currentStage === "string" ? c.currentStage : "1-01",
      cleared: { ...(c.cleared || {}) },
      firstRewards: { ...(c.firstRewards || {}) },
    };
    P.materials = {
      swordIron: Number.isFinite(m.swordIron)
        ? Math.max(0, Math.floor(m.swordIron))
        : 0,
    };
    P.ownedGear = Array.isArray(P.ownedGear) ? [...new Set(P.ownedGear)] : [];
    P.equippedGear = {
      bracer: typeof e.bracer === "string" ? e.bracer : null,
      robe: typeof e.robe === "string" ? e.robe : null,
      jade: typeof e.jade === "string" ? e.jade : null,
    };
  }
  migrateP1();
  if (P.pet) P.tutorialCaptureDone = true;
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
    if (!stage || stage.type !== "normal") return false;
    if (stage.unlockedByDefault) return true;
    const stages = chapterStages();
    const index = stages.findIndex((item) => item.id === stage.id);
    const previous = stages[index - 1];
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
  function rewardSummary(reward) {
    const lines = [];
    if (reward.gold) lines.push(`🪙 ${reward.gold} 仙石`);
    if (reward.materials?.swordIron)
      lines.push(`⛓️ 剑胚残铁 ×${reward.materials.swordIron}`);
    if (reward.gear) {
      const gear = globalThis.P1_CONFIG?.gear?.[reward.gear];
      if (gear) lines.push(`${gear.icon} ${gear.name}`);
    }
    return lines.join(" · ") || "暂无额外奖励";
  }
  function renderChapterMap() {
    const map = $("stageMap");
    const brief = $("stageBrief");
    const startButton = $("stageStart");
    if (!map || !brief || !startButton) return;
    const stages = chapterStages();
    const active = selectedStage();
    map.innerHTML = stages
      .map((stage, index) => {
        const cleared = Boolean(P.chapterProgress.cleared[stage.id]);
        const unlocked = isStageUnlocked(stage);
        const selected = active?.id === stage.id;
        const state =
          stage.type === "boss"
            ? "locked"
            : cleared
              ? "cleared"
              : unlocked
                ? "open"
                : "locked";
        const status =
          stage.type === "boss"
            ? "后续开放"
            : cleared
              ? "已通关"
              : unlocked
                ? "可挑战"
                : "尚未解锁";
        return `<button class="stage-card ${state} ${selected ? "selected" : ""}" data-action="select-stage" data-stage-id="${stage.id}" ${unlocked ? "" : 'aria-disabled="true"'}>
          <span class="stage-number">${stage.type === "boss" ? "🦅" : index + 1}</span>
          <span class="stage-card-copy"><b>${stage.id} · ${stage.title}</b><small>${status} · 推荐剑意 ${stage.recommendedPower}</small></span>
          <span class="stage-state">${cleared ? "✓" : unlocked ? "✦" : "🔒"}</span>
        </button>`;
      })
      .join("");
    if (!active) {
      brief.innerHTML = "<b>第一章试炼尚未配置</b>";
      startButton.disabled = true;
      return;
    }
    const cleared = Boolean(P.chapterProgress.cleared[active.id]);
    const reward = cleared ? active.repeat : active.firstClear;
    brief.innerHTML = `<div class="stage-brief-top"><span>${active.id}</span><b>${active.title}</b><em>${cleared ? "重复挑战" : "首通奖励"}</em></div>
      <p>「${active.intro.speaker}」${active.intro.text}</p>
      <small>推荐剑意 ${active.recommendedPower} · ${active.waves} 波妖潮</small>
      <div class="stage-reward">${rewardSummary(reward)}</div>`;
    startButton.disabled = false;
    startButton.innerHTML = `✦ 进入 ${active.id} · ${active.title}<small>${cleared ? "重复挑战：" : "首通奖励："}${rewardSummary(reward)}</small>`;
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
  function profile() {
    document
      .querySelectorAll(".gold-value")
      .forEach((x) => (x.textContent = fmt(P.gold)));
    $("goldTop").textContent = fmt(P.gold);
    $("gourdTop").textContent = P.gourds;
    $("gourdPet").textContent = P.gourds;
    $("gourdCatchCount").textContent = P.gourds;
    $("damageValue").textContent = P.weaponDamage;
    $("attackInterval").textContent = ATTACK_INTERVAL.toFixed(2);
    $("magnetRange").textContent = MAGNET_RANGE;
    $("weaponName").textContent = `青霄飞剑 +${P.weaponLevel}`;
    $("powerValue").textContent = 110 + P.weaponLevel * 16;
    $("upgradeCost").textContent = 300 + P.weaponLevel * 180;
    let b = $("bag");
    b.innerHTML = "";
    let its = [
      ...P.equipment.map((x) => ({ i: x.split(" ")[0], n: x.split(" ")[1] })),
      ...Array(8).fill(null),
    ];
    its.slice(0, 10).forEach((x) => {
      let d = document.createElement("div");
      d.className = x ? "" : "empty";
      d.innerHTML = x ? `${x.i}<span>${x.n}</span>` : "+";
      b.appendChild(d);
    });
    let has = !!P.pet;
    $("petFace").textContent = has ? "🦅" : "✦";
    $("formationPet").textContent = has ? "🦅" : "✦";
    $("formationState").textContent = has
      ? "已缔结寻木青雀 · 初始一柄飞剑"
      : "未结契灵宠 · 初始一柄飞剑";
    $("petState").innerHTML = has
      ? "<b>已缔结：寻木青雀</b><br>青羽巡空，已归入御兽录。"
      : "<b>尚未缔结灵宠</b><br>于首领虚弱时祭出镇妖葫芦。";
    $("petDesc").textContent = has
      ? "寻木青雀已归入御兽录。本期不提供额外战斗数值，避免破坏 P0 平衡。"
      : "P0 仅开放「寻木青雀」一只可抓捕灵兽。抓捕失败后首领将狂暴，但斩杀可获得额外法器掉落。";
    renderChapterMap();
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
    let p = Math.max(0, (B.boss.hp / B.boss.maxHp) * 100);
    $("bossHpText").textContent =
      `${Math.max(0, Math.ceil(B.boss.hp))} / ${B.boss.maxHp}`;
    $("bossHpBar").style.width = p + "%";
    $("bossName").textContent = B.boss.enraged
      ? "狂暴 · 寻木青雀"
      : "守关大妖 · 寻木青雀";
  }
  function start(stageId = selectedStageId) {
    const stage = stageById(stageId);
    if (stage && !isStageUnlocked(stage) && stage.type === "normal") {
      toast("此关尚未解锁");
      return;
    }
    B.stage = stage?.type === "normal" ? stage : null;
    B.isNormalStage = Boolean(B.stage);
    B.running = true;
    B.paused = false;
    B.last = performance.now();
    B.fire = 0.6;
    B.spawn = 0;
    B.wave = 0;
    B.queue = [];
    B.enemies = [];
    B.swords = [];
    B.drops = [];
    B.maxHp = 1200;
    B.hp = B.maxHp;
    B.gold = 0;
    B.damage = 0;
    B.boss = null;
    B.bossCreated = false;
    B.catchShown = false;
    B.catchDone = false;
    B.finished = false;
    B.pendingFinish = false;
    B.outcome = "";
    $("battleTitle").textContent = B.isNormalStage
      ? `第一章 · ${B.stage.title}`
      : "第一章 · 幽冥荒原";
    $("bossHud").classList.remove("show");
    $("catchPanel").classList.remove("show");
    $("runGold").textContent = 0;
    wall();
    open("battle");
    size();
    resetPlayer();
    wave(1);
    msg(
      B.isNormalStage ? `踏入 ${B.stage.title}` : "踏入幽冥荒原",
      B.isNormalStage
        ? `「${B.stage.intro.speaker}」${B.stage.intro.text}`
        : "守住护宗大阵",
    );
    requestAnimationFrame(loop);
  }
  function wave(n) {
    B.wave = n;
    if (B.isNormalStage) {
      const stageIndex = Math.max(
        0,
        chapterStages().findIndex((stage) => stage.id === B.stage.id),
      );
      const labels = ["妖气初现", "残阵震荡", "剑痕守望"];
      const names = ["污化狼妖", "裂隙妖灵", "荒原妖兵"];
      const count = 5 + n + stageIndex;
      $("waveText").textContent =
        `第 ${n} / ${B.stage.waves} 波 · ${labels[Math.min(n - 1, labels.length - 1)]}`;
      B.queue = Array.from({ length: count }, (_, index) => {
        const hp = 28 + stageIndex * 7 + n * 7 + (index % 3) * 4;
        return {
          name: names[(index + n + stageIndex) % names.length],
          hp,
          maxHp: hp,
          speed: 13 + stageIndex * 2 + n,
          r: 25 + (index % 2) * 3,
          value: 5 + stageIndex * 2 + n,
          boss: false,
        };
      });
      B.spawn = 0.42;
      return;
    }
    let sets = [
        ["幽冥小妖", "毒瘴妖灵", "荒原狼妖"],
        ["裂甲妖兵", "噬魂妖灵", "荒原狼妖"],
        ["幽冥卫", "毒瘴妖灵", "裂甲妖兵"],
      ],
      lab = ["妖气初现", "群妖压境", "巢穴守卫"];
    $("waveText").textContent = `第 ${n} 波 · ${lab[n - 1]}`;
    let count = 6 + n * 2;
    B.queue = Array.from({ length: count }, (_, i) => {
      let hp = 34 + n * 8 + (i % 3) * 5;
      return {
        name: sets[n - 1][i % 3],
        hp,
        maxHp: hp,
        speed: 18 + n * 2,
        r: 20 + (i % 2) * 3,
        value: 8 + n * 2,
        boss: false,
      };
    });
    B.spawn = 0.45;
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
    let c = cs();
    B.boss = {
      name: "寻木青雀",
      hp: 320,
      maxHp: 320,
      speed: 13,
      r: 44,
      x: c.w / 2,
      y: -68,
      hit: 0,
      slow: 0,
      boss: true,
      enraged: false,
      value: 28,
    };
    B.enemies.push(B.boss);
    B.bossCreated = true;
    $("bossHud").classList.add("show");
    bossHud();
    $("waveText").textContent = "首领来袭 · 寻木青雀";
    msg("守关大妖现身", "血量低于 35% 可抓捕");
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
      damage: P.weaponDamage,
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
  function updateCapturePanel() {
    let tutorial = !P.tutorialCaptureDone;
    $("catchTitle").textContent = tutorial
      ? "结契引导：首次抓捕必定成功"
      : "妖气衰竭，可祭镇妖器！";
    $("catchDesc").textContent = tutorial
      ? "天衍剑宗首训：任选镇妖器即可缔结寻木青雀。本次必须完成结契引导。"
      : "失败后首领狂暴、回血；击杀狂暴大妖将多掉一件法器。";
    $("catchSealRate").textContent = tutorial ? "必定成功" : "30%";
    $("catchGourdRate").textContent = tutorial ? "必定成功" : "65%";
    let decline = document.querySelector('[data-action="decline-catch"]');
    decline.classList.toggle("guide-locked", tutorial);
    decline.setAttribute("aria-disabled", String(tutorial));
    $("declineCatchHint").textContent = tutorial
      ? "首次引导必须结契"
      : "不消耗道具";
  }
  function hit(e, d) {
    e.hp -= d;
    e.hit = 0.16;
    B.damage += d;
    if (e.boss) {
      bossHud();
      if (!B.catchShown && !B.catchDone && e.hp / e.maxHp <= 0.35) {
        B.catchShown = true;
        B.paused = true;
        updateCapturePanel();
        $("catchPanel").classList.add("show");
        msg(
          !P.tutorialCaptureDone ? "结契引导" : "首领虚弱",
          !P.tutorialCaptureDone ? "首次抓捕必定成功" : "选择抓捕，或继续战斗",
          true,
        );
      }
    }
    if (e.hp <= 0) kill(e);
  }
  function capture(tool) {
    if (!B.running || !B.catchShown || B.catchDone) return;
    let tutorial = !P.tutorialCaptureDone,
      rate = tutorial ? 1 : tool === "gourd" ? 0.65 : 0.3;
    if (tool === "gourd") {
      if (P.gourds <= 0) {
        toast("灵葫芦不足，可使用镇妖符");
        return;
      }
      P.gourds--;
      save();
      profile();
    }
    B.catchDone = true;
    $("catchPanel").classList.remove("show");
    if (Math.random() < rate) {
      P.pet = "寻木青雀";
      P.tutorialCaptureDone = true;
      if (!P.equipment.includes("🪶 青雀灵羽")) P.equipment.push("🪶 青雀灵羽");
      save();
      B.outcome = "收服寻木青雀";
      msg("灵契已成", "寻木青雀归入御兽录");
      setTimeout(() => finish(true), 700);
    } else {
      B.paused = false;
      B.boss.enraged = true;
      B.boss.hp = Math.min(B.boss.maxHp, B.boss.hp + B.boss.maxHp * 0.24);
      B.boss.speed = 22;
      bossHud();
      msg("收妖失败！", "大妖狂暴，击杀后额外掉落");
    }
  }
  function declineCapture() {
    if (!B.running || !B.catchShown || B.catchDone) return;
    if (!P.tutorialCaptureDone) {
      toast("首次试炼请完成结契引导");
      return;
    }
    B.catchDone = true;
    B.paused = false;
    $("catchPanel").classList.remove("show");
    msg("暂缓收服", "继续诛灭寻木青雀");
  }
  function applyNormalStageRewards(win) {
    if (!win || !B.stage) return { gold: 20, items: [["📜", "基础战利品"]] };
    const firstClear = !P.chapterProgress.firstRewards[B.stage.id];
    const reward = firstClear ? B.stage.firstClear : B.stage.repeat;
    const items = [];
    P.chapterProgress.cleared[B.stage.id] = true;
    if (firstClear) P.chapterProgress.firstRewards[B.stage.id] = true;
    if (reward.materials?.swordIron) {
      P.materials.swordIron += reward.materials.swordIron;
      items.push(["⛓️", `剑胚残铁 ×${reward.materials.swordIron}`]);
    }
    if (reward.gear) {
      const gear = globalThis.P1_CONFIG?.gear?.[reward.gear];
      if (gear && !P.ownedGear.includes(gear.id)) {
        P.ownedGear.push(gear.id);
        P.equipment.push(`${gear.icon} ${gear.name}`);
      }
      if (gear) items.push([gear.icon, gear.name]);
    }
    const stages = chapterStages();
    const next =
      stages[stages.findIndex((stage) => stage.id === B.stage.id) + 1];
    if (next?.type === "normal") {
      P.chapterProgress.currentStage = next.id;
      selectedStageId = next.id;
    } else {
      P.chapterProgress.currentStage = B.stage.id;
      selectedStageId = B.stage.id;
    }
    return { gold: reward.gold, items, firstClear };
  }
  function finish(win) {
    if (B.finished) return;
    B.finished = true;
    B.running = false;
    $("catchPanel").classList.remove("show");
    const normalRewards = B.isNormalStage ? applyNormalStageRewards(win) : null;
    let earned =
      B.gold + (B.isNormalStage ? normalRewards.gold : win ? 80 : 20);
    if (win && !B.isNormalStage && B.outcome === "狂暴后斩杀") earned += 40;
    P.gold += earned;
    if (win && !B.isNormalStage && !P.equipment.includes("🗡️ 荒原剑胚"))
      P.equipment.push("🗡️ 荒原剑胚");
    P.cleared = win || P.cleared;
    save();
    $("resultTitle").textContent = B.isNormalStage
      ? win
        ? "守阵告捷"
        : "护阵受损"
      : win
        ? B.outcome === "收服寻木青雀"
          ? "收妖大捷"
          : B.outcome === "狂暴后斩杀"
            ? "诛灭狂妖"
            : "斩妖大捷"
        : "护阵受损";
    $("resultSub").textContent = B.isNormalStage
      ? win
        ? `「${B.stage.outro.speaker}」${B.stage.outro.text}`
        : "本次已自动拾取的基础战利品将带回洞府。"
      : win
        ? "万剑归鞘，荒原妖气暂息。"
        : "本次已自动拾取的基础战利品将带回洞府。";
    $("resultWall").textContent =
      Math.max(0, Math.ceil((B.hp / B.maxHp) * 100)) + "%";
    $("resultDamage").textContent = fmt(B.damage);
    $("resultBoss").textContent = win
      ? B.isNormalStage
        ? B.outcome || "妖潮已退"
        : B.outcome
      : "妖潮突破";
    const rewards = B.isNormalStage
      ? [
          ["🪙", `仙石 +${earned}`],
          ...(normalRewards.items.length
            ? normalRewards.items
            : [["📜", "重复试炼完成"]]),
          ["✦", normalRewards.firstClear ? "首通记录已写入" : "重复试炼记录"],
        ]
      : [
          ["🪙", `仙石 +${earned}`],
          ["📜", win ? "荒原试炼卷" : "基础战利品"],
          [
            B.outcome === "收服寻木青雀" ? "🦅" : "🗡️",
            B.outcome === "收服寻木青雀" ? "寻木青雀" : "荒原剑胚",
          ],
          ["🧩", B.outcome === "狂暴后斩杀" ? "妖魄 ×6" : "妖魄 ×3"],
        ];
    $("rewards").innerHTML = rewards
      .map((item) => `<div class="reward"><i>${item[0]}</i>${item[1]}</div>`)
      .join("");
    open("result");
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
      if (B.isNormalStage) {
        if (B.wave < B.stage.waves) {
          B.bossCreated = true;
          setTimeout(() => {
            B.bossCreated = false;
            wave(B.wave + 1);
          }, 280);
        } else if (!B.pendingFinish) {
          B.pendingFinish = true;
          B.outcome = "妖潮已退";
          setTimeout(() => finish(true), 620);
        }
      } else if (B.wave < 3) {
        B.bossCreated = true;
        setTimeout(() => {
          B.bossCreated = false;
          wave(B.wave + 1);
        }, 280);
      } else spawnBoss();
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
        if (e.boss) {
          B.boss = null;
          $("bossHud").classList.remove("show");
        }
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
        ctx.fillText(e.enraged ? "狂暴青雀" : "寻木青雀", 0, -r - 11);
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
