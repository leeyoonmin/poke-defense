// Poké Lucky Defense — Core Engine (Solo & 2-Player Co-op P2P / Smart AI)
(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Preload Pixel, Sprite & 5th-Gen Animated Sprite Sheet Images
  const IMG_CACHE = {};
  let ANIM_META = {};
  fetch('./assets/anim/meta.json')
    .then(r => r.json())
    .then(data => { ANIM_META = data; })
    .catch(() => {});

  function getImg(src) {
    if (!IMG_CACHE[src]) {
      const img = new Image();
      img.src = src;
      IMG_CACHE[src] = img;
    }
    return IMG_CACHE[src];
  }

  function drawAnimatedSprite(id, cx, cy, size, phase = 0, flipX = false, tilt = 0, squash = 0, flash = false, isShiny = false) {
    const key = String(id);
    const meta = ANIM_META[key];
    const animSheet = meta ? getImg(`./assets/anim/${key}.png`) : null;
    const fallback = getImg(`./assets/sprites/${key}.png`);

    ctx.save();
    ctx.translate(cx, cy);
    if (flipX) ctx.scale(-1, 1);
    if (tilt) ctx.rotate(tilt);
    if (squash) ctx.scale(1 + squash, 1 - squash);
    if (flash) {
      ctx.filter = 'brightness(2.8) contrast(1.8)';
    } else if (isShiny) {
      ctx.filter = 'hue-rotate(55deg) saturate(1.75) brightness(1.15)';
    }

    if (animSheet && animSheet.complete && animSheet.naturalWidth > 0 && meta && meta.frames > 0) {
      const frameIdx = Math.floor(phase) % meta.frames;
      const fw = meta.size;
      ctx.drawImage(animSheet, frameIdx * fw, 0, fw, fw, -size / 2, -size / 2, size, size);
    } else if (fallback && fallback.complete && fallback.naturalWidth > 0) {
      ctx.drawImage(fallback, -size / 2, -size / 2, size, size);
    }
    ctx.restore();
  }

  // Preload core pixel assets & animated sheets
  const bgImg = getImg('./assets/pixel/lucky_map_fitted.png');
  const slotImg = getImg('./assets/pixel/tile_slot.png');
  const trackImg = getImg('./assets/pixel/tile_track.png');
  Object.keys(window.UNIT_BY_ID).forEach(id => {
    getImg(`./assets/sprites/${id}.png`);
    getImg(`./assets/anim/${id}.png`);
  });
  window.POKE_DATA.enemyPool.forEach(e => {
    getImg(`./assets/sprites/${e.id}.png`);
    getImg(`./assets/anim/${e.id}.png`);
  });
  window.POKE_DATA.bossPool.forEach(b => {
    getImg(`./assets/sprites/${b.id}.png`);
    getImg(`./assets/anim/${b.id}.png`);
  });

  // Persistent Save Data (Trainer Medals, Cleared Stages, Permanent Relics)
  function loadSave() {
    try {
      const raw = localStorage.getItem('poke_def_save_v1');
      if (raw) {
        const p = JSON.parse(raw);
        return {
          medals: p.medals ?? 150,
          selectedStage: p.selectedStage || 1,
          clearedStages: Array.isArray(p.clearedStages) ? p.clearedStages : [],
          relics: p.relics || {}
        };
      }
    } catch (e) {}
    return { medals: 150, selectedStage: 1, clearedStages: [], relics: {} };
  }

  const saveData = loadSave();
  function saveProgress() {
    try {
      localStorage.setItem('poke_def_save_v1', JSON.stringify(saveData));
    } catch (e) {}
  }
  function getRelicLvl(id) {
    return saveData.relics[id] || 0;
  }

  // Game State
  const state = {
    running: false,
    mode: 'solo', // 'solo' | 'coop_ai' | 'coop_p2p'
    currentStage: window.POKE_DATA.stages[0],
    speed: 1,
    wave: 1,
    maxWaves: 30,
    waveTimer: 22,
    spawnQueue: 0,
    spawnCooldown: 0,
    enemyLimit: 100,

    gold: 160,
    gems: 4,
    summonCost: 20,
    summonCount: 0,
    summonDiscount: 0,

    bountyCooldown: 0,
    completedMissions: new Set(),
    badges: new Set(),
    bountyBossKilled: false,

    upgrades: {
      basic: 1,  // Stage 1~2 DMG
      stage3: 1, // Stage 3 & Mythic DMG
      luck: 1    // Summon higher-stage probability
    },

    // Player board: 18 slots (6x3)
    mySlots: new Array(18).fill(null),
    // Partner board (used in 2P Co-op mode): 18 slots (6x3)
    allySlots: new Array(18).fill(null),
    allyName: 'AI 레드',
    allyGold: 160,
    aiActionTimer: 1.5,

    selectedSlot: -1,
    dragSlot: -1,
    dragPos: { x: 0, y: 0 },
    isDragging: false,

    enemies: [],
    projectiles: [],
    effects: [],
    floatTexts: [],
    banners: [],
    pings: [],
    shakeTime: 0,
    shakeMag: 0,

    stats: {
      kills: 0,
      bossKills: 0,
      merges: 0,
      mythicsSummoned: 0
    }
  };

  // Layout Geometry (recomputed on resize)
  const geom = {
    w: 480,
    h: 640,
    trackRect: { x: 36, y: 40, w: 408, h: 520 },
    myGridRects: [],
    allyGridRects: []
  };

  function resizeCanvas() {
    const wrap = document.getElementById('arenaWrap');
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    geom.w = Math.max(320, rect.width);
    geom.h = Math.max(340, rect.height);
    canvas.width = geom.w * dpr;
    canvas.height = geom.h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    computeLayout();
  }

  function computeLayout() {
    const w = geom.w;
    const h = geom.h;

    // Exact normalized coordinates matching lucky_map_fitted.png (tight crop)
    const leftRoadX = w * 0.072;
    const rightRoadX = w * 0.925;
    const topRoadY = h * 0.167;
    const midRoadY = h * 0.510;
    const botRoadY = h * 0.840;

    geom.trackRect = {
      x: leftRoadX,
      y: topRoadY,
      w: rightRoadX - leftRoadX,
      h: botRoadY - topRoadY,
      leftX: leftRoadX,
      rightX: rightRoadX,
      topY: topRoadY,
      midY: midRoadY,
      botY: botRoadY
    };

    geom.myGridRects = [];
    geom.allyGridRects = [];

    const cols = 6;
    const rows = 3;
    // Full grass island horizontal span (0.136 .. 0.870 -> fills the island edge-to-edge!)
    const islandLeft = w * 0.136;
    const islandW = w * 0.734;
    const cellW = islandW / cols;

    // Top Grass Island full surface: y = 0.218 .. 0.394
    const topIslandY = h * 0.218;
    const topIslandH = h * 0.176;
    const topCellH = topIslandH / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        geom.allyGridRects.push({
          x: islandLeft + c * cellW,
          y: topIslandY + r * topCellH,
          w: cellW,
          h: topCellH,
          cx: islandLeft + (c + 0.5) * cellW,
          cy: topIslandY + (r + 0.48) * topCellH
        });
      }
    }

    // Bottom Grass Island full surface (shifted up so top & bottom margins are symmetric!): y = 0.542 .. 0.718
    const botIslandY = h * 0.542;
    const botIslandH = h * 0.176;
    const botCellH = botIslandH / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        geom.myGridRects.push({
          x: islandLeft + c * cellW,
          y: botIslandY + r * botCellH,
          w: cellW,
          h: botCellH,
          cx: islandLeft + (c + 0.5) * cellW,
          cy: botIslandY + (r + 0.48) * botCellH
        });
      }
    }
  }

  // Convert enemy progress (0..8 figure-8 loop) to (x,y) so enemies ALWAYS pass through the shared middle lane!
  function getTrackPoint(progress) {
    const { leftX, rightX, topY, midY, botY } = geom.trackRect;
    const p = ((progress % 8) + 8) % 8;
    const seg = Math.floor(p);
    const t = p - seg;

    switch (seg) {
      case 0: // Top road: left -> right
        return { x: leftX + (rightX - leftX) * t, y: topY, dir: 1 };
      case 1: // Right upper road: top -> middle
        return { x: rightX, y: topY + (midY - topY) * t, dir: -1 };
      case 2: // SHARED MIDDLE LANE: right -> left (Both players attack together!)
        return { x: rightX - (rightX - leftX) * t, y: midY, dir: -1 };
      case 3: // Left lower road: middle -> bottom
        return { x: leftX, y: midY + (botY - midY) * t, dir: 1 };
      case 4: // Bottom road: left -> right
        return { x: leftX + (rightX - leftX) * t, y: botY, dir: 1 };
      case 5: // Right lower road: bottom -> middle
        return { x: rightX, y: botY - (botY - midY) * t, dir: -1 };
      case 6: // SHARED MIDDLE LANE: right -> left (Both players attack together!)
        return { x: rightX - (rightX - leftX) * t, y: midY, dir: -1 };
      default: // Left upper road: middle -> top
        return { x: leftX, y: midY - (midY - topY) * t, dir: 1 };
    }
  }

  // Compute Unit Effective Damage & Attack Speed (including Shiny, Relics, Gym Badges, Gengar aura & upgrades)
  function getUnitStats(slotUnit, slotIdx, isAlly = false) {
    const meta = window.UNIT_BY_ID[slotUnit.id];
    if (!meta) return { dmg: 10, rate: 1, range: 120 };

    let dmgMul = 1;
    if (meta.stage <= 2) {
      dmgMul = 1 + (state.upgrades.basic - 1) * 0.25;
    } else {
      dmgMul = 1 + (state.upgrades.stage3 - 1) * 0.35;
    }

    if (!isAlly) {
      // Champion Crest Relic (+8%/Lv)
      dmgMul *= (1 + getRelicLvl('champ_crest') * 0.08);
      // Gym Badges
      if (state.badges.has('volcano')) dmgMul *= 1.25;
      if (state.badges.has('boulder') && (meta.type === 'rock' || meta.type === 'steel' || meta.type === 'ground')) dmgMul *= 1.40;
      if (state.badges.has('thunder') && meta.type === 'electric') dmgMul *= 1.35;
    }

    // Shiny Pokemon Bonus (1.5x DMG & 1.25x Attack Speed!)
    const shinyDmg = slotUnit.isShiny ? 1.5 : 1.0;
    const shinySpd = slotUnit.isShiny ? 0.25 : 0;

    // Check Gengar line (92, 93, 94) or Mewtwo (150) attack speed aura on same board
    const board = isAlly ? state.allySlots : state.mySlots;
    const rects = isAlly ? geom.allyGridRects : geom.myGridRects;
    const myRect = rects[slotIdx];
    let speedBonus = shinySpd + (!isAlly && state.badges.has('cascade') ? 0.18 : 0);

    if (myRect) {
      board.forEach((other, idx) => {
        if (!other || idx === slotIdx) return;
        const oRect = rects[idx];
        if (!oRect) return;
        const dist = Math.hypot(myRect.cx - oRect.cx, myRect.cy - oRect.cy);
        if (dist <= 135) {
          if (other.id === 92) speedBonus = Math.max(speedBonus, 0.12 + shinySpd);
          else if (other.id === 93) speedBonus = Math.max(speedBonus, 0.24 + shinySpd);
          else if (other.id === 94) speedBonus = Math.max(speedBonus, 0.42 + shinySpd);
          else if (other.id === 150) speedBonus = Math.max(speedBonus, 0.50 + shinySpd);
        }
      });
    }

    const stackCount = slotUnit.count || 1;
    const allyPenalty = (isAlly && state.mode !== 'coop_p2p') ? 0.55 : 1.0;
    return {
      dmg: Math.max(1, Math.round(meta.dmg * dmgMul * shinyDmg * stackCount * allyPenalty)),
      rate: +(meta.rate * (1 + speedBonus)).toFixed(2),
      range: meta.range + 22
    };
  }

  function rollShiny(bonusChance = 0) {
    const chance = 0.05 + getRelicLvl('shiny_charm') * 0.015 + bonusChance;
    return Math.random() < chance;
  }

  // Initialize / Reset Game
  function startGame(mode = 'solo') {
    const stg = (window.POKE_DATA.stages || []).find(s => s.id === saveData.selectedStage) || window.POKE_DATA.stages[0];
    state.currentStage = stg;
    state.mode = mode;
    state.running = true;
    state.wave = 1;
    state.maxWaves = stg.maxWaves || 30;
    state.waveTimer = 20;
    state.spawnQueue = 18;
    state.spawnCooldown = 0.4;
    state.enemyLimit = stg.enemyLimit || 100;

    const fundLvl = getRelicLvl('starter_fund');
    state.gold = 160 + fundLvl * 25;
    state.gems = 4 + (fundLvl >= 3 ? 1 : 0);
    state.summonDiscount = 0;
    state.summonCost = 20;
    state.summonCount = 0;
    state.bountyCooldown = 0;
    state.completedMissions = new Set();
    state.badges = new Set();
    state.bountyBossKilled = false;

    state.upgrades = { basic: 1, stage3: 1, luck: 1 };
    state.mySlots = new Array(18).fill(null);
    state.allySlots = new Array(18).fill(null);
    state.allyGold = 160;
    state.selectedSlot = -1;

    state.enemies = [];
    state.projectiles = [];
    state.effects = [];
    state.floatTexts = [];
    state.banners = [];
    state.pings = [];
    state.stats = { kills: 0, bossKills: 0, merges: 0, mythicsSummoned: 0 };

    document.getElementById('lobbyOverlay').classList.remove('active');
    document.getElementById('coopModal').classList.remove('active');
    document.getElementById('resultModal').classList.remove('active');
    document.getElementById('badgeModal').classList.remove('active');
    document.getElementById('modeBadge').textContent =
      `${stg.icon} STAGE ${stg.id}`;

    resizeCanvas();
    window.sfx.startBGM();
    addBanner(`${stg.icon} ${stg.name} 시작!`, `${stg.sub}`, '#facc15');
    updateHud();
  }

  // Banner Announcement
  function addBanner(title, sub, color = '#facc15') {
    state.banners.push({ title, sub, color, life: 2.6, maxLife: 2.6 });
  }

  function addFloatText(x, y, text, color = '#fff', size = 13) {
    state.floatTexts.push({ x, y, text, color, size, life: 1.0, maxLife: 1.0 });
  }

  // Roll Summon Stage based on Luck Upgrade
  function rollSummonStage() {
    const luckLvl = state.upgrades.luck;
    const stage3Chance = Math.min(0.12, 0.01 + (luckLvl - 1) * 0.015);
    const stage2Chance = Math.min(0.38, 0.08 + (luckLvl - 1) * 0.04);
    const r = Math.random();
    if (r < stage3Chance) return 3;
    if (r < stage3Chance + stage2Chance) return 2;
    return 1;
  }

  // Summon a unit onto Player Board (with Lucky Defense style 1~3 squad stacking!)
  function summonPokemon() {
    if (!state.running) return;
    if (state.gold < state.summonCost) {
      window.sfx.playFail();
      addFloatText(geom.w / 2, geom.h / 2, '골드가 부족합니다!', '#ef4444', 14);
      return;
    }

    const stage = rollSummonStage();
    const pool = window.STAGE_POOLS[stage];
    const picked = pool[Math.floor(Math.random() * pool.length)];

    // First check if an existing slot already has this exact Pokemon with count < 3 (for stage 1~2)
    let stackSlot = -1;
    if (stage < 3) {
      stackSlot = state.mySlots.findIndex(s => s && s.id === picked.id && (s.count || 1) < 3);
    }

    const emptyIndices = [];
    state.mySlots.forEach((s, idx) => { if (!s) emptyIndices.push(idx); });

    if (stackSlot === -1 && emptyIndices.length === 0) {
      window.sfx.playFail();
      addFloatText(geom.w / 2, geom.h / 2, '섬에 자리가 가득 찼습니다! (3합성 필요)', '#ef4444', 14);
      return;
    }

    state.gold -= state.summonCost;
    state.summonCount++;
    state.summonCost = Math.max(10, 20 + Math.floor(state.summonCount * 2.5) - (state.summonDiscount || 0));

    const shiny = rollShiny();
    let targetSlot = stackSlot;
    if (targetSlot !== -1) {
      state.mySlots[targetSlot].count = (state.mySlots[targetSlot].count || 1) + 1;
      state.mySlots[targetSlot].spawnAnim = 1.0;
      if (shiny) state.mySlots[targetSlot].isShiny = true;
    } else {
      targetSlot = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      state.mySlots[targetSlot] = {
        id: picked.id,
        count: 1,
        isShiny: shiny,
        cooldown: 0.1,
        spawnAnim: 1.0
      };
    }

    const rect = geom.myGridRects[targetSlot];
    if (rect) {
      spawnEffect(shiny ? 'evolve_ring' : 'summon', rect.cx, rect.cy, shiny ? '#fde047' : picked.color);
      const curCount = state.mySlots[targetSlot].count || 1;
      if (shiny) {
        addFloatText(rect.cx, rect.cy - 22, `✨ 이로치 등장! ${picked.name} (1.5배!)`, '#fde047', 15);
        addBanner(`✨ 대박! 이로치 [${picked.name}] 소환!`, '이로치 포켓몬은 공격력 1.5배 · 공속 1.25배!', '#fde047');
        window.sfx.playMythic();
      } else if (stage >= 2) {
        addFloatText(rect.cx, rect.cy - 18, `✨ ${stage}단 대박! ${picked.name}`, '#fde047', 14);
        window.sfx.playEvolve();
      } else {
        addFloatText(rect.cx, rect.cy - 14, curCount > 1 ? `${picked.name} x${curCount}` : picked.name, '#ffffff', 12);
        window.sfx.playSummon();
      }
    }

    state.selectedSlot = targetSlot;
    sendCoopSync();
    updateHud();
  }

  // Count how many of a given unit ID exist on a board (including stacked squad count)
  function countUnitOnBoard(board, unitId) {
    let c = 0;
    board.forEach(u => { if (u && u.id === unitId) c += (u.count || 1); });
    return c;
  }

  // Merge 3 identical units of `slotIndex` into a random next-stage Pokemon (Lucky Defense B-plan)
  function mergeThreeAtSlot(slotIndex, isAlly = false) {
    const board = isAlly ? state.allySlots : state.mySlots;
    const rects = isAlly ? geom.allyGridRects : geom.myGridRects;
    const target = board[slotIndex];
    if (!target) return false;

    const meta = window.UNIT_BY_ID[target.id];
    if (!meta || meta.stage >= 3) return false; // Stage 3 combines via Mythic recipes

    const totalCount = countUnitOnBoard(board, target.id);
    if (totalCount < 3) return false;

    const hadShiny = !!target.isShiny;
    // Deduct 3 units starting from target slot, then other slots if needed
    let needed = 3;
    const targetCount = target.count || 1;
    if (targetCount >= 3) {
      needed = 0;
      board[slotIndex] = null;
    } else {
      needed -= targetCount;
      board[slotIndex] = null;
      for (let idx = 0; idx < board.length && needed > 0; idx++) {
        const u = board[idx];
        if (u && u.id === target.id) {
          const c = u.count || 1;
          const r = rects[idx];
          if (r) spawnEffect('merge_burst', r.cx, r.cy, meta.color);
          if (c <= needed) {
            needed -= c;
            board[idx] = null;
          } else {
            u.count = c - needed;
            needed = 0;
          }
        }
      }
    }

    // Evolve into a random Pokemon of (meta.stage + 1)
    const nextStage = meta.stage + 1;
    const nextPool = window.STAGE_POOLS[nextStage];
    const evolved = nextPool[Math.floor(Math.random() * nextPool.length)];
    const shinyEvo = !isAlly && rollShiny(hadShiny ? 0.45 : 0.02);

    // Try stacking if stage 2 already exists with count < 3, otherwise place in slotIndex
    board[slotIndex] = {
      id: evolved.id,
      count: 1,
      isShiny: shinyEvo,
      cooldown: 0.1,
      spawnAnim: 1.0
    };

    const destRect = rects[slotIndex];
    if (destRect) {
      spawnEffect('evolve_ring', destRect.cx, destRect.cy, shinyEvo ? '#fde047' : evolved.color);
      addFloatText(
        destRect.cx,
        destRect.cy - 20,
        shinyEvo ? `✨ 이로치 진화! ${evolved.name}` : `🧬 ${nextStage}단 진화! ${evolved.name}`,
        '#fde047',
        14
      );
    }

    if (!isAlly) {
      state.stats.merges++;
      window.sfx.playEvolve();
      sendCoopSync();
      updateHud();
    }
    return true;
  }

  // Merge ALL available 3-of-a-kind on Player Board
  function mergeAllAvailable() {
    if (!state.running) return;
    let mergedCount = 0;
    let changed = true;

    while (changed) {
      changed = false;
      for (let i = 0; i < state.mySlots.length; i++) {
        const u = state.mySlots[i];
        if (!u) continue;
        const meta = window.UNIT_BY_ID[u.id];
        if (meta && meta.stage < 3 && countUnitOnBoard(state.mySlots, u.id) >= 3) {
          mergeThreeAtSlot(i, false);
          mergedCount++;
          changed = true;
          break;
        }
      }
    }

    if (mergedCount === 0) {
      window.sfx.playFail();
      addFloatText(geom.w / 2, geom.h / 2, '같은 포켓몬 3마리가 모인 슬롯이 없습니다!', '#94a3b8', 13);
    } else {
      addBanner(`${mergedCount}회 연속 진화 성공!`, '3마리 합성으로 상위 단계 포켓몬이 탄생했습니다!', '#c084fc');
    }
    updateHud();
  }

  // Check if a Mythic recipe is ready on a board
  function isMythicReady(board, mythicMeta) {
    return mythicMeta.recipe.every(reqId => countUnitOnBoard(board, reqId) >= 1);
  }

  // Summon Stage 4 Mythic / Legendary via ORD Recipe!
  function summonMythicRecipe(mythicId, isAlly = false) {
    const board = isAlly ? state.allySlots : state.mySlots;
    const rects = isAlly ? geom.allyGridRects : geom.myGridRects;
    const mythicMeta = window.POKE_DATA.mythics.find(m => m.id === mythicId);
    if (!mythicMeta || !isMythicReady(board, mythicMeta)) return false;

    // Consume 1 of each recipe material
    let summonSlot = -1;
    mythicMeta.recipe.forEach((reqId, idx) => {
      const foundIdx = board.findIndex(u => u && u.id === reqId);
      if (foundIdx !== -1) {
        if (idx === 0) summonSlot = foundIdx;
        const r = rects[foundIdx];
        if (r) spawnEffect('evolve_ring', r.cx, r.cy, mythicMeta.color);
        board[foundIdx] = null;
      }
    });

    if (summonSlot === -1) summonSlot = board.findIndex(u => !u);
    if (summonSlot === -1) summonSlot = 0;

    board[summonSlot] = {
      id: mythicMeta.id,
      cooldown: 0.1,
      spawnAnim: 1.3
    };

    const destRect = rects[summonSlot];
    if (destRect) {
      spawnEffect('mythic_pillar', destRect.cx, destRect.cy, mythicMeta.color);
      addFloatText(destRect.cx, destRect.cy - 26, `⚡ [${mythicMeta.grade}] ${mythicMeta.name} 강림!!`, '#fde047', 16);
    }

    state.shakeTime = 0.45;
    state.shakeMag = 6;
    window.sfx.playMythic();
    addBanner(
      `⚡ [${mythicMeta.grade}] ${mythicMeta.name} 강림!`,
      `${mythicMeta.skillName} — 전장을 지배합니다!`,
      mythicMeta.color
    );

    if (!isAlly) {
      state.stats.mythicsSummoned++;
      state.selectedSlot = summonSlot;
      sendCoopSync();
      updateHud();
    }
    return true;
  }

  // Gamble with Gems
  function gamblePokemon(targetStage, gemCost, successChance) {
    if (!state.running) return;
    const emptyIndices = [];
    state.mySlots.forEach((s, idx) => { if (!s) emptyIndices.push(idx); });
    if (emptyIndices.length === 0) {
      window.sfx.playFail();
      addFloatText(geom.w / 2, geom.h / 2, '빈 슬롯이 없습니다!', '#ef4444', 13);
      return;
    }
    if (state.gems < gemCost) {
      window.sfx.playFail();
      addFloatText(geom.w / 2, geom.h / 2, '보석이 부족합니다! (보스 처치/피카츄 채굴)', '#38bdf8', 13);
      return;
    }

    state.gems -= gemCost;
    const bonusLuck = getRelicLvl('lucky_charm') * 0.03 + (state.badges.has('jeweler') ? 0.12 : 0);
    const ok = Math.random() < Math.min(0.95, successChance + bonusLuck);
    const slot = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    const rect = geom.myGridRects[slot];

    if (ok) {
      const pool = window.STAGE_POOLS[targetStage];
      const picked = pool[Math.floor(Math.random() * pool.length)];
      const shiny = rollShiny(0.05);
      state.mySlots[slot] = { id: picked.id, count: 1, isShiny: shiny, cooldown: 0.1, spawnAnim: 1.1 };
      window.sfx.playEvolve();
      if (rect) {
        spawnEffect('evolve_ring', rect.cx, rect.cy, shiny ? '#fde047' : picked.color);
        addFloatText(rect.cx, rect.cy - 20, `🎰 도박 성공! ${shiny ? '✨이로치 ' : ''}[${targetStage}단] ${picked.name}`, '#fde047', 15);
      }
    } else {
      window.sfx.playFail();
      // Consolation: 15 Gold refund
      state.gold += 15;
      if (rect) {
        spawnEffect('merge_burst', rect.cx, rect.cy, '#64748b');
        addFloatText(rect.cx, rect.cy - 16, `💦 도박 실패... (+15G 위로금)`, '#94a3b8', 13);
      }
    }
    sendCoopSync();
    updateHud();
  }

  // Spawn Bounty Boss
  function callBountyBoss() {
    if (!state.running || state.bountyCooldown > 0) return;
    state.bountyCooldown = 25;
    const bossMeta = window.POKE_DATA.bossPool[(state.wave + 2) % window.POKE_DATA.bossPool.length];
    const baseHp = Math.round((420 + Math.pow(state.wave, 1.85) * 95) * 6.5);

    state.enemies.push({
      id: bossMeta.id,
      name: `[현상금] ${bossMeta.name}`,
      hp: baseHp,
      maxHp: baseHp,
      spd: 0.35 * bossMeta.spd,
      progress: 0,
      isBoss: true,
      isBounty: true,
      armorBreak: 0,
      slowTimer: 0,
      slowFactor: 1,
      stunTimer: 0,
      poisonTimer: 0,
      poisonDmg: 0,
      burnTimer: 0,
      burnDmg: 0,
      scale: 1.35
    });

    window.sfx.playBossAlert();
    addBanner(`🎯 현상금 보스 [${bossMeta.name}] 출현!`, '처치 시 💎+2 보석 & 💰+100G 즉시 획득!', '#f43f5e');
    updateHud();
  }

  // Spawn Wave Enemy or Wave Boss (with Stage Region Modifiers & Double Boss!)
  function spawnWaveEnemy(isWaveBoss = false) {
    const w = state.wave;
    const stg = state.currentStage || window.POKE_DATA.stages[0];
    const baseHp = Math.round((280 + Math.pow(w, 1.95) * 115) * (stg.hpMult || 1));
    const spdMul = stg.spdMult || 1;
    const baseArmor = stg.baseArmor || 0;

    if (isWaveBoss) {
      const bossCount = stg.doubleBoss ? 2 : 1;
      for (let b = 0; b < bossCount; b++) {
        const bossMeta = window.POKE_DATA.bossPool[(Math.floor(w / 10 - 1) + b) % window.POKE_DATA.bossPool.length] || window.POKE_DATA.bossPool[0];
        const hp = Math.round(baseHp * bossMeta.hpMul * 1.45 * (bossCount > 1 ? 0.78 : 1));
        state.enemies.push({
          id: bossMeta.id,
          name: `[WAVE ${w} 보스] ${bossMeta.name}`,
          hp,
          maxHp: hp,
          spd: 0.38 * bossMeta.spd * spdMul,
          progress: b === 1 ? 4.0 : 0.0,
          isBoss: true,
          isBounty: false,
          baseArmor,
          armorBreak: 0,
          slowTimer: 0,
          slowFactor: 1,
          stunTimer: 0,
          poisonTimer: 0,
          poisonDmg: 0,
          burnTimer: 0,
          burnDmg: 0,
          scale: 1.5
        });
      }
      window.sfx.playBossAlert();
      const firstBoss = window.POKE_DATA.bossPool[Math.floor((w / 10 - 1)) % window.POKE_DATA.bossPool.length] || window.POKE_DATA.bossPool[0];
      addBanner(
        stg.doubleBoss ? `🚨 WAVE ${w} 더블 보스 출현!` : `🚨 WAVE ${w} 보스 [${firstBoss.name}] 등장!`,
        firstBoss.title,
        '#ef4444'
      );
    } else {
      const eMeta = window.POKE_DATA.enemyPool[(w + state.spawnQueue) % window.POKE_DATA.enemyPool.length];
      const hp = Math.round(baseHp * eMeta.hpMul * 1.35);
      // Alternate spawning between Top Entrance (0) and Bottom Player Entrance (4.0) so player island always gets direct action!
      const startProg = (state.spawnQueue % 2 === 1) ? 4.0 : 0.0;
      state.enemies.push({
        id: eMeta.id,
        name: eMeta.name,
        hp,
        maxHp: hp,
        spd: 0.54 * eMeta.spd * spdMul,
        progress: startProg,
        isBoss: false,
        isBounty: false,
        baseArmor,
        armorBreak: 0,
        slowTimer: 0,
        slowFactor: 1,
        stunTimer: 0,
        poisonTimer: 0,
        poisonDmg: 0,
        burnTimer: 0,
        burnDmg: 0,
        scale: eMeta.scale
      });
    }
  }

  // Visual Effects Helper
  function spawnEffect(type, x, y, color = '#fde047', radius = 38, extra = null) {
    const dur = type === 'mythic_pillar' ? 0.9 : (type === 'thunder_bolt' || type === 'hydro_beam' ? 0.28 : 0.45);
    state.effects.push({
      type,
      x,
      y,
      color,
      radius,
      extra,
      life: dur,
      maxLife: dur
    });
  }

  function makeLightningPath(x1, y1, x2, y2, segs = 6) {
    const pts = [{ x: x1, y: y1 }];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      const jit = (Math.random() - 0.5) * Math.min(26, len * 0.22);
      pts.push({ x: x1 + dx * t + nx * jit, y: y1 + dy * t + ny * jit });
    }
    pts.push({ x: x2, y: y2 });
    return pts;
  }

  function getAttackStyle(meta) {
    const fam = meta.familyId;
    if (fam === 'pikachu_line' || fam === 'ampharos_line') return 'electric';
    if (fam === 'fire_starter' || meta.id === 250) return 'fire';
    if (fam === 'water_starter' || meta.id === 382) return 'water';
    if (fam === 'grass_starter') return 'grass';
    if (fam === 'alakazam_line' || meta.id === 150) return 'psychic';
    if (fam === 'gengar_line') return 'ghost';
    if (fam === 'dragonite_line' || fam === 'salamence_line' || meta.id === 384) return 'dragon';
    if (fam === 'metagross_line') return 'steel';
    if (fam === 'tyranitar_line' || fam === 'garchomp_line' || meta.id === 383) return 'earth';
    if (meta.id === 493) return 'judgment';
    return 'energy';
  }

  // Execute Unit Attack & Family/Mythic Signature Skills
  function fireUnitAttack(slotUnit, slotIdx, isAlly) {
    const rects = isAlly ? geom.allyGridRects : geom.myGridRects;
    const rect = rects[slotIdx];
    if (!rect || state.enemies.length === 0) return false;

    const meta = window.UNIT_BY_ID[slotUnit.id];
    const stats = getUnitStats(slotUnit, slotIdx, isAlly);

    // Find best enemy in range (prioritize bosses, then highest progress)
    let target = null;
    let bestScore = -1;

    for (const en of state.enemies) {
      const pos = getTrackPoint(en.progress);
      const d = Math.hypot(pos.x - rect.cx, pos.y - rect.cy);
      if (d <= stats.range * 1.15) {
        const score = (en.isBoss ? 1000 : 0) + en.progress;
        if (score > bestScore) {
          bestScore = score;
          target = { en, pos };
        }
      }
    }

    if (!target) return false;

    // Trigger dynamic attack lunge, jump & facing on unit
    const adx = target.pos.x - rect.cx;
    const ady = target.pos.y - rect.cy;
    const adist = Math.hypot(adx, ady) || 1;
    slotUnit.attackAnim = 0.28;
    slotUnit.lungeX = (adx / adist) * 11;
    slotUnit.lungeY = (ady / adist) * 11;
    slotUnit.faceRight = adx > 0;

    const atkStyle = getAttackStyle(meta);
    const startX = rect.cx + (adx / adist) * 10;
    const startY = rect.cy - 10 + (ady / adist) * 10;

    // Instant Beam / Strike styles (Electric, Psychic, Judgment, stage 3+ Water Hydro Pump)
    if (atkStyle === 'electric') {
      const boltPts = makeLightningPath(startX, startY, target.pos.x, target.pos.y, 6);
      spawnEffect('thunder_bolt', target.pos.x, target.pos.y, meta.color || '#facc15', meta.stage * 14, {
        pts: boltPts,
        stage: meta.stage
      });
      applyHit({
        x: startX, y: startY, tx: target.pos.x, ty: target.pos.y,
        targetEnemy: target.en, unitId: slotUnit.id, meta, dmg: stats.dmg,
        color: meta.color || '#facc15', isAlly, atkStyle
      });
      return true;
    }

    if (atkStyle === 'psychic') {
      spawnEffect('psy_beam', target.pos.x, target.pos.y, meta.color || '#ec4899', 26 + meta.stage * 10, {
        x1: startX, y1: startY, x2: target.pos.x, y2: target.pos.y, stage: meta.stage
      });
      applyHit({
        x: startX, y: startY, tx: target.pos.x, ty: target.pos.y,
        targetEnemy: target.en, unitId: slotUnit.id, meta, dmg: stats.dmg,
        color: meta.color || '#ec4899', isAlly, atkStyle
      });
      return true;
    }

    if (atkStyle === 'water' && meta.stage >= 3) {
      spawnEffect('hydro_beam', target.pos.x, target.pos.y, '#38bdf8', 32 + meta.stage * 8, {
        x1: startX, y1: startY, x2: target.pos.x, y2: target.pos.y, stage: meta.stage
      });
      applyHit({
        x: startX, y: startY, tx: target.pos.x, ty: target.pos.y,
        targetEnemy: target.en, unitId: slotUnit.id, meta, dmg: stats.dmg,
        color: '#38bdf8', isAlly, atkStyle
      });
      return true;
    }

    // Trigger styled projectile with trail & rotation
    state.projectiles.push({
      x: startX,
      y: startY,
      startX,
      startY,
      tx: target.pos.x,
      ty: target.pos.y,
      targetEnemy: target.en,
      unitId: slotUnit.id,
      meta,
      atkStyle,
      dmg: stats.dmg,
      color: meta.color || '#fde047',
      speed: atkStyle === 'grass' ? 540 : atkStyle === 'dragon' ? 560 : 490,
      rot: Math.atan2(ady, adx),
      trail: [],
      isAlly
    });

    return true;
  }

  // Apply Projectile Hit & Family Special Effects
  function applyHit(proj) {
    const en = proj.targetEnemy;
    const meta = proj.meta;
    let dmg = proj.dmg;

    // Family-specific & Mythic mechanics
    const fam = meta.familyId;
    const stage = meta.stage;

    // 1. Grass starter (Bulbasaur/Ivysaur/Venusaur): Armor break + Poison DoT
    if (fam === 'grass_starter') {
      const shred = stage === 1 ? 0.12 : stage === 2 ? 0.25 : 0.45;
      en.armorBreak = Math.max(en.armorBreak, shred);
      en.poisonTimer = 3.5;
      en.poisonDmg = Math.max(en.poisonDmg, dmg * 0.35);
      if (stage === 3) {
        damageArea(proj.tx, proj.ty, 65, dmg * 0.6, '#22c55e', e => {
          e.armorBreak = Math.max(e.armorBreak, 0.45);
        });
      }
    }
    // 2. Fire starter (Charmander/Charmeleon/Charizard): Splash + Burn
    else if (fam === 'fire_starter') {
      const splashR = stage === 1 ? 42 : stage === 2 ? 62 : 90;
      damageArea(proj.tx, proj.ty, splashR, dmg * 0.65, '#ef4444', e => {
        e.burnTimer = 3.0;
        e.burnDmg = Math.max(e.burnDmg, dmg * 0.3);
      });
    }
    // 3. Water starter (Squirtle/Wartortle/Blastoise): Slow + Splash
    else if (fam === 'water_starter') {
      const slow = stage === 1 ? 0.75 : stage === 2 ? 0.60 : 0.40;
      damageArea(proj.tx, proj.ty, stage * 28, dmg * 0.5, '#3b82f6', e => {
        e.slowTimer = 2.8;
        e.slowFactor = Math.min(e.slowFactor, slow);
      });
    }
    // 4. Pikachu Bandit line (Pichu/Pikachu/Raichu): Gold & Gem Mining on hit!
    else if (fam === 'pikachu_line' && !proj.isAlly) {
      const goldChance = stage === 1 ? 0.14 : stage === 2 ? 0.20 : 0.28;
      const goldAmt = stage === 1 ? 5 : stage === 2 ? 12 : 25;
      if (Math.random() < goldChance) {
        state.gold += goldAmt;
        window.sfx.playCoin();
        addFloatText(proj.tx, proj.ty - 14, `+${goldAmt}G ⚡채굴`, '#fde047', 12);
      }
      if (stage >= 2 && Math.random() < (stage === 2 ? 0.02 : 0.04)) {
        state.gems += 1;
        addFloatText(proj.tx, proj.ty - 26, `+1💎 행운보석!`, '#38bdf8', 13);
      }
    }
    // 6. Alakazam Psychic Boss Slayer
    else if (fam === 'alakazam_line') {
      if (en.isBoss) {
        dmg *= stage === 1 ? 1.25 : stage === 2 ? 1.55 : 2.1;
        if (stage === 3) dmg += Math.min(2500, en.maxHp * 0.015);
      }
      spawnEffect('psy_ring', proj.tx, proj.ty, '#ec4899', 36);
    }
    // 7. Ampharos Chain Lightning & Stun
    else if (fam === 'ampharos_line') {
      const chains = stage === 1 ? 3 : stage === 2 ? 4 : 6;
      const stunChance = stage === 1 ? 0.15 : stage === 2 ? 0.25 : 0.38;
      const chainPts = [{ x: proj.tx, y: proj.ty }];
      let count = 0;
      for (const other of state.enemies) {
        if (count >= chains) break;
        const op = getTrackPoint(other.progress);
        if (Math.hypot(op.x - proj.tx, op.y - proj.ty) <= 130) {
          dealDamageToEnemy(other, dmg * 0.65);
          if (Math.random() < stunChance) other.stunTimer = Math.max(other.stunTimer, stage === 3 ? 1.1 : 0.7);
          chainPts.push({ x: op.x, y: op.y });
          count++;
        }
      }
      if (chainPts.length > 1) {
        spawnEffect('chain_lightning', proj.tx, proj.ty, '#facc15', 0, chainPts);
      }
    }
    // 8. Dragonite Hyper Beam & Draco Meteor
    else if (fam === 'dragonite_line') {
      if (stage >= 2) {
        damageArea(proj.tx, proj.ty, stage === 3 ? 95 : 58, dmg * 0.75, '#f97316');
      }
    }
    // 9. Tyranitar Rock Slide Stun + Armor Break
    else if (fam === 'tyranitar_line') {
      damageArea(proj.tx, proj.ty, stage * 28, dmg * 0.55, '#84cc16', e => {
        e.armorBreak = Math.max(e.armorBreak, stage * 0.13);
        if (Math.random() < stage * 0.11) e.stunTimer = Math.max(e.stunTimer, 0.85);
      });
    }
    // 10. Salamence Critical Strike Bomber
    else if (fam === 'salamence_line') {
      const critChance = stage === 1 ? 0.25 : stage === 2 ? 0.38 : 0.50;
      const critMul = stage === 1 ? 2.0 : stage === 2 ? 2.4 : 3.0;
      if (Math.random() < critChance) {
        dmg *= critMul;
        addFloatText(proj.tx, proj.ty - 14, `💥CRIT! ${Math.round(dmg)}`, '#06b6d4', 12);
      }
    }
    // 11. Metagross Comet Punch Boss + Stun
    else if (fam === 'metagross_line') {
      if (en.isBoss) dmg *= (1 + stage * 0.28);
      if (stage >= 2 && Math.random() < 0.25) {
        damageArea(proj.tx, proj.ty, 65, dmg * 0.5, '#60a5fa', e => {
          e.stunTimer = Math.max(e.stunTimer, 0.75);
        });
      }
    }
    // 12. Garchomp Earthquake Shockwave
    else if (fam === 'garchomp_line') {
      damageArea(proj.tx, proj.ty, stage * 34, dmg * 0.65, '#f43f5e', e => {
        e.slowTimer = 1.5;
        e.slowFactor = Math.min(e.slowFactor, 0.7);
      });
    }
    // Stage 4 Mythics / Legendaries
    else if (meta.isMythic) {
      if (meta.id === 384) {
        // Rayquaza: Emerald Dragon Ascent massive AoE + 60% armor shred
        damageArea(proj.tx, proj.ty, 125, dmg * 0.85, '#10b981', e => {
          e.armorBreak = Math.max(e.armorBreak, 0.60);
        });
      } else if (meta.id === 150) {
        // Mewtwo: Psystrike boss shred + gold chance
        if (en.isBoss) dmg += Math.min(4000, en.maxHp * 0.025);
        damageArea(proj.tx, proj.ty, 105, dmg * 0.75, '#c084fc');
        if (!proj.isAlly && Math.random() < 0.22) state.gold += 20;
      } else if (meta.id === 493) {
        // Arceus: Judgment omni-debuff
        damageArea(proj.tx, proj.ty, 135, dmg * 0.9, '#fef08a', e => {
          e.armorBreak = Math.max(e.armorBreak, 0.65);
          e.slowTimer = 3.0;
          e.slowFactor = 0.45;
          if (Math.random() < 0.35) e.stunTimer = Math.max(e.stunTimer, 0.9);
        });
      } else if (meta.id === 250) {
        // Ho-Oh: Sacred Fire stun + burn
        damageArea(proj.tx, proj.ty, 115, dmg * 0.8, '#fb923c', e => {
          e.burnTimer = 4.0;
          e.burnDmg = dmg * 0.45;
          if (Math.random() < 0.3) e.stunTimer = Math.max(e.stunTimer, 0.8);
        });
      } else if (meta.id === 382) {
        // Kyogre: Origin Pulse mega freeze slow
        damageArea(proj.tx, proj.ty, 120, dmg * 0.8, '#38bdf8', e => {
          e.slowTimer = 3.5;
          e.slowFactor = 0.28;
        });
      } else if (meta.id === 383) {
        // Groudon: Precipice Blades magma armor crush
        damageArea(proj.tx, proj.ty, 120, dmg * 0.85, '#f87171', e => {
          e.armorBreak = Math.max(e.armorBreak, 0.55);
        });
      }
    }

    dealDamageToEnemy(en, dmg);
    window.sfx.playHit();
  }

  function damageArea(x, y, radius, dmg, color, callback = null) {
    spawnEffect('explosion', x, y, color, radius);
    for (const en of state.enemies) {
      const pos = getTrackPoint(en.progress);
      if (Math.hypot(pos.x - x, pos.y - y) <= radius) {
        dealDamageToEnemy(en, dmg);
        if (callback) callback(en);
      }
    }
  }

  function dealDamageToEnemy(en, rawDmg) {
    if (!en || en.hp <= 0) return;
    const rainbowBonus = state.badges.has('rainbow') && en.armorBreak > 0 ? 0.20 : 0;
    const bossBadgeBonus = state.badges.has('marsh') && en.isBoss ? 1.35 : 1.0;
    const netArmor = Math.max(-0.5, (en.armorBreak || 0) + rainbowBonus - (en.baseArmor || 0));
    const mult = Math.max(0.25, 1 + netArmor);
    const finalDmg = Math.max(1, Math.round(rawDmg * mult * bossBadgeBonus));
    en.hp -= finalDmg;
    en.hitFlash = 0.11;
  }

  // Smart AI Partner Logic (active in solo & coop_ai so top island always fights alongside you on the shared middle lane!)
  function updateAiPartner(dt) {
    if (state.mode === 'coop_p2p') return;
    state.aiActionTimer -= dt;
    if (state.aiActionTimer > 0) return;
    state.aiActionTimer = 3.6;

    // 1. Check if AI can summon a Mythic Recipe!
    for (const m of window.POKE_DATA.mythics) {
      if (isMythicReady(state.allySlots, m)) {
        summonMythicRecipe(m.id, true);
        sendEmojiPing('⚡', true);
        return;
      }
    }

    // 2. Check if AI can merge 3 identical units
    for (let i = 0; i < state.allySlots.length; i++) {
      const u = state.allySlots[i];
      if (!u) continue;
      const meta = window.UNIT_BY_ID[u.id];
      if (meta && meta.stage < 3 && countUnitOnBoard(state.allySlots, u.id) >= 3) {
        mergeThreeAtSlot(i, true);
        return;
      }
    }

    // 3. Summon a unit (or stack up to 3) if AI has gold
    if (state.allyGold >= 25) {
      const stage = Math.random() < 0.14 ? 2 : 1;
      const pool = window.STAGE_POOLS[stage];
      const picked = pool[Math.floor(Math.random() * pool.length)];
      let stackSlot = -1;
      if (stage < 3) {
        stackSlot = state.allySlots.findIndex(s => s && s.id === picked.id && (s.count || 1) < 3);
      }
      const empty = [];
      state.allySlots.forEach((s, idx) => { if (!s) empty.push(idx); });

      if (stackSlot !== -1) {
        state.allyGold -= 25;
        state.allySlots[stackSlot].count = (state.allySlots[stackSlot].count || 1) + 1;
        state.allySlots[stackSlot].spawnAnim = 1.0;
      } else if (empty.length > 0) {
        state.allyGold -= 25;
        const slot = empty[Math.floor(Math.random() * empty.length)];
        state.allySlots[slot] = { id: picked.id, count: 1, cooldown: 0.1, spawnAnim: 1.0 };
        const r = geom.allyGridRects[slot];
        if (r) spawnEffect('summon', r.cx, r.cy, picked.color);
      }
    }
  }

  // Main Simulation Step
  function updateGame(rawDt) {
    if (!state.running || document.hidden) return;
    const dt = Math.min(0.1, rawDt) * state.speed;

    if (state.shakeTime > 0) state.shakeTime -= rawDt;
    if (state.bountyCooldown > 0) state.bountyCooldown = Math.max(0, state.bountyCooldown - dt);

    // Wave Timer & Spawning
    if (state.spawnQueue > 0) {
      state.spawnCooldown -= dt;
      if (state.spawnCooldown <= 0) {
        spawnWaveEnemy(false);
        state.spawnQueue--;
        state.spawnCooldown = 0.25;
      }
    }

    state.waveTimer -= dt;
    if (state.waveTimer <= 0) {
      if (state.wave >= state.maxWaves && state.enemies.length === 0) {
        finishGame(true);
        return;
      }
      state.wave++;
      state.waveTimer = 22;
      state.spawnQueue = 28 + Math.min(28, Math.floor(state.wave * 0.75));

      // Safe Box Relic Compound Interest!
      const safeLvl = getRelicLvl('safe_box');
      const interest = safeLvl > 0 ? Math.floor(state.gold * (safeLvl * 0.02)) : 0;
      const baseWaveGold = 30 + state.wave * 2;
      state.gold += baseWaveGold + interest;
      state.allyGold += 28 + state.wave * 2;
      if (interest > 0) {
        addFloatText(geom.w / 2, geom.h * 0.72, `💰금고 복리이자 +${interest}G!`, '#fde047', 14);
      }

      if (state.wave % 10 === 0) {
        spawnWaveEnemy(true);
        state.gems += 2;
      } else {
        addBanner(
          `WAVE ${state.wave}`,
          interest > 0 ? `웨이브 보상 +${baseWaveGold}G (금고이자 +${interest}G!)` : `몬스터 웨이브가 몰려옵니다! (+${baseWaveGold}G)`,
          '#38bdf8'
        );
      }
      updateHud();
    }

    // Update AI Partner if Co-op AI mode
    updateAiPartner(dt);

    // Update Player Units & Partner Units
    const updateBoardUnits = (board, isAlly) => {
      board.forEach((u, idx) => {
        if (!u) return;
        if (u.spawnAnim > 0) u.spawnAnim = Math.max(0, u.spawnAnim - dt * 2.5);
        if (u.attackAnim > 0) u.attackAnim = Math.max(0, u.attackAnim - rawDt * 4.5);
        u.animPhase = (u.animPhase || (idx * 1.7)) + rawDt * 9.5;
        u.cooldown -= dt;
        if (u.cooldown <= 0) {
          const stats = getUnitStats(u, idx, isAlly);
          const fired = fireUnitAttack(u, idx, isAlly);
          u.cooldown = fired ? (1 / stats.rate) : 0.15;
        }
      });
    };
    updateBoardUnits(state.mySlots, false);
    updateBoardUnits(state.allySlots, true);

    // Update Projectiles
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const p = state.projectiles[i];
      if (p.targetEnemy && p.targetEnemy.hp > 0) {
        const tpos = getTrackPoint(p.targetEnemy.progress);
        p.tx = tpos.x;
        p.ty = tpos.y;
      }
      if (p.trail) {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 5) p.trail.shift();
      }
      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const dist = Math.hypot(dx, dy);
      p.rot = (p.rot || 0) + dt * 15;
      const step = p.speed * dt;
      if (dist <= step + 8) {
        // Spawn signature impact effect by attack style
        if (p.atkStyle === 'fire') spawnEffect('fire_pillar', p.tx, p.ty, '#f97316', 22 + p.meta.stage * 10);
        else if (p.atkStyle === 'grass') spawnEffect('leaf_burst', p.tx, p.ty, '#4ade80', 20 + p.meta.stage * 8);
        else if (p.atkStyle === 'ghost') spawnEffect('ghost_claw', p.tx, p.ty, '#c084fc', 24 + p.meta.stage * 8);
        else if (p.atkStyle === 'dragon') spawnEffect('dragon_slash', p.tx, p.ty, '#38bdf8', 28 + p.meta.stage * 10);
        else if (p.atkStyle === 'steel' || p.atkStyle === 'earth') spawnEffect('quake_impact', p.tx, p.ty, p.color, 24 + p.meta.stage * 9);
        else if (p.atkStyle === 'water') spawnEffect('water_splash', p.tx, p.ty, '#38bdf8', 22 + p.meta.stage * 8);
        applyHit(p);
        state.projectiles.splice(i, 1);
      } else {
        p.x += (dx / dist) * step;
        p.y += (dy / dist) * step;
      }
    }

    // Update Enemies
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const en = state.enemies[i];

      // Poison / Burn DoTs
      if (en.poisonTimer > 0) {
        en.poisonTimer -= dt;
        en.hp -= en.poisonDmg * dt;
      }
      if (en.burnTimer > 0) {
        en.burnTimer -= dt;
        en.hp -= en.burnDmg * dt;
      }

      if (en.hp <= 0) {
        const pos = getTrackPoint(en.progress);
        spawnEffect('explosion', pos.x, pos.y, en.isBoss ? '#fde047' : '#94a3b8', en.isBoss ? 55 : 24);
        state.stats.kills++;
        if (en.isBoss) {
          state.stats.bossKills++;
          if (en.isBounty) state.bountyBossKilled = true;
          const gemReward = en.isBounty ? 2 : 3;
          const goldReward = en.isBounty ? 100 : 150;
          state.gems += gemReward;
          state.gold += goldReward;
          window.sfx.playEvolve();
          addFloatText(pos.x, pos.y - 16, `👑 보스 처치! +${goldReward}G +${gemReward}💎`, '#fde047', 15);
          if (!en.isBounty) {
            triggerGymBadgeModal();
          }
        } else {
          const g = 4 + Math.floor(state.wave * 0.25);
          state.gold += g;
          state.allyGold += g;
        }
        state.enemies.splice(i, 1);
        updateHud();
        continue;
      }

      // Movement along track & walk animation cycle
      if (en.hitFlash > 0) en.hitFlash = Math.max(0, en.hitFlash - rawDt);
      if (en.stunTimer > 0) {
        en.stunTimer -= dt;
      } else {
        let spdMul = 1;
        if (en.slowTimer > 0) {
          en.slowTimer -= dt;
          spdMul = en.slowFactor;
        } else {
          en.slowFactor = 1;
        }
        en.progress += en.spd * spdMul * dt;
        en.walkPhase = (en.walkPhase || 0) + rawDt * 11 * spdMul;
      }
    }

    // Check Enemy Saturation Game Over
    if (state.enemies.length >= state.enemyLimit) {
      finishGame(false);
      return;
    }

    // Update Effects, Floating Text, Banners, Pings
    for (let i = state.effects.length - 1; i >= 0; i--) {
      state.effects[i].life -= rawDt;
      if (state.effects[i].life <= 0) state.effects.splice(i, 1);
    }
    for (let i = state.floatTexts.length - 1; i >= 0; i--) {
      state.floatTexts[i].life -= rawDt;
      state.floatTexts[i].y -= 24 * rawDt;
      if (state.floatTexts[i].life <= 0) state.floatTexts.splice(i, 1);
    }
    for (let i = state.banners.length - 1; i >= 0; i--) {
      state.banners[i].life -= rawDt;
      if (state.banners[i].life <= 0) state.banners.splice(i, 1);
    }
    for (let i = state.pings.length - 1; i >= 0; i--) {
      state.pings[i].life -= rawDt;
      if (state.pings[i].life <= 0) state.pings.splice(i, 1);
    }
  }

  function finishGame(victory) {
    state.running = false;
    const stg = state.currentStage || window.POKE_DATA.stages[0];
    const earnedMedals = victory
      ? (stg.medalReward || 100) + Math.floor(state.wave * 2)
      : Math.max(10, Math.floor(state.wave * 1.5));
    saveData.medals = (saveData.medals || 0) + earnedMedals;
    if (victory && !saveData.clearedStages.includes(stg.id)) {
      saveData.clearedStages.push(stg.id);
    }
    saveProgress();
    renderLobbyStages();

    const modal = document.getElementById('resultModal');
    document.getElementById('resultTitle').textContent = victory
      ? `🏆 ${stg.icon} ${stg.name} 정복 완료!`
      : '💀 방어선 포화 패배...';
    document.getElementById('resultSummary').textContent = victory
      ? `${stg.maxWaves}웨이브의 모든 보스를 물리치고 🏅+${earnedMedals} 메달을 획득했습니다!`
      : `트랙 위 몬스터 수가 한도(${state.enemyLimit}마리)를 초과했습니다. (위로금 🏅+${earnedMedals} 메달 획득)`;
    document.getElementById('resultStats').innerHTML = `
      <div>도전 지역: <b>${stg.name}</b></div>
      <div>도달 웨이브: <b>WAVE ${state.wave} / ${stg.maxWaves}</b></div>
      <div>처치한 적: <b>${state.stats.kills}마리</b></div>
      <div>보스 처치: <b>${state.stats.bossKills}회</b></div>
      <div>신화 강림: <b>${state.stats.mythicsSummoned}회</b></div>
      <div>획득 메달: <b style="color:#c2410c">+🏅 ${earnedMedals}</b></div>
    `;
    const btnNext = document.getElementById('btnDefNextStage');
    if (btnNext) {
      if (victory && stg.id < window.POKE_DATA.stages.length) {
        btnNext.classList.remove('hidden');
        btnNext.textContent = `⚔️ STAGE ${stg.id + 1} 즉시 출격하기!`;
      } else {
        btnNext.classList.add('hidden');
      }
    }
    modal.classList.add('active');
  }

  // ================= RENDER PIPELINE =================
  function renderGame() {
    ctx.save();
    if (state.shakeTime > 0) {
      const dx = (Math.random() - 0.5) * state.shakeMag * 2;
      const dy = (Math.random() - 0.5) * state.shakeMag * 2;
      ctx.translate(dx, dy);
    }

    // 1. Draw Vibrant Lucky Defense Forest & Grass Islands Map (No dark overlay or artificial boxes!)
    if (bgImg.complete && bgImg.naturalWidth > 0) {
      ctx.drawImage(bgImg, 0, 0, geom.w, geom.h);
    } else {
      ctx.fillStyle = '#4d7c2b';
      ctx.fillRect(0, 0, geom.w, geom.h);
    }

    // 2. Draw Partner Island Units (Top Grass Island) & My Island Units (Bottom Grass Island)
    drawBoardSlots(geom.allyGridRects, state.allySlots, true);
    drawBoardSlots(geom.myGridRects, state.mySlots, false);

    // 4. Draw Enemies along Track
    state.enemies.forEach(en => {
      const pos = getTrackPoint(en.progress);
      const r = (en.isBoss ? 32 : 22) * (en.scale || 1);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y + r * 0.65, r * 0.75, r * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();

      // Status Aura
      if (en.stunTimer > 0) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.strokeRect(pos.x - r, pos.y - r, r * 2, r * 2);
      } else if (en.slowTimer > 0) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      const phase = en.walkPhase || 0;
      const hopY = en.stunTimer > 0 ? 0 : Math.abs(Math.sin(phase * 1.1)) * (en.isBoss ? 5.5 : 4.2);
      const tilt = en.stunTimer > 0 ? 0 : Math.sin(phase * 1.1) * 0.13;
      const squash = en.hitFlash > 0 ? 0.16 : Math.sin(phase * 2.2) * 0.06;
      const flipX = pos.dir > 0; // Gen 5 sprites face left by default, so flip when moving right

      drawAnimatedSprite(
        en.id,
        pos.x,
        pos.y - hopY,
        r * 2.2,
        phase,
        flipX,
        tilt,
        squash,
        en.hitFlash > 0
      );

      // HP Bar
      const bw = en.isBoss ? 54 : 30;
      const bh = en.isBoss ? 6 : 4;
      const bx = pos.x - bw / 2;
      const by = pos.y - r - 7;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
      const ratio = Math.max(0, Math.min(1, en.hp / en.maxHp));
      ctx.fillStyle = en.isBoss ? '#f43f5e' : (ratio > 0.4 ? '#22c55e' : '#eab308');
      ctx.fillRect(bx, by, bw * ratio, bh);

      if (en.armorBreak > 0) {
        ctx.fillStyle = '#c084fc';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️↓', pos.x, by - 2);
      }
    });

    // 5. Draw Styled Signature Projectiles (No more plain generic dots!)
    state.projectiles.forEach(p => {
      ctx.save();
      const sz = (p.meta.stage >= 3 ? 10 : p.meta.stage === 2 ? 8 : 6.5);
      const ang = Math.atan2(p.ty - p.y, p.tx - p.x);

      // Motion ribbon trail
      if (p.trail && p.trail.length > 1) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = sz * 0.7;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.38;
        ctx.beginPath();
        p.trail.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.translate(p.x, p.y);

      if (p.atkStyle === 'grass') {
        // Spinning Crescent Razor Leaf Blade
        ctx.rotate(p.rot * 1.6);
        ctx.fillStyle = '#4ade80';
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(sz * 1.5, 0);
        ctx.quadraticCurveTo(0, -sz * 1.1, -sz * 1.4, 0);
        ctx.quadraticCurveTo(0, sz * 0.45, sz * 1.5, 0);
        ctx.fill();
        ctx.stroke();
      } else if (p.atkStyle === 'fire') {
        // Blazing Fireball with White-Hot Core & Flame Tail
        ctx.rotate(ang);
        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, sz * 1.6);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#fde047');
        grad.addColorStop(0.8, '#ef4444');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(sz * 1.3, 0);
        ctx.quadraticCurveTo(0, -sz * 1.2, -sz * 2.2, 0);
        ctx.quadraticCurveTo(0, sz * 1.2, sz * 1.3, 0);
        ctx.fill();
      } else if (p.atkStyle === 'water') {
        // High-Pressure Aqua Spear / Bubble Vortex
        ctx.rotate(ang);
        ctx.fillStyle = '#e0f2fe';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(0, 0, sz * 1.35, sz * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (p.atkStyle === 'ghost') {
        // Swirling Dark Shadow Vortex
        ctx.rotate(p.rot);
        ctx.fillStyle = '#1e1b4b';
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const r = k % 2 === 0 ? sz * 1.35 : sz * 0.65;
          const a = (k * Math.PI) / 3;
          if (k === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (p.atkStyle === 'dragon') {
        // Crescent Dragon Claw / Air Slash Wave
        ctx.rotate(ang);
        ctx.strokeStyle = p.meta.id === 384 ? '#10b981' : '#38bdf8';
        ctx.fillStyle = '#fef08a';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(-sz * 0.3, 0, sz * 1.3, -1.1, 1.1);
        ctx.stroke();
      } else if (p.atkStyle === 'steel' || p.atkStyle === 'earth') {
        // Spinning Jagged Boulder / Steel Cross Fist
        ctx.rotate(p.rot);
        ctx.fillStyle = p.atkStyle === 'steel' ? '#93c5fd' : '#a8a29e';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let k = 0; k < 8; k++) {
          const r = k % 2 === 0 ? sz * 1.3 : sz * 0.75;
          const a = (k * Math.PI) / 4;
          if (k === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Golden Star / Judgment Orb
        ctx.rotate(p.rot);
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, sz, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    });

    // 6. Draw Visual Effects (Lightning Bolts, Hydro Beams, Fire Pillars, Ghost Claws, Dragon Slashes)
    state.effects.forEach(ef => {
      const t = 1 - ef.life / ef.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t);

      if (ef.type === 'thunder_bolt' && ef.extra && ef.extra.pts) {
        // Direct Jagged Lightning Bolt + Sky Strike
        ctx.strokeStyle = '#facc15';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 14;
        ctx.lineWidth = ef.extra.stage >= 3 ? 5 : 3.2;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ef.extra.pts.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Impact electric ring
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, 12 + t * 22, 0, Math.PI * 2);
        ctx.stroke();
      } else if (ef.type === 'hydro_beam' && ef.extra) {
        // High-Pressure Hydro Cannon Stream
        ctx.strokeStyle = '#0284c7';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.lineWidth = (ef.extra.stage >= 4 ? 18 : 12) * (1 - t * 0.5);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ef.extra.x1, ef.extra.y1);
        ctx.lineTo(ef.extra.x2, ef.extra.y2);
        ctx.stroke();

        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 5 * (1 - t * 0.5);
        ctx.stroke();

        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, ef.radius * (0.3 + t * 0.7), 0, Math.PI * 2);
        ctx.stroke();
      } else if (ef.type === 'psy_beam' && ef.extra) {
        // Psychic Distortion Ray + Hexagonal Prism Ring
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = 4 * (1 - t * 0.5);
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(ef.extra.x1, ef.extra.y1);
        ctx.lineTo(ef.extra.x2, ef.extra.y2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI) / 3 + t * 2;
          const r = ef.radius * (1 - t * 0.35);
          if (k === 0) ctx.moveTo(ef.x + Math.cos(a) * r, ef.y + Math.sin(a) * r);
          else ctx.lineTo(ef.x + Math.cos(a) * r, ef.y + Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.stroke();
      } else if (ef.type === 'fire_pillar') {
        const grad = ctx.createRadialGradient(ef.x, ef.y, 2, ef.x, ef.y, ef.radius * (0.4 + t * 0.6));
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.45, '#fde047');
        grad.addColorStop(0.85, '#ef4444');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ef.x, ef.y - t * 12, ef.radius * (0.4 + t * 0.6), 0, Math.PI * 2);
        ctx.fill();
      } else if (ef.type === 'ghost_claw') {
        // X-Shaped Shadow Claw Slash
        ctx.strokeStyle = '#c084fc';
        ctx.shadowColor = '#9333ea';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 3.5;
        const r = ef.radius * 0.75;
        ctx.beginPath();
        ctx.moveTo(ef.x - r, ef.y - r);
        ctx.lineTo(ef.x + r, ef.y + r);
        ctx.moveTo(ef.x + r, ef.y - r);
        ctx.lineTo(ef.x - r, ef.y + r);
        ctx.stroke();
      } else if (ef.type === 'dragon_slash' || ef.type === 'leaf_burst' || ef.type === 'water_splash' || ef.type === 'quake_impact') {
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, ef.radius * (0.35 + t * 0.65), 0, Math.PI * 2);
        ctx.stroke();
        for (let k = 0; k < 5; k++) {
          const a = (Math.PI * 2 * k) / 5 + t * 3;
          const d = ef.radius * t * 0.9;
          ctx.fillStyle = ef.color;
          ctx.beginPath();
          ctx.arc(ef.x + Math.cos(a) * d, ef.y + Math.sin(a) * d, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (ef.type === 'explosion' || ef.type === 'evolve_ring' || ef.type === 'psy_ring') {
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = ef.type === 'evolve_ring' ? 4 : 2.5;
        ctx.beginPath();
        ctx.arc(ef.x, ef.y, ef.radius * (0.3 + t * 0.7), 0, Math.PI * 2);
        ctx.stroke();
      } else if (ef.type === 'summon' || ef.type === 'merge_burst') {
        ctx.fillStyle = ef.color;
        for (let i = 0; i < 6; i++) {
          const ang = (Math.PI * 2 * i) / 6 + t * 2;
          const dist = t * 26;
          ctx.fillRect(ef.x + Math.cos(ang) * dist - 3, ef.y + Math.sin(ang) * dist - 3, 6, 6);
        }
      } else if (ef.type === 'mythic_pillar') {
        const grad = ctx.createLinearGradient(ef.x, 0, ef.x, ef.y);
        grad.addColorStop(0, 'rgba(250, 204, 21, 0)');
        grad.addColorStop(1, ef.color);
        ctx.fillStyle = grad;
        const pw = 46 * (1 - t * 0.5);
        ctx.fillRect(ef.x - pw / 2, 0, pw, ef.y + 15);
      } else if (ef.type === 'chain_lightning' && ef.extra) {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ef.extra.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      }
      ctx.restore();
    });

    // 7. Draw Dragging Unit Ghost
    if (state.isDragging && state.dragSlot >= 0 && state.mySlots[state.dragSlot]) {
      const u = state.mySlots[state.dragSlot];
      const spr = getImg(`./assets/sprites/${u.id}.png`);
      if (spr.complete) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.drawImage(spr, state.dragPos.x - 28, state.dragPos.y - 28, 56, 56);
        ctx.restore();
      }
    }

    // 8. Draw Floating Texts
    state.floatTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.font = `900 ${ft.size}px "Noto Sans KR", sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // 9. Draw Emoji Pings
    state.pings.forEach(pg => {
      ctx.save();
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pg.emo, pg.x, pg.y - (1 - pg.life) * 20);
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#fde047';
      ctx.fillText(pg.sender, pg.x, pg.y + 14 - (1 - pg.life) * 20);
      ctx.restore();
    });

    // 10. Draw Center Wave / Mythic Banner
    if (state.banners.length > 0) {
      const b = state.banners[0];
      ctx.save();
      ctx.fillStyle = 'rgba(9, 13, 24, 0.88)';
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      const bw = Math.min(geom.w - 30, 360);
      const bx = (geom.w - bw) / 2;
      const by = geom.h * 0.14;
      ctx.fillRect(bx, by, bw, 52);
      ctx.strokeRect(bx, by, bw, 52);

      ctx.textAlign = 'center';
      ctx.fillStyle = b.color;
      ctx.font = '900 15px "Noto Sans KR", sans-serif';
      ctx.fillText(b.title, geom.w / 2, by + 23);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '700 11px "Noto Sans KR", sans-serif';
      ctx.fillText(b.sub, geom.w / 2, by + 41);
      ctx.restore();
    }

    ctx.restore();
  }

  function drawBoardSlots(rects, board, isAlly) {
    const auraColors = {
      1: 'rgba(255, 255, 255, 0.75)',
      2: 'rgba(192, 132, 252, 0.85)',
      3: 'rgba(239, 68, 68, 0.88)',
      4: 'rgba(250, 204, 21, 0.95)'
    };
    const auraFill = {
      1: 'rgba(255, 255, 255, 0.22)',
      2: 'rgba(168, 85, 247, 0.32)',
      3: 'rgba(239, 68, 68, 0.35)',
      4: 'rgba(250, 204, 21, 0.42)'
    };

    // Draw range circle for selected player unit
    if (!isAlly && state.selectedSlot >= 0 && board[state.selectedSlot]) {
      const selRect = rects[state.selectedSlot];
      const stats = getUnitStats(board[state.selectedSlot], state.selectedSlot, false);
      if (selRect) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(selRect.cx, selRect.cy, stats.range, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    rects.forEach((r, idx) => {
      const unit = board[idx];

      // Only show subtle landing dots while actively dragging a unit
      if (!unit) {
        if (!isAlly && state.isDragging) {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.beginPath();
          ctx.ellipse(r.cx, r.cy + 6, r.w * 0.22, r.h * 0.12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        return;
      }

      const meta = window.UNIT_BY_ID[unit.id];
      const totalCount = countUnitOnBoard(board, unit.id);
      const canMerge3 = meta.stage < 3 && totalCount >= 3;
      const stackCount = unit.count || 1;

      ctx.save();
      const atkRatio = Math.sin(((unit.attackAnim || 0) / 0.28) * Math.PI);
      const lx = (unit.lungeX || 0) * atkRatio;
      const ly = (unit.lungeY || 0) * atkRatio - atkRatio * 7; // Dynamic attack hop!
      const atkTilt = atkRatio * (unit.faceRight ? 0.22 : -0.22);
      const uPhase = unit.animPhase || 0;
      const idleSquash = Math.sin(uPhase * 0.6) * 0.045 + atkRatio * 0.16;

      // Determine squad sub-positions anchored strictly inside the slot cell on the grass!
      let offsets = [{ dx: 0, dy: 0 }];
      if (stackCount === 2) {
        offsets = [
          { dx: -r.w * 0.18, dy: -2 },
          { dx: r.w * 0.18, dy: 3 }
        ];
      } else if (stackCount >= 3) {
        offsets = [
          { dx: 0, dy: -6 },
          { dx: -r.w * 0.21, dy: 4 },
          { dx: r.w * 0.21, dy: 4 }
        ];
      }

      const scale = 1 + (unit.spawnAnim || 0) * 0.35;
      const unitScale = meta.stage === 4 ? 1.48 : meta.stage === 3 ? 1.28 : stackCount > 1 ? 0.96 : 1.15;
      const baseSize = Math.max(42, Math.min(r.w * 0.86, r.h * 1.22)) * unitScale * scale;

      // Foot-anchored rendering: (ux, uy) is the exact ground foot position on the grass island!
      offsets.forEach((off, mIdx) => {
        const ux = r.cx + off.dx + lx;
        const uy = r.cy + off.dy + ly;
        const auraW = baseSize * 0.34;
        const auraH = baseSize * 0.14;

        ctx.fillStyle = auraFill[meta.stage] || auraFill[1];
        ctx.strokeStyle = canMerge3 ? '#fde047' : (auraColors[meta.stage] || auraColors[1]);
        ctx.lineWidth = canMerge3 || (!isAlly && state.selectedSlot === idx) ? 2.6 : 1.8;
        ctx.beginPath();
        ctx.ellipse(ux, uy + 2, auraW, auraH, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw sprite standing ON TOP of the foot aura (shifted up by 0.22 * baseSize)
        drawAnimatedSprite(
          unit.id,
          ux,
          uy - baseSize * 0.22,
          baseSize,
          uPhase + mIdx * 1.3,
          !!unit.faceRight,
          atkTilt,
          idleSquash,
          atkRatio > 0.55,
          !!unit.isShiny
        );
      });

      // Shiny Sparkle Badge
      if (unit.isShiny) {
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨', r.cx + r.w * 0.28, r.cy - baseSize * 0.48);
      }

      // Small clean cooldown / mana bar right under the foot aura
      const barW = 22;
      const barH = 3;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(r.cx - barW / 2, r.cy + 7, barW, barH);
      ctx.fillStyle = meta.stage >= 3 ? '#facc15' : '#38bdf8';
      const cdPct = Math.max(0.15, Math.min(1, 1 - (unit.cooldown || 0)));
      ctx.fillRect(r.cx - barW / 2, r.cy + 7, barW * cdPct, barH);

      // 3-Merge Ready Floating Pill ("합성⬆")
      if (canMerge3 && !isAlly) {
        const py = r.cy - baseSize * 0.62 + Math.sin(uPhase * 0.8) * 2;
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.fillRect(r.cx - 17, py - 7, 34, 13);
        ctx.strokeRect(r.cx - 17, py - 7, 34, 13);
        ctx.fillStyle = '#000';
        ctx.font = '900 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('합성⬆', r.cx, py + 3);
      }

      ctx.restore();
    });
  }

  // ================= HUD & INSPECTOR UPDATES =================
  function updateHud() {
    document.getElementById('waveText').textContent = `WAVE ${state.wave}`;
    const sec = Math.max(0, Math.ceil(state.waveTimer));
    document.getElementById('waveTimer').textContent = `00:${String(sec).padStart(2, '0')}`;

    const eCount = state.enemies.length;
    document.getElementById('enemyCountText').textContent = `${eCount} / ${state.enemyLimit}`;
    const pct = Math.min(100, (eCount / state.enemyLimit) * 100);
    document.getElementById('enemyGaugeFill').style.width = `${pct}%`;

    document.getElementById('goldText').textContent = state.gold;
    document.getElementById('gemText').textContent = state.gems;

    const unitCount = state.mySlots.filter(Boolean).length;
    document.getElementById('boardCountText').textContent = `${unitCount} / 18`;
    document.getElementById('summonCostText').textContent = `${state.summonCost} G`;

    // Count how many 3-merges are currently possible
    const seenIds = new Set();
    let mergeGroups = 0;
    state.mySlots.forEach(u => {
      if (!u || seenIds.has(u.id)) return;
      seenIds.add(u.id);
      const m = window.UNIT_BY_ID[u.id];
      if (m && m.stage < 3) {
        mergeGroups += Math.floor(countUnitOnBoard(state.mySlots, u.id) / 3);
      }
    });

    const mergeBtn = document.getElementById('btnMergeAll');
    document.getElementById('mergeReadyBadge').textContent = mergeGroups > 0 ? `${mergeGroups}건 가능!` : '3마리합성';
    if (mergeGroups > 0) mergeBtn.classList.add('MergeGlow');
    else mergeBtn.classList.remove('MergeGlow');

    // Bounty button
    const bountyTxt = document.getElementById('bountyTimerText');
    bountyTxt.textContent = state.bountyCooldown > 0
      ? `${Math.ceil(state.bountyCooldown)}s`
      : '+2💎 보스';

    // Upgrades
    const costBasic = 30 + (state.upgrades.basic - 1) * 25;
    const costStage3 = state.upgrades.stage3;
    const costLuck = 50 + (state.upgrades.luck - 1) * 40;
    document.getElementById('lvlBasic').textContent = `Lv.${state.upgrades.basic}`;
    document.getElementById('costBasic').textContent = `🪙 ${costBasic}`;
    document.getElementById('lvlStage3').textContent = `Lv.${state.upgrades.stage3}`;
    document.getElementById('costStage3').textContent = `💎 ${costStage3}`;
    document.getElementById('lvlLuck').textContent = `Lv.${state.upgrades.luck}`;
    document.getElementById('costLuck').textContent = `🪙 ${costLuck}`;

    // Update Mythic Recipe Bar, Missions & Inspector
    checkMissions();
    renderMythicRecipeBar();
    updateInspector();
  }

  // Check & Auto-Reward 8 In-Game Bounty Missions!
  function checkMissions() {
    if (!state.running || !window.POKE_DATA.missions) return;
    const myUnits = state.mySlots.filter(Boolean);
    const stage1Types = new Set();
    let squad3Slots = 0;
    let hasStage3 = false;
    let hasShiny = false;
    let totalPop = 0;

    myUnits.forEach(u => {
      const m = window.UNIT_BY_ID[u.id];
      const cnt = u.count || 1;
      totalPop += cnt;
      if (u.isShiny) hasShiny = true;
      if (m) {
        if (m.stage === 1) stage1Types.add(u.id);
        if (m.stage < 3 && cnt >= 3) squad3Slots++;
        if (m.stage === 3) hasStage3 = true;
      }
    });

    const condMap = {
      m_collector: stage1Types.size >= 6,
      m_squad2: squad3Slots >= 2,
      m_first3: hasStage3,
      m_shiny: hasShiny,
      m_bounty: !!state.bountyBossKilled,
      m_mythic: state.stats.mythicsSummoned >= 1,
      m_rich: state.gold >= 350,
      m_army: totalPop >= 15
    };

    window.POKE_DATA.missions.forEach(ms => {
      if (!state.completedMissions.has(ms.id) && condMap[ms.id]) {
        state.completedMissions.add(ms.id);
        state.gold += ms.gold || 0;
        state.gems += ms.gems || 0;
        window.sfx.playEvolve();
        const rewardStr = [ms.gold ? `+${ms.gold}G` : '', ms.gems ? `+${ms.gems}💎` : ''].filter(Boolean).join(' ');
        addBanner(`🎯 미션 달성! [${ms.title}]`, `${ms.desc} (${rewardStr} 지급!)`, '#facc15');
      }
    });

    const btnTxt = document.getElementById('missionCountBtnTxt');
    if (btnTxt) {
      btnTxt.textContent = `미션 ${state.completedMissions.size}/${window.POKE_DATA.missions.length}`;
    }
  }

  function openMissionModal() {
    const box = document.getElementById('missionListContainer');
    if (box && window.POKE_DATA.missions) {
      box.classList.add('active');
      box.style.display = 'flex';
      box.innerHTML = window.POKE_DATA.missions.map(ms => {
        const done = state.completedMissions.has(ms.id);
        const rewardStr = [ms.gold ? `🪙+${ms.gold}G` : '', ms.gems ? `💎+${ms.gems}` : ''].filter(Boolean).join(' · ');
        return `
          <div class="recipe-card" style="${done ? 'background:#dcfce7;border-color:#16a34a' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div class="recipe-title" style="color:${done ? '#15803d' : '#111827'}">${done ? '✅ [달성완료]' : '🎯 [진행중]'} ${ms.title}</div>
              <span class="medal-pill">${rewardStr}</span>
            </div>
            <div class="recipe-desc">${ms.desc}</div>
          </div>
        `;
      }).join('');
    }
    document.getElementById('missionModal').classList.add('active');
  }

  function openRelicModal() {
    const medalEl = document.getElementById('relicModalMedals');
    if (medalEl) medalEl.textContent = (saveData.medals || 0).toLocaleString();
    const box = document.getElementById('relicListContainer');
    if (box && window.POKE_DATA.relics) {
      box.classList.add('active');
      box.style.display = 'flex';
      box.innerHTML = '';
      window.POKE_DATA.relics.forEach(rel => {
        const lvl = getRelicLvl(rel.id);
        const isMax = lvl >= rel.max;
        const cost = Math.floor(rel.baseCost * Math.pow(1.45, lvl));
        const canBuy = !isMax && (saveData.medals || 0) >= cost;

        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
          <div class="recipe-head">
            <img src="${rel.img}" alt="${rel.name}" />
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span class="recipe-title">${rel.name}</span>
                <span class="medal-pill">Lv.${lvl} / ${rel.max}</span>
              </div>
              <div class="recipe-desc">${rel.desc}</div>
            </div>
          </div>
          <button class="game-3d-btn ${canBuy ? 'blue' : 'slate'} sm" style="width:100%" ${canBuy ? '' : 'disabled'}>
            ${isMax ? '최대 레벨 달성' : `🏅 ${cost} 메달로 강화하기`}
          </button>
        `;
        const btn = card.querySelector('button');
        if (canBuy) {
          btn.onclick = () => {
            saveData.medals -= cost;
            saveData.relics[rel.id] = lvl + 1;
            saveProgress();
            window.sfx.playEvolve();
            openRelicModal();
            renderLobbyStages();
          };
        }
        box.appendChild(card);
      });
    }
    document.getElementById('relicModal').classList.add('active');
  }

  function triggerGymBadgeModal() {
    const pool = (window.POKE_DATA.gymBadges || []).filter(b => !state.badges.has(b.id) || b.id === 'rocket' || b.id === 'jeweler' || b.id === 'evo_stone');
    if (pool.length === 0) return;
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    const box = document.getElementById('badgeChoicesContainer');
    if (!box) return;
    box.classList.add('active');
    box.style.display = 'flex';
    box.innerHTML = '';

    shuffled.forEach(bg => {
      const card = document.createElement('div');
      card.className = 'recipe-card';
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <div class="recipe-head">
          <div style="width:44px;height:44px;background:#fef08a;border:2px solid #111827;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px">${bg.icon}</div>
          <div style="flex:1">
            <div class="recipe-title">▶ ${bg.name}</div>
            <div class="recipe-desc">${bg.desc}</div>
          </div>
        </div>
      `;
      card.onclick = () => {
        state.badges.add(bg.id);
        window.sfx.playMythic();
        if (bg.id === 'rocket') {
          state.gold += 140;
          state.summonDiscount = (state.summonDiscount || 0) + 4;
          state.summonCost = Math.max(10, state.summonCost - 4);
        } else if (bg.id === 'jeweler') {
          state.gems += 4;
        } else if (bg.id === 'evo_stone') {
          const empty = [];
          state.mySlots.forEach((s, i) => { if (!s) empty.push(i); });
          const slot = empty.length > 0 ? empty[Math.floor(Math.random() * empty.length)] : 0;
          const p3 = window.STAGE_POOLS[3];
          const picked = p3[Math.floor(Math.random() * p3.length)];
          state.mySlots[slot] = { id: picked.id, count: 1, isShiny: Math.random() < 0.4, cooldown: 0.1, spawnAnim: 1.2 };
        }
        renderOwnedBadges();
        document.getElementById('badgeModal').classList.remove('active');
        addBanner(`🎖️ [${bg.name}] 획득!`, bg.desc, '#fde047');
        updateHud();
      };
      box.appendChild(card);
    });

    document.getElementById('badgeModal').classList.add('active');
  }

  function renderOwnedBadges() {
    const row = document.getElementById('ownedBadgesRow');
    if (!row) return;
    row.innerHTML = '';
    (window.POKE_DATA.gymBadges || []).forEach(b => {
      if (state.badges.has(b.id)) {
        const el = document.createElement('div');
        el.className = 'owned-badge-icon';
        el.title = `${b.name}: ${b.desc}`;
        el.textContent = b.icon;
        row.appendChild(el);
      }
    });
  }

  function renderLobbyStages() {
    const medalEl = document.getElementById('lobbyMedals');
    if (medalEl) medalEl.textContent = (saveData.medals || 0).toLocaleString();
    const grid = document.getElementById('defStageGrid');
    if (!grid || !window.POKE_DATA.stages) return;
    grid.innerHTML = '';

    window.POKE_DATA.stages.forEach(stg => {
      const isCleared = (saveData.clearedStages || []).includes(stg.id);
      const card = document.createElement('div');
      card.className = `def-stage-card ${stg.id === saveData.selectedStage ? 'selected' : ''}`;
      card.innerHTML = `
        <span style="font-size:10px;font-weight:900;color:${isCleared ? '#15803d' : '#c2410c'}">${isCleared ? '🏆 CLEAR' : `${stg.maxWaves} WAVE`}</span>
        <img src="./assets/sprites/${stg.bossImg}.png" alt="${stg.name}" />
        <div class="def-stage-name">${stg.icon} STAGE ${stg.id}</div>
        <div class="def-stage-sub">${stg.name.replace(/^STAGE \d+\.\s*/, '')}</div>
        <div style="font-size:9.5px;font-weight:900;color:#111827">🏅 +${stg.medalReward}</div>
      `;
      card.onclick = () => {
        saveData.selectedStage = stg.id;
        saveProgress();
        window.sfx.playSummon();
        renderLobbyStages();
      };
      grid.appendChild(card);
    });
  }

  function renderMythicRecipeBar() {
    const container = document.getElementById('mythicButtonsContainer');
    container.innerHTML = '';

    window.POKE_DATA.mythics.forEach(m => {
      const ready = isMythicReady(state.mySlots, m);
      const haveCount = m.recipe.filter(reqId => countUnitOnBoard(state.mySlots, reqId) >= 1).length;
      const btn = document.createElement('button');
      btn.className = `mythic-chip ${ready ? 'ready' : ''}`;
      btn.innerHTML = `
        <img src="./assets/sprites/${m.id}.png" alt="${m.name}" />
        <span>${ready ? `⚡${m.name} 소환!` : `${m.name} (${haveCount}/3)`}</span>
      `;
      btn.onclick = () => {
        if (ready) {
          summonMythicRecipe(m.id, false);
        } else {
          // Open recipe modal if not ready yet
          openCodexModal();
        }
      };
      container.appendChild(btn);
    });
  }

  function updateInspector() {
    const bar = document.getElementById('unitInspector');
    if (state.selectedSlot < 0 || !state.mySlots[state.selectedSlot]) {
      bar.classList.add('hidden');
      return;
    }
    bar.classList.remove('hidden');
    const u = state.mySlots[state.selectedSlot];
    const meta = window.UNIT_BY_ID[u.id];
    const stats = getUnitStats(u, state.selectedSlot, false);
    const count = countUnitOnBoard(state.mySlots, u.id);

    document.getElementById('inspSprite').src = `./assets/sprites/${u.id}.png`;
    document.getElementById('inspStageBadge').textContent = meta.stage === 4 ? meta.grade : `${meta.stage}단`;
    document.getElementById('inspName').textContent = meta.name;
    document.getElementById('inspCountBadge').textContent = meta.stage < 3 ? `보유 ${count}/3` : (meta.stage === 3 ? '신화재료' : '최종신화');
    document.getElementById('inspSkill').textContent = `${meta.skillName} · 공격력 ${stats.dmg} · 공속 ${stats.rate}`;

    const mergeBtn = document.getElementById('btnMergeSelected');
    if (meta.stage < 3 && count >= 3) {
      mergeBtn.disabled = false;
      mergeBtn.textContent = '🔼 3마리 합성 진화!';
    } else if (meta.stage >= 3) {
      mergeBtn.disabled = true;
      mergeBtn.textContent = '⚡ 상단 신화강림 조합';
    } else {
      mergeBtn.disabled = true;
      mergeBtn.textContent = `3마리 필요 (${count}/3)`;
    }
  }

  // ================= POINTER / TOUCH DRAG & TAP ON CANVAS =================
  function getSlotAtPoint(x, y) {
    for (let i = 0; i < geom.myGridRects.length; i++) {
      const r = geom.myGridRects[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        return i;
      }
    }
    return -1;
  }

  let lastTapSlot = -1;
  let lastTapTime = 0;

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const slot = getSlotAtPoint(x, y);

    if (slot >= 0) {
      const now = performance.now();
      // Double tap on a 3-ready unit merges immediately!
      if (slot === lastTapSlot && now - lastTapTime < 350 && state.mySlots[slot]) {
        if (mergeThreeAtSlot(slot, false)) {
          lastTapSlot = -1;
          return;
        }
      }
      lastTapSlot = slot;
      lastTapTime = now;

      state.selectedSlot = slot;
      if (state.mySlots[slot]) {
        state.dragSlot = slot;
        state.dragPos = { x, y };
        state.isDragging = true;
      }
      updateHud();
    } else {
      state.selectedSlot = -1;
      updateInspector();
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!state.isDragging) return;
    const rect = canvas.getBoundingClientRect();
    state.dragPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  });

  window.addEventListener('pointerup', (e) => {
    if (!state.isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dropSlot = getSlotAtPoint(x, y);

    if (dropSlot >= 0 && dropSlot !== state.dragSlot) {
      const srcUnit = state.mySlots[state.dragSlot];
      const dstUnit = state.mySlots[dropSlot];

      // If dropping onto same unit and 3 exist on board, merge!
      if (srcUnit && dstUnit && srcUnit.id === dstUnit.id && countUnitOnBoard(state.mySlots, srcUnit.id) >= 3) {
        mergeThreeAtSlot(dropSlot, false);
      } else {
        // Swap positions
        state.mySlots[dropSlot] = srcUnit;
        state.mySlots[state.dragSlot] = dstUnit;
        state.selectedSlot = dropSlot;
        window.sfx.playSummon();
      }
      updateHud();
    }

    state.isDragging = false;
    state.dragSlot = -1;
  });

  // ================= CO-OP WEBRTC (PeerJS) & EMOJI PINGS =================
  let peer = null;
  let conn = null;

  function createCoopRoom() {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    document.getElementById('myRoomCode').textContent = code;
    const statusEl = document.getElementById('coopStatusText');

    if (typeof Peer === 'undefined') {
      statusEl.textContent = '방 코드 생성 완료! 파트너 대기 중 (또는 아래 AI 협동 즉시 시작)';
      return;
    }

    if (peer) peer.destroy();
    const peerId = `poke-lucky-def-${code}`;
    peer = new Peer(peerId);

    statusEl.textContent = `방 코드 [${code}] 생성됨! 친구 입장 대기 중...`;

    peer.on('connection', (c) => {
      conn = c;
      setupConnHandlers();
      state.allyName = '파트너 트레이너';
      statusEl.textContent = '파트너 연결 성공! 게임을 시작합니다!';
      setTimeout(() => startGame('coop_p2p'), 500);
    });

    peer.on('error', () => {
      statusEl.textContent = `코드 [${code}] 활성화됨 (오프라인 시 AI 파트너 협동 가능)`;
    });
  }

  function joinCoopRoom() {
    const code = document.getElementById('joinCodeInput').value.trim();
    const statusEl = document.getElementById('coopStatusText');
    if (code.length !== 4) {
      statusEl.textContent = '4자리 숫자 방 코드를 입력해주세요!';
      return;
    }

    if (typeof Peer === 'undefined') {
      startGame('coop_ai');
      return;
    }

    if (peer) peer.destroy();
    peer = new Peer();
    statusEl.textContent = `[${code}] 방에 연결 중...`;

    peer.on('open', () => {
      conn = peer.connect(`poke-lucky-def-${code}`);
      setupConnHandlers();
      setTimeout(() => {
        if (!state.running) {
          statusEl.textContent = '원격 응답 지연 — 스마트 AI 파트너와 즉시 협동을 시작합니다!';
          setTimeout(() => startGame('coop_ai'), 700);
        }
      }, 3500);
    });
  }

  function setupConnHandlers() {
    if (!conn) return;
    conn.on('open', () => {
      state.allyName = '2P 파트너';
      startGame('coop_p2p');
    });
    conn.on('data', (data) => {
      if (!data) return;
      if (data.type === 'sync_board' && Array.isArray(data.slots)) {
        state.allySlots = data.slots;
      } else if (data.type === 'ping') {
        sendEmojiPing(data.emo, true);
      }
    });
  }

  function sendCoopSync() {
    if (conn && conn.open) {
      conn.send({ type: 'sync_board', slots: state.mySlots });
    }
  }

  function sendEmojiPing(emo, fromAlly = false) {
    const x = fromAlly ? geom.w * 0.35 : geom.w * 0.65;
    const y = fromAlly ? geom.h * 0.25 : geom.h * 0.65;
    state.pings.push({
      emo,
      sender: fromAlly ? state.allyName : '나',
      x,
      y,
      life: 1.5
    });
    window.sfx.playCoin();

    if (!fromAlly) {
      if (conn && conn.open) conn.send({ type: 'ping', emo });
      if (state.mode === 'coop_ai') {
        setTimeout(() => {
          const replies = ['👍', '🔥', '⚡'];
          sendEmojiPing(replies[Math.floor(Math.random() * replies.length)], true);
        }, 650);
      }
    }
  }

  // ================= CODEX / RECIPE MODAL RENDERER =================
  function populateCodex() {
    const mythicTab = document.getElementById('tabMythic');
    mythicTab.innerHTML = window.POKE_DATA.mythics.map(m => {
      const matsHtml = m.recipe.map((id, i) => `
        <span class="mat-item">
          <img src="./assets/sprites/${id}.png" alt="" />
          ${m.recipeNames[i]}
        </span>
      `).join('<span>+</span>');

      return `
        <div class="recipe-card">
          <div class="recipe-head">
            <img src="./assets/sprites/${m.id}.png" alt="${m.name}" />
            <div>
              <div class="recipe-title">[${m.grade}] ${m.name} — ${m.skillName}</div>
              <div class="recipe-desc">${m.desc}</div>
            </div>
          </div>
          <div class="recipe-mats">${matsHtml}</div>
        </div>
      `;
    }).join('');

    const famTab = document.getElementById('tabFamilies');
    famTab.innerHTML = window.POKE_DATA.families.map(f => {
      const stHtml = f.stages.map(s => `
        <span class="mat-item">
          <img src="./assets/sprites/${s.id}.png" alt="${s.name}" />
          ${s.stage}단 ${s.name}
        </span>
      `).join('<span>▶</span>');

      return `
        <div class="recipe-card">
          <div class="recipe-title" style="color:${f.color}">[${f.typeName}] ${f.stages[0].name} 가문 — ${f.role}</div>
          <div class="recipe-mats">${stHtml}</div>
          <div class="recipe-desc">3단 궁극기: <b>${f.stages[2].skillName}</b> (${f.stages[2].desc})</div>
        </div>
      `;
    }).join('');
  }

  function openCodexModal() {
    document.getElementById('codexModal').classList.add('active');
  }

  // ================= UI BUTTON EVENT LISTENERS =================
  document.getElementById('btnStartSolo').onclick = () => startGame('solo');
  document.getElementById('btnOpenCoopModal').onclick = () => {
    document.getElementById('coopModal').classList.add('active');
    createCoopRoom();
  };
  document.getElementById('btnCreateRoom').onclick = () => createCoopRoom();
  document.getElementById('btnJoinRoom').onclick = () => joinCoopRoom();
  document.getElementById('btnStartAiCoop').onclick = () => {
    state.allyName = 'AI 챔피언 목호';
    startGame('coop_ai');
  };

  document.getElementById('btnLobbyCodex').onclick = openCodexModal;
  document.getElementById('btnIngameCodex').onclick = openCodexModal;
  const btnLobbyRelics = document.getElementById('btnLobbyRelics');
  if (btnLobbyRelics) btnLobbyRelics.onclick = openRelicModal;
  const btnOpenMission = document.getElementById('btnOpenMissionModal');
  if (btnOpenMission) btnOpenMission.onclick = openMissionModal;
  const btnDefNext = document.getElementById('btnDefNextStage');
  if (btnDefNext) {
    btnDefNext.onclick = () => {
      saveData.selectedStage = Math.min(window.POKE_DATA.stages.length, (saveData.selectedStage || 1) + 1);
      saveProgress();
      renderLobbyStages();
      startGame(state.mode);
    };
  }

  document.getElementById('btnHome').onclick = () => {
    state.running = false;
    document.getElementById('lobbyOverlay').classList.add('active');
  };
  document.getElementById('btnRestartGame').onclick = () => startGame(state.mode);
  document.getElementById('btnBackToLobby').onclick = () => {
    document.getElementById('resultModal').classList.remove('active');
    document.getElementById('lobbyOverlay').classList.add('active');
  };

  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.onclick = () => {
      const target = btn.getAttribute('data-close');
      if (target) document.getElementById(target).classList.remove('active');
    };
  });

  document.querySelectorAll('.codex-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.codex-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('#codexModal .codex-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
    };
  });

  // Speed & Mute
  document.getElementById('btnSpeed').onclick = (e) => {
    state.speed = state.speed === 1 ? 2 : state.speed === 2 ? 3 : 1;
    e.currentTarget.textContent = `${state.speed}x`;
  };
  document.getElementById('btnMute').onclick = (e) => {
    const muted = window.sfx.toggleMute();
    e.currentTarget.textContent = muted ? '🔇' : '🔊';
  };

  // Emoji Pings
  document.querySelectorAll('.ping-btn').forEach(btn => {
    btn.onclick = () => sendEmojiPing(btn.getAttribute('data-emo'), false);
  });

  // Main Deck Actions & Floating Popups
  document.getElementById('btnSummon').onclick = () => {
    document.getElementById('gambleDrawer').classList.add('hidden');
    document.getElementById('upgradeDrawer').classList.add('hidden');
    summonPokemon();
  };
  document.getElementById('btnMergeAll').onclick = mergeAllAvailable;
  document.getElementById('btnBountyBoss').onclick = callBountyBoss;

  const btnOpenMythicDock = document.getElementById('btnOpenMythicDock');
  if (btnOpenMythicDock) {
    btnOpenMythicDock.onclick = openCodexModal;
  }

  const btnToggleGamble = document.getElementById('btnToggleGamble');
  if (btnToggleGamble) {
    btnToggleGamble.onclick = () => {
      document.getElementById('upgradeDrawer').classList.add('hidden');
      document.getElementById('unitInspector').classList.add('hidden');
      document.getElementById('gambleDrawer').classList.toggle('hidden');
    };
  }

  const btnToggleUpgrade = document.getElementById('btnToggleUpgrade');
  if (btnToggleUpgrade) {
    btnToggleUpgrade.onclick = () => {
      document.getElementById('gambleDrawer').classList.add('hidden');
      document.getElementById('unitInspector').classList.add('hidden');
      document.getElementById('upgradeDrawer').classList.toggle('hidden');
    };
  }

  document.querySelectorAll('.drawer-close').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-close-drawer');
      if (id) document.getElementById(id).classList.add('hidden');
    };
  });

  // Inspector Actions
  document.getElementById('btnMergeSelected').onclick = () => {
    if (state.selectedSlot >= 0) mergeThreeAtSlot(state.selectedSlot, false);
  };
  document.getElementById('btnSellSelected').onclick = () => {
    if (state.selectedSlot >= 0 && state.mySlots[state.selectedSlot]) {
      const u = state.mySlots[state.selectedSlot];
      const meta = window.UNIT_BY_ID[u.id];
      const refund = meta.stage === 1 ? 10 : meta.stage === 2 ? 30 : meta.stage === 3 ? 80 : 200;
      state.gold += refund;
      const r = geom.myGridRects[state.selectedSlot];
      if (r) addFloatText(r.cx, r.cy, `+${refund}G 판매`, '#fde047', 12);
      state.mySlots[state.selectedSlot] = null;
      state.selectedSlot = -1;
      window.sfx.playCoin();
      sendCoopSync();
      updateHud();
    }
  };

  // Gambles & Upgrades
  document.getElementById('btnGamble2').onclick = () => gamblePokemon(2, 1, 0.60);
  document.getElementById('btnGamble3').onclick = () => gamblePokemon(3, 2, 0.35);

  document.getElementById('btnUpgBasic').onclick = () => {
    const cost = 30 + (state.upgrades.basic - 1) * 25;
    if (state.gold < cost) {
      window.sfx.playFail();
      return;
    }
    state.gold -= cost;
    state.upgrades.basic++;
    window.sfx.playEvolve();
    updateHud();
  };

  document.getElementById('btnUpgStage3').onclick = () => {
    const cost = state.upgrades.stage3;
    if (state.gems < cost) {
      window.sfx.playFail();
      return;
    }
    state.gems -= cost;
    state.upgrades.stage3++;
    window.sfx.playEvolve();
    updateHud();
  };

  document.getElementById('btnUpgLuck').onclick = () => {
    const cost = 50 + (state.upgrades.luck - 1) * 40;
    if (state.gold < cost) {
      window.sfx.playFail();
      return;
    }
    state.gold -= cost;
    state.upgrades.luck++;
    window.sfx.playEvolve();
    updateHud();
  };

  // PWA Install Prompt
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  document.getElementById('btnInstallPwa').onclick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    } else {
      document.getElementById('installModal').classList.add('active');
    }
  };

  // Service Worker Registration with Instant Auto-Update for Installed PWAs
  if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js', { updateViaCache: 'none' })
        .then((reg) => {
          reg.update();
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') reg.update();
          });
        })
        .catch(() => {});
    });
  }

  // Expose debug helper for testing/verification
  window.__POKE_DEFENSE__ = {
    state,
    startGame,
    summonPokemon,
    mergeAllAvailable,
    summonMythicRecipe,
    callBountyBoss,
    grantTestMythicMaterials: (mythicId = 384) => {
      const m = window.POKE_DATA.mythics.find(x => x.id === mythicId);
      if (!m) return;
      m.recipe.forEach((reqId, idx) => {
        state.mySlots[idx] = { id: reqId, cooldown: 0.1, spawnAnim: 0.8 };
      });
      updateHud();
    }
  };

  // Init & Loop
  window.addEventListener('resize', resizeCanvas);
  populateCodex();
  renderLobbyStages();
  resizeCanvas();

  let lastTime = performance.now();
  function loop(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    updateGame(dt);
    renderGame();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
