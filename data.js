// Poké Lucky Defense — Data & Configuration
// 12 Three-Stage Evolution Lines + 6 Legendary/Mythic Recipes + Enemy Waves

window.POKE_DATA = {
  // 12 Three-Stage Families (Stage 1 -> Stage 2 -> Stage 3)
  families: [
    {
      familyId: 'grass_starter',
      type: 'grass',
      typeName: '풀/독',
      color: '#22c55e',
      role: '방어력 감소(방깎) & 맹독 지속딜',
      stages: [
        { id: 1, name: '이상해씨', stage: 1, dmg: 26, rate: 1.15, range: 135, skillName: '씨뿌리기 독침', desc: '적 방어력 12% 감소 및 중독' },
        { id: 2, name: '이상해풀', stage: 2, dmg: 78, rate: 1.25, range: 148, skillName: '맹독 덩굴채찍', desc: '적 방어력 25% 감소 및 강한 맹독' },
        { id: 3, name: '이상해꽃', stage: 3, dmg: 245, rate: 1.4, range: 165, skillName: '솔라빔 & 맹독꽃', desc: '광역 방어력 45% 삭감 + 맹독 포자 폭발' }
      ]
    },
    {
      familyId: 'fire_starter',
      type: 'fire',
      typeName: '불꽃',
      color: '#ef4444',
      role: '화염 광역 스플래시 & 화상 장판',
      stages: [
        { id: 4, name: '파이리', stage: 1, dmg: 30, rate: 1.05, range: 130, skillName: '불꽃세례', desc: '소형 화염 폭발 및 화상' },
        { id: 5, name: '리자드', stage: 2, dmg: 92, rate: 1.18, range: 145, skillName: '화염방사', desc: '중범위 화염 스플래시 + 화상 지속딜' },
        { id: 6, name: '리자몽', stage: 3, dmg: 295, rate: 1.35, range: 170, skillName: '블라스트번', desc: '대화염 폭발 + 용암 화상 지대 생성' }
      ]
    },
    {
      familyId: 'water_starter',
      type: 'water',
      typeName: '물',
      color: '#3b82f6',
      role: '이동속도 감소(슬로우) & 물보라',
      stages: [
        { id: 7, name: '꼬부기', stage: 1, dmg: 24, rate: 1.2, range: 135, skillName: '거품광선', desc: '적 이동속도 25% 둔화' },
        { id: 8, name: '어니부기', stage: 2, dmg: 74, rate: 1.3, range: 150, skillName: '물의파동', desc: '주변 물보라 + 이동속도 40% 둔화' },
        { id: 9, name: '거북왕', stage: 3, dmg: 235, rate: 1.45, range: 170, skillName: '하이드로캐논', desc: '광역 해일 폭격 + 이동속도 60% 빙결급 둔화' }
      ]
    },
    {
      familyId: 'pikachu_line',
      type: 'electric',
      typeName: '전기/산적',
      color: '#eab308',
      role: '공격 시 확률적 골드/보석 채굴 & 감전',
      stages: [
        { id: 172, name: '피츄', stage: 1, dmg: 22, rate: 1.45, range: 130, skillName: '애교 전기자석파', desc: '공격 시 14% 확률로 +5G 획득 (산적 특성)' },
        { id: 25, name: '피카츄', stage: 2, dmg: 70, rate: 1.65, range: 145, skillName: '10만볼트 & 고양이돈받기', desc: '공격 시 20% 확률 +12G, 2% 확률 +1보석 채굴' },
        { id: 26, name: '라이츄', stage: 3, dmg: 220, rate: 1.9, range: 165, skillName: '볼트태클 황금광산', desc: '공격 시 28% 확률 +25G, 4% 확률 +1보석 & 감전 연쇄' }
      ]
    },
    {
      familyId: 'gengar_line',
      type: 'ghost',
      typeName: '고스트',
      color: '#a855f7',
      role: '주변 아군 공속 버프 & 암흑 연쇄탄',
      stages: [
        { id: 92, name: '고오스', stage: 1, dmg: 25, rate: 1.2, range: 135, skillName: '나이트헤드', desc: '인접 아군 공격속도 +12% 오라' },
        { id: 93, name: '고우스트', stage: 2, dmg: 76, rate: 1.35, range: 150, skillName: '섀도볼 오라', desc: '주변 아군 공격속도 +24% & 암흑 구체' },
        { id: 94, name: '팬텀', stage: 3, dmg: 240, rate: 1.55, range: 170, skillName: '다크홀 팬텀레이드', desc: '주변 아군 공격속도 +42% 버프 & 영혼 흡수탄' }
      ]
    },
    {
      familyId: 'alakazam_line',
      type: 'psychic',
      typeName: '에스퍼',
      color: '#ec4899',
      role: '단일 보스 체력비례/관통 극딜',
      stages: [
        { id: 63, name: '캐이시', stage: 1, dmg: 35, rate: 1.1, range: 145, skillName: '염동력 관통', desc: '방어 무시 사이코 광선' },
        { id: 64, name: '윤겔라', stage: 2, dmg: 112, rate: 1.25, range: 160, skillName: '사이코빔', desc: '보스 대상 추가 피해 +50% 및 방어 관통' },
        { id: 65, name: '후딘', stage: 3, dmg: 365, rate: 1.5, range: 180, skillName: '사이코키네시스 극딜', desc: '보스 추뎀 +100% + 대상 최대체력 비례 정신파괴' }
      ]
    },
    {
      familyId: 'ampharos_line',
      type: 'electric',
      typeName: '전기',
      color: '#facc15',
      role: '연쇄 번개(체인 라이트닝) & 기절 CC기',
      stages: [
        { id: 179, name: '메리프', stage: 1, dmg: 25, rate: 1.15, range: 135, skillName: '정전기 쇼크', desc: '3체 연쇄 번개 & 15% 확률 기절' },
        { id: 180, name: '보송송', stage: 2, dmg: 80, rate: 1.25, range: 150, skillName: '일렉트릭 볼', desc: '4체 연쇄 번개 & 25% 확률 0.8초 기절' },
        { id: 181, name: '전룡', stage: 3, dmg: 255, rate: 1.4, range: 170, skillName: '썬더볼트 등대섬광', desc: '6체 연쇄 번개 + 38% 확률 1.2초 감전 스턴' }
      ]
    },
    {
      familyId: 'dragonite_line',
      type: 'dragon',
      typeName: '드래곤',
      color: '#f97316',
      role: '파괴광선 & 용성군 대폭발',
      stages: [
        { id: 147, name: '미뇽', stage: 1, dmg: 32, rate: 1.0, range: 135, skillName: '용의숨결', desc: '강력한 용족 에너지 탄환' },
        { id: 148, name: '신뇽', stage: 2, dmg: 102, rate: 1.15, range: 155, skillName: '드래곤다이브', desc: '관통형 신비의 파동 + 광역 충격' },
        { id: 149, name: '망나뇽', stage: 3, dmg: 330, rate: 1.3, range: 175, skillName: '파괴광선 & 용성군', desc: '초고화력 파괴광선 및 광역 운석 폭격' }
      ]
    },
    {
      familyId: 'tyranitar_line',
      type: 'rock',
      typeName: '바위/악',
      color: '#84cc16',
      role: '스톤샤워 광역 스턴 & 방깎',
      stages: [
        { id: 246, name: '애버라스', stage: 1, dmg: 33, rate: 0.95, range: 125, skillName: '돌떨구기', desc: '바위 강타 및 소폭 방어 감소' },
        { id: 247, name: '데기라스', stage: 2, dmg: 105, rate: 1.05, range: 140, skillName: '스톤샤워', desc: '광역 낙석 피해 + 22% 확률 스턴' },
        { id: 248, name: '마기라스', stage: 3, dmg: 340, rate: 1.2, range: 160, skillName: '스톤에지 모래폭풍', desc: '대규모 암석 붕괴 + 광역 기절 & 방어력 40% 파괴' }
      ]
    },
    {
      familyId: 'salamence_line',
      type: 'dragon',
      typeName: '드래곤/비행',
      color: '#06b6d4',
      role: '치명타 특화 초고속 폭격',
      stages: [
        { id: 371, name: '아공이', stage: 1, dmg: 28, rate: 1.35, range: 130, skillName: '성난앞니', desc: '치명타 확률 25% (2배 피해)' },
        { id: 372, name: '쉘곤', stage: 2, dmg: 88, rate: 1.5, range: 145, skillName: '드래곤크루', desc: '치명타 확률 38% (2.4배 피해)' },
        { id: 373, name: '보만다', stage: 3, dmg: 275, rate: 1.85, range: 170, skillName: '폭풍 치명타 공습', desc: '초고속 연사 + 치명타 확률 50% (3배 폭딜)' }
      ]
    },
    {
      familyId: 'metagross_line',
      type: 'steel',
      typeName: '강철/에스퍼',
      color: '#60a5fa',
      role: '코멧펀치 보스 추뎀 & 광역 스턴',
      stages: [
        { id: 374, name: '메탕', stage: 1, dmg: 31, rate: 1.05, range: 130, skillName: '아이언헤드', desc: '강철 돌진 및 기절 확률' },
        { id: 375, name: '메탕구', stage: 2, dmg: 98, rate: 1.18, range: 145, skillName: '불릿펀치', desc: '보스 추뎀 +40% & 강철 충격파' },
        { id: 376, name: '메타그로스', stage: 3, dmg: 325, rate: 1.35, range: 165, skillName: '코멧펀치 자기장폭발', desc: '보스 추뎀 +80% + 광역 전자기 스턴 필드' }
      ]
    },
    {
      familyId: 'garchomp_line',
      type: 'ground',
      typeName: '드래곤/땅',
      color: '#f43f5e',
      role: '전 트랙 충격파 지진 & 광역 딜',
      stages: [
        { id: 443, name: '딥상어동', stage: 1, dmg: 29, rate: 1.15, range: 130, skillName: '모래지옥', desc: '지면 충격파 공격' },
        { id: 444, name: '한바이트', stage: 2, dmg: 94, rate: 1.28, range: 148, skillName: '대지의힘', desc: '직선 지진파 & 광역 둔화' },
        { id: 445, name: '한카리아스', stage: 3, dmg: 310, rate: 1.48, range: 170, skillName: '역린 대지진', desc: '광범위 지각변동 지진 + 적 전체 충격파' }
      ]
    }
  ],

  // Stage 4 Mythic / Legendary Recipes (ORD Style One-Tap Summon when materials are on board)
  mythics: [
    {
      id: 384,
      name: '레쿠쟈',
      grade: '신화',
      title: '천공의 지배자',
      color: '#10b981',
      accent: '#fde047',
      dmg: 1250,
      rate: 2.1,
      range: 240,
      recipe: [6, 9, 3], // 리자몽 + 거북왕 + 이상해꽃
      recipeNames: ['리자몽(3단)', '거북왕(3단)', '이상해꽃(3단)'],
      skillName: '화룡점정 & 델타스트림',
      desc: '초거대 에메랄드 용성군으로 트랙 전체 광역 초토화 + 방어력 60% 무시'
    },
    {
      id: 150,
      name: '뮤츠',
      grade: '신화',
      title: '최강의 유전자',
      color: '#c084fc',
      accent: '#f472b6',
      dmg: 1420,
      rate: 2.25,
      range: 250,
      recipe: [65, 94, 26], // 후딘 + 팬텀 + 라이츄
      recipeNames: ['후딘(3단)', '팬텀(3단)', '라이츄(3단)'],
      skillName: '사이코브레이크 중력장',
      desc: '보스 최대체력 비례 극딜 + 주변 아군 전체 공속 +50% + 골드 찬스'
    },
    {
      id: 493,
      name: '아르세우스',
      grade: '신화',
      title: '창조신',
      color: '#fef08a',
      accent: '#ffffff',
      dmg: 1680,
      rate: 2.4,
      range: 260,
      recipe: [149, 373, 445], // 망나뇽 + 보만다 + 한카리아스
      recipeNames: ['망나뇽(3단)', '보만다(3단)', '한카리아스(3단)'],
      skillName: '심판의뭉치 창조의빛',
      desc: '전 속성 천벌의 빛 폭격 + 모든 적 기절/방깎/둔화 동시 부여'
    },
    {
      id: 250,
      name: '칠색조',
      grade: '전설',
      title: '무지개빛 불사조',
      color: '#fb923c',
      accent: '#facc15',
      dmg: 1180,
      rate: 2.0,
      range: 235,
      recipe: [248, 376, 181], // 마기라스 + 메타그로스 + 전룡
      recipeNames: ['마기라스(3단)', '메타그로스(3단)', '전룡(3단)'],
      skillName: '성스러운불꽃 무지개신풍',
      desc: '성스러운 화염 폭풍으로 광역 스턴 & 화상 + 매 웨이브 보석 축복'
    },
    {
      id: 382,
      name: '가이오가',
      grade: '전설',
      title: '대해양의 화신',
      color: '#38bdf8',
      accent: '#818cf8',
      dmg: 960,
      rate: 1.9,
      range: 230,
      recipe: [9, 149, 180], // 거북왕(3단) + 망나뇽(3단) + 보송송(2단)
      recipeNames: ['거북왕(3단)', '망나뇽(3단)', '보송송(2단)'],
      skillName: '근원의파동 해일',
      desc: '거대 해일로 광역 적 이동속도 75% 동결 둔화 및 다중 수압 포격'
    },
    {
      id: 383,
      name: '그란돈',
      grade: '전설',
      title: '대륙의 지배자',
      color: '#f87171',
      accent: '#fbbf24',
      dmg: 990,
      rate: 1.85,
      range: 225,
      recipe: [6, 248, 247], // 리자몽(3단) + 마기라스(3단) + 데기라스(2단)
      recipeNames: ['리자몽(3단)', '마기라스(3단)', '데기라스(2단)'],
      skillName: '단애의칼 용암분화',
      desc: '대지를 가르는 마그마 칼날로 광역 방깎 55% 및 보스 중추 타격'
    }
  ],

  // Enemy Waves & Bosses
  enemyPool: [
    { id: 19, name: '꼬렛', scale: 0.9, spd: 1.15, hpMul: 0.85 },
    { id: 41, name: '주뱃', scale: 0.9, spd: 1.3, hpMul: 0.8 },
    { id: 52, name: '나옹', scale: 0.95, spd: 1.1, hpMul: 0.95 },
    { id: 66, name: '알통몬', scale: 1.0, spd: 0.95, hpMul: 1.15 },
    { id: 74, name: '꼬마돌', scale: 1.0, spd: 0.85, hpMul: 1.3 },
    { id: 88, name: '질퍽이', scale: 1.05, spd: 0.9, hpMul: 1.25 },
    { id: 109, name: '또가스', scale: 1.0, spd: 1.0, hpMul: 1.1 },
    { id: 123, name: '스라크', scale: 1.1, spd: 1.35, hpMul: 1.05 }
  ],

  bossPool: [
    { id: 95, name: '강철톤 롱스톤', title: '암석 거수 보스', hpMul: 14, spd: 0.68 },
    { id: 112, name: '코뿌리', title: '중장갑 돌격 보스', hpMul: 16, spd: 0.72 },
    { id: 130, name: '갸라도스', title: '폭군 해룡 보스', hpMul: 18, spd: 0.78 },
    { id: 142, name: '프테라', title: '고대 익룡 보스', hpMul: 17, spd: 0.88 },
    { id: 143, name: '잠만보', title: '초거대 철벽 보스', hpMul: 24, spd: 0.58 },
    { id: 212, name: '핫삼', title: '붉은 섬광 보스', hpMul: 20, spd: 0.85 },
    { id: 229, name: '헬가', title: '지옥불 사냥개 보스', hpMul: 19, spd: 0.82 },
    { id: 144, name: '프리져', title: '전설의 빙결신 보스', hpMul: 26, spd: 0.75 },
    { id: 145, name: '썬더', title: '전설의 뇌신 보스', hpMul: 28, spd: 0.82 },
    { id: 146, name: '파이어', title: '전설의 화신 보스', hpMul: 32, spd: 0.78 }
  ]
};

// Build fast lookup maps
window.UNIT_BY_ID = {};
window.STAGE_POOLS = { 1: [], 2: [], 3: [] };

window.POKE_DATA.families.forEach(fam => {
  fam.stages.forEach((st, idx) => {
    const nextStageId = idx < 2 ? fam.stages[idx + 1].id : null;
    const unitObj = {
      ...st,
      familyId: fam.familyId,
      type: fam.type,
      typeName: fam.typeName,
      color: fam.color,
      role: fam.role,
      nextId: nextStageId,
      isMythic: false
    };
    window.UNIT_BY_ID[st.id] = unitObj;
    window.STAGE_POOLS[st.stage].push(unitObj);
  });
});

window.POKE_DATA.mythics.forEach(m => {
  window.UNIT_BY_ID[m.id] = {
    ...m,
    stage: 4,
    type: 'mythic',
    typeName: m.grade,
    role: m.title,
    isMythic: true
  };
});
