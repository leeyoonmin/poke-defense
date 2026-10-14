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
        { id: 25, name: '피카츄', stage: 1, dmg: 22, rate: 1.45, range: 130, skillName: '애교 전기자석파', desc: '공격 시 14% 확률로 +5G 획득 (산적 특성)' },
        { id: 26, name: '라이츄', stage: 2, dmg: 70, rate: 1.65, range: 145, skillName: '10만볼트 & 고양이돈받기', desc: '공격 시 20% 확률 +12G, 2% 확률 +1보석 채굴' },
        { id: 135, name: '쥬피썬더', stage: 3, dmg: 220, rate: 1.9, range: 165, skillName: '썬더볼트 황금광산', desc: '공격 시 28% 확률 +25G, 4% 확률 +1보석 & 감전 연쇄' }
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
      typeName: '전기/자력',
      color: '#facc15',
      role: '연쇄 번개(체인 라이트닝) & 기절 CC기',
      stages: [
        { id: 81, name: '코일', stage: 1, dmg: 25, rate: 1.15, range: 135, skillName: '전기자석파 쇼크', desc: '3체 연쇄 번개 & 15% 확률 기절' },
        { id: 82, name: '레어코일', stage: 2, dmg: 80, rate: 1.25, range: 150, skillName: '트라이어택 방전', desc: '4체 연쇄 번개 & 25% 확률 0.8초 기절' },
        { id: 125, name: '에레브', stage: 3, dmg: 255, rate: 1.4, range: 170, skillName: '번개펀치 대방전', desc: '6체 연쇄 번개 + 38% 확률 1.2초 감전 스턴' }
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
      typeName: '바위/땅',
      color: '#84cc16',
      role: '스톤샤워 광역 스턴 & 방깎',
      stages: [
        { id: 74, name: '꼬마돌', stage: 1, dmg: 33, rate: 0.95, range: 125, skillName: '돌떨구기', desc: '바위 강타 및 소폭 방어 감소' },
        { id: 75, name: '데구리', stage: 2, dmg: 105, rate: 1.05, range: 140, skillName: '스톤샤워', desc: '광역 낙석 피해 + 22% 확률 스턴' },
        { id: 76, name: '딱구리', stage: 3, dmg: 340, rate: 1.2, range: 160, skillName: '대폭발 암석붕괴', desc: '대규모 암석 붕괴 + 광역 기절 & 방어력 40% 파괴' }
      ]
    },
    {
      familyId: 'salamence_line',
      type: 'dragon',
      typeName: '비행/질풍',
      color: '#06b6d4',
      role: '치명타 특화 초고속 폭격',
      stages: [
        { id: 16, name: '구구', stage: 1, dmg: 28, rate: 1.35, range: 130, skillName: '전광석화 날개치기', desc: '치명타 확률 25% (2배 피해)' },
        { id: 17, name: '피죤', stage: 2, dmg: 88, rate: 1.5, range: 145, skillName: '제비반환 급습', desc: '치명타 확률 38% (2.4배 피해)' },
        { id: 18, name: '피죤투', stage: 3, dmg: 275, rate: 1.85, range: 170, skillName: '마하2 폭풍 공습', desc: '초고속 연사 + 치명타 확률 50% (3배 폭딜)' }
      ]
    },
    {
      familyId: 'metagross_line',
      type: 'steel',
      typeName: '격투/괴력',
      color: '#60a5fa',
      role: '폭발펀치 보스 추뎀 & 광역 스턴',
      stages: [
        { id: 66, name: '알통몬', stage: 1, dmg: 31, rate: 1.05, range: 130, skillName: '태권도 당수', desc: '격투 강타 및 기절 확률' },
        { id: 67, name: '근육몬', stage: 2, dmg: 98, rate: 1.18, range: 145, skillName: '크로스촙', desc: '보스 추뎀 +40% & 격투 충격파' },
        { id: 68, name: '괴력몬', stage: 3, dmg: 325, rate: 1.35, range: 165, skillName: '폭발펀치 지구던지기', desc: '보스 추뎀 +80% + 광역 진동 스턴 필드' }
      ]
    },
    {
      familyId: 'garchomp_line',
      type: 'ground',
      typeName: '독/땅',
      color: '#f43f5e',
      role: '전 트랙 충격파 지진 & 광역 딜',
      stages: [
        { id: 32, name: '니드런♂', stage: 1, dmg: 29, rate: 1.15, range: 130, skillName: '두번차기 독침', desc: '지면 충격파 공격' },
        { id: 33, name: '니드리노', stage: 2, dmg: 94, rate: 1.28, range: 148, skillName: '뿔드릴 강타', desc: '직선 지진파 & 광역 둔화' },
        { id: 34, name: '니드킹', stage: 3, dmg: 310, rate: 1.48, range: 170, skillName: '대지의힘 대지진', desc: '광범위 지각변동 지진 + 적 전체 충격파' }
      ]
    }
  ],

  // Stage 4 Gen-1 Mythic / Legendary Recipes (100% Kanto 151!)
  mythics: [
    {
      id: 146,
      name: '전설의 파이어',
      grade: '신화',
      title: '화염의 전설조',
      color: '#10b981',
      accent: '#fde047',
      dmg: 1250,
      rate: 2.1,
      range: 240,
      recipe: [6, 9, 3], // 리자몽 + 거북왕 + 이상해꽃
      recipeNames: ['리자몽(3단)', '거북왕(3단)', '이상해꽃(3단)'],
      skillName: '불새 & 태양의 심판',
      desc: '초거대 태양 화염폭풍으로 트랙 전체 광역 초토화 + 방어력 60% 무시'
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
      recipe: [65, 94, 135], // 후딘 + 팬텀 + 쥬피썬더
      recipeNames: ['후딘(3단)', '팬텀(3단)', '쥬피썬더(3단)'],
      skillName: '사이코브레이크 중력장',
      desc: '보스 최대체력 비례 극딜 + 주변 아군 전체 공속 +50% + 골드 찬스'
    },
    {
      id: 151,
      name: '환상의 뮤',
      grade: '신화',
      title: '모든 포켓몬의 시조',
      color: '#fef08a',
      accent: '#ffffff',
      dmg: 1680,
      rate: 2.4,
      range: 260,
      recipe: [149, 18, 34], // 망나뇽 + 피죤투 + 니드킹
      recipeNames: ['망나뇽(3단)', '피죤투(3단)', '니드킹(3단)'],
      skillName: '기원의 슈퍼노바',
      desc: '전 속성 태초의 빛 폭격 + 모든 적 기절/방깎/둔화 동시 부여'
    },
    {
      id: 145,
      name: '전설의 썬더',
      grade: '전설',
      title: '뇌전의 전설조',
      color: '#fb923c',
      accent: '#facc15',
      dmg: 1180,
      rate: 2.0,
      range: 235,
      recipe: [76, 68, 125], // 딱구리 + 괴력몬 + 에레브
      recipeNames: ['딱구리(3단)', '괴력몬(3단)', '에레브(3단)'],
      skillName: '천둥번개 신풍',
      desc: '전설의 뇌전 폭풍으로 광역 감전 스턴 & 지속 감전 피해'
    },
    {
      id: 144,
      name: '전설의 프리져',
      grade: '전설',
      title: '빙결의 전설조',
      color: '#38bdf8',
      accent: '#818cf8',
      dmg: 960,
      rate: 1.9,
      range: 230,
      recipe: [9, 149, 82], // 거북왕(3단) + 망나뇽(3단) + 레어코일(2단)
      recipeNames: ['거북왕(3단)', '망나뇽(3단)', '레어코일(2단)'],
      skillName: '절대영도 눈보라',
      desc: '절대영도 눈보라로 광역 적 이동속도 75% 동결 둔화 및 빙결 포격'
    },
    {
      id: 59,
      name: '전설의 윈디',
      grade: '전설',
      title: '관동의 전설 신수',
      color: '#f87171',
      accent: '#fbbf24',
      dmg: 990,
      rate: 1.85,
      range: 225,
      recipe: [6, 76, 75], // 리자몽(3단) + 딱구리(3단) + 데구리(2단)
      recipeNames: ['리자몽(3단)', '딱구리(3단)', '데구리(2단)'],
      skillName: '플레어드라이브 신속',
      desc: '대지를 가르는 홍련의 화염으로 광역 방깎 55% 및 보스 중추 타격'
    }
  ],

  // Gen-1 Enemy Waves & Bosses (100% Kanto 1~151)
  enemyPool: [
    { id: 19, name: '꼬렛', scale: 0.9, spd: 1.15, hpMul: 0.85 },
    { id: 41, name: '주뱃', scale: 0.9, spd: 1.3, hpMul: 0.8 },
    { id: 13, name: '뿔충이', scale: 0.9, spd: 1.05, hpMul: 0.9 },
    { id: 52, name: '나옹', scale: 0.95, spd: 1.1, hpMul: 0.95 },
    { id: 43, name: '뚜벅쵸', scale: 0.95, spd: 0.95, hpMul: 1.15 },
    { id: 27, name: '모래두지', scale: 1.0, spd: 0.85, hpMul: 1.3 },
    { id: 88, name: '질퍽이', scale: 1.05, spd: 0.9, hpMul: 1.25 },
    { id: 109, name: '또가스', scale: 1.0, spd: 1.0, hpMul: 1.1 }
  ],

  bossPool: [
    { id: 95, name: '롱스톤', title: '암석 거수 보스', hpMul: 14, spd: 0.68 },
    { id: 112, name: '코뿌리', title: '중장갑 돌격 보스', hpMul: 16, spd: 0.72 },
    { id: 123, name: '스라크', title: '초고속 참격 보스', hpMul: 17, spd: 0.85 },
    { id: 127, name: '쁘사이저', title: '괴력 집게 보스', hpMul: 18, spd: 0.78 },
    { id: 128, name: '켄타로스', title: '성난 폭주 보스', hpMul: 19, spd: 0.84 },
    { id: 115, name: '캥카', title: '사파리 수호 보스', hpMul: 21, spd: 0.75 },
    { id: 130, name: '갸라도스', title: '폭군 해룡 보스', hpMul: 22, spd: 0.78 },
    { id: 131, name: '라프라스', title: '빙해의 수호룡 보스', hpMul: 24, spd: 0.72 },
    { id: 142, name: '프테라', title: '고대 익룡 보스', hpMul: 26, spd: 0.86 },
    { id: 143, name: '잠만보', title: '초거대 철벽 보스', hpMul: 30, spd: 0.58 }
  ],

  // 1. 5-Stage Progression System with Region Modifiers
  stages: [
    {
      id: 1,
      name: 'STAGE 1. 태초마을 초원',
      sub: '입문 30 WAVE · 기본 밸런스',
      icon: '🌲',
      bossImg: 143,
      maxWaves: 30,
      hpMult: 1.0,
      spdMult: 1.0,
      baseArmor: 0,
      doubleBoss: false,
      enemyLimit: 100,
      medalReward: 100
    },
    {
      id: 2,
      name: 'STAGE 2. 블루시티 해안',
      sub: '40 WAVE · [기믹] 몬스터 이속 +15%',
      icon: '🌊',
      bossImg: 130,
      maxWaves: 40,
      hpMult: 1.25,
      spdMult: 1.15,
      baseArmor: 0,
      doubleBoss: false,
      enemyLimit: 100,
      medalReward: 180
    },
    {
      id: 3,
      name: 'STAGE 3. 보라타운 유령탑',
      sub: '50 WAVE · [기믹] 기본 방어갑옷 25% (방깎 필수!)',
      icon: '👻',
      bossImg: 94,
      maxWaves: 50,
      hpMult: 1.5,
      spdMult: 1.05,
      baseArmor: 0.25,
      doubleBoss: false,
      enemyLimit: 100,
      medalReward: 280
    },
    {
      id: 4,
      name: 'STAGE 4. 홍련섬 화산 지대',
      sub: '60 WAVE · [기믹] 10웨이브마다 더블 보스 출현!',
      icon: '🌋',
      bossImg: 112,
      maxWaves: 60,
      hpMult: 1.85,
      spdMult: 1.08,
      baseArmor: 0.15,
      doubleBoss: true,
      enemyLimit: 95,
      medalReward: 420
    },
    {
      id: 5,
      name: 'STAGE 5. 석영고원 챔피언 리그',
      sub: '80 WAVE · [기믹] 한도 75마리 & 더블 보스!',
      icon: '🏛️',
      bossImg: 150,
      maxWaves: 80,
      hpMult: 2.3,
      spdMult: 1.12,
      baseArmor: 0.25,
      doubleBoss: true,
      enemyLimit: 75,
      medalReward: 700
    }
  ],

  // 2. In-Game Bounty Missions (Lucky Defense Style Instant Rewards!)
  missions: [
    { id: 'm_collector', title: '도감 수집가', desc: '서로 다른 1단 포켓몬 6종류 이상 동시 보유', gold: 80, gems: 0 },
    { id: 'm_squad2', title: '분대 집결', desc: '3마리 풀분대(합성 대기) 슬롯 2개 동시 보유', gold: 40, gems: 2 },
    { id: 'm_first3', title: '최종 진화의 힘', desc: '3단 최종진화 포켓몬 1마리 이상 보유', gold: 60, gems: 1 },
    { id: 'm_shiny', title: '✨이로치 발견!', desc: '색이 다른(✨이로치) 포켓몬 1마리 이상 보유', gold: 100, gems: 2 },
    { id: 'm_bounty', title: '현상금 사냥꾼', desc: '하단 [보스소환!]으로 부른 현상금 보스 처치', gold: 100, gems: 1 },
    { id: 'm_mythic', title: '신화 강림', desc: '4단계 전설/신화 포켓몬 첫 소환 성공', gold: 150, gems: 3 },
    { id: 'm_rich', title: '부자의 금고', desc: '보유 골드 350G 이상 달성 (금고 이자 활용!)', gold: 50, gems: 2 },
    { id: 'm_army', title: '군단 사령관', desc: '내 섬의 총 포켓몬 마릿수(분대 합산) 15마리 달성', gold: 100, gems: 1 }
  ],

  // 3. Permanent Lobby Relics (Upgraded with Trainer Medals)
  relics: [
    {
      id: 'safe_box',
      name: '💰 부적금화 금고 (복리 이자)',
      img: './assets/items/amulet-coin.png',
      max: 5,
      baseCost: 80,
      desc: '매 웨이브 종료 시 현재 보유 골드의 +2%/Lv (최대 +10%)를 복리 이자로 추가 지급!'
    },
    {
      id: 'lucky_charm',
      name: '🍀 행운의 알 (도박 확률업)',
      img: './assets/items/lucky-egg.png',
      max: 5,
      baseCost: 90,
      desc: '레어(2단)·영웅(3단) 행운석 도박 성공 확률이 영구적으로 +3%/Lv 증가!'
    },
    {
      id: 'shiny_charm',
      name: '✨ 빛나는 부적 (이로치 확률업)',
      img: './assets/items/moon-stone.png',
      max: 5,
      baseCost: 100,
      desc: '공격력 1.5배인 [✨이로치 포켓몬] 등장 확률이 +1.5%/Lv (최대 12.5%) 증가!'
    },
    {
      id: 'starter_fund',
      name: '🎒 오박사의 초기 지원품',
      img: './assets/items/poke-ball.png',
      max: 5,
      baseCost: 75,
      desc: '게임 시작 시 초기 골드 +25G/Lv 및 3레벨 달성 시 초기 보석 +1💎 추가!'
    },
    {
      id: 'champ_crest',
      name: '⚔️ 챔피언의 문장 (전체 공격력)',
      img: './assets/items/fire-stone.png',
      max: 10,
      baseCost: 85,
      desc: '내 모든 포켓몬의 기본 공격력이 영구적으로 +8%/Lv 증가!'
    }
  ],

  // 4. Wave 10 Boss Kill Gym Badges (Roguelike 3-Choice Buffs)
  gymBadges: [
    { id: 'boulder', icon: '🪨', name: '회색배지 (웅의 결의)', desc: '모든 포켓몬의 기절(Stun) 지속시간 +0.4초 & 바위·강철·땅 공격력 +40%' },
    { id: 'cascade', icon: '💧', name: '블루배지 (이슬의 급류)', desc: '모든 포켓몬의 공격속도 +18% & 물 포켓몬 둔화 효과 강화' },
    { id: 'thunder', icon: '⚡', name: '갈색배지 (마티스의 뇌격)', desc: '피카츄 계열 골드·보석 채굴 확률 1.6배 & 전기 공격력 +35%' },
    { id: 'rainbow', icon: '🌿', name: '무지개배지 (민화의 비전)', desc: '모든 방어력 감소(방깎) 효과 +20%p 증폭 & 지속 피해 1.5배' },
    { id: 'marsh', icon: '🔮', name: '골드배지 (초련의 염력)', desc: '보스 몬스터 대상 모든 포켓몬의 피해량 +35% 증가' },
    { id: 'volcano', icon: '🔥', name: '진홍배지 (강연의 열정)', desc: '모든 포켓몬 기본 공격력 +25% & 광역 폭발 범위 증가' },
    { id: 'rocket', icon: '🚀', name: '로켓단 비밀 자금', desc: '즉시 +140G 획득 & 소환 비용 영구 -4G 할인!' },
    { id: 'jeweler', icon: '💎', name: '보석 세공사의 축복', desc: '즉시 행운석 +4💎 획득 & 이번 판 도박 성공률 +12% 증가!' },
    { id: 'evo_stone', icon: '🧬', name: '수수께끼 진화의 돌', desc: '즉시 내 섬에 랜덤 [3단 최종진화 포켓몬] 1마리 무료 소환! (이로치 확률 40%)' }
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
