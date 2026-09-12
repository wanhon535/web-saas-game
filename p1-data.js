/**
 * P1 第一章《幽冥荒原》静态内容配置。
 * 仅包含本地客户端的关卡、固定产出、装备、材料和首只御兽数据。
 */
(() => {
  const stages = [
    {
      id: '1-01', title: '荒原警兆', type: 'normal', unlockedByDefault: true,
      recommendedPower: 126, intro: { speaker: '裴观岳', text: '阵眼将碎。先守山门，其余真相，待妖潮退后再问。' },
      outro: { speaker: '万剑真君', text: '剑还在。便先斩开一条生路。' },
      waves: 2, enemyTier: 0,
      firstClear: { gold: 180, materials: { swordIron: 2 } }, repeat: { gold: 70, materials: { swordIron: 1 } },
    },
    {
      id: '1-02', title: '残阵回响', type: 'normal', recommendedPower: 145,
      intro: { speaker: '裴观岳', text: '残阵尚有余烬，守住这一息，妖潮的来处便有迹可循。' },
      outro: { speaker: '叶轻舟', text: '荒原里还有能用的残器，别让它们埋在妖尘里。' },
      waves: 2, enemyTier: 1,
      firstClear: { gold: 220, materials: { swordIron: 3 }, gear: 'wildBracer' }, repeat: { gold: 85, materials: { swordIron: 1 } },
    },
    {
      id: '1-03', title: '剑痕拾遗', type: 'normal', recommendedPower: 168,
      intro: { speaker: '叶轻舟', text: '拾起残器，护住剑意。天衍剑宗还未到绝路。' },
      outro: { speaker: '万剑真君', text: '剑痕未灭，便还有人曾在此处镇妖。' },
      waves: 3, enemyTier: 2,
      firstClear: { gold: 260, materials: { swordIron: 4 }, gear: 'arrayRobe' }, repeat: { gold: 100, materials: { swordIron: 2 } },
    },
    {
      id: '1-04', title: '守山灵识', type: 'normal', recommendedPower: 188,
      intro: { speaker: '玄曜', text: '妖气未尽，灵性仍存。此地妖兽，并非皆不可救。' },
      outro: { speaker: '玄曜', text: '持清灵结契符，待其灵台虚弱，方可净化结契。' },
      waves: 3, enemyTier: 3,
      firstClear: { gold: 300, materials: { swordIron: 3, pactCharm: 1 } }, repeat: { gold: 115, materials: { swordIron: 2 } },
    },
    {
      id: '1-05', title: '阵眼试炼', type: 'normal', recommendedPower: 206,
      intro: { speaker: '叶轻舟', text: '阵眼再撑不住第二次冲击了。把法器穿戴好，再来守这一阵。' },
      outro: { speaker: '裴观岳', text: '阵纹已稳。荒原深处的妖气，正向一处石丘汇聚。' },
      waves: 4, enemyTier: 4,
      firstClear: { gold: 340, materials: { swordIron: 4, spiritSand: 1 }, gear: 'warmJade' }, repeat: { gold: 130, materials: { swordIron: 2 } },
    },
    {
      id: '1-06', title: '石甲拦路', type: 'elite', recommendedPower: 238,
      intro: { speaker: '裴观岳', text: '前方石甲妖兽挡住阵路。它身上的妖纹，与旧日封印相同。' },
      outro: { speaker: '万剑真君', text: '石甲碎处，果然藏着通往青雀巢穴的妖痕。' },
      waves: 2, enemyTier: 5,
      boss: { name: '荒原石甲兽', hp: 540, speed: 11, r: 48, value: 42, kind: 'elite', summonCount: 3 },
      firstClear: { gold: 480, materials: { swordIron: 5, spiritSand: 3 }, gear: 'stoneTalisman' }, repeat: { gold: 170, materials: { swordIron: 3, spiritSand: 1 } },
    },
    {
      id: '1-07', title: '青羽秘纹', type: 'normal', recommendedPower: 262,
      intro: { speaker: '叶轻舟', text: '失联名册里还有一页没有烧尽……谢无归的传讯停在青羽妖纹附近。' },
      outro: { speaker: '万剑真君', text: '封妖纹与裂隙妖气纠缠不散。先循着青羽痕迹继续推进。' },
      waves: 4, enemyTier: 6,
      firstClear: { gold: 390, materials: { swordIron: 5, spiritSand: 2 } }, repeat: { gold: 145, materials: { swordIron: 3 } },
    },
    {
      id: '1-08', title: '妖潮压境', type: 'normal', recommendedPower: 290,
      intro: { speaker: '裴观岳', text: '青雀巢穴就在前方。最后一轮妖潮来得更急，守住核心阵眼。' },
      outro: { speaker: '玄曜', text: '妖气源头已现。青雀尚有灵识，莫让裂隙先一步吞没它。' },
      waves: 5, enemyTier: 7,
      firstClear: { gold: 460, materials: { swordIron: 6, pactCharm: 1, spiritSand: 2 } }, repeat: { gold: 165, materials: { swordIron: 3 } },
    },
    {
      id: '1-09', title: '雀鸣于荒原', type: 'boss', recommendedPower: 325,
      intro: { speaker: '玄曜', text: '寻木青雀已被裂隙妖气侵蚀。待封妖纹显现，以结契符收剑意、定其灵台。' },
      outro: { speaker: '万剑真君', text: '妖息已散。从今日起，你随我守山。' },
      waves: 3, enemyTier: 8, capture: { threshold: 0.35, tutorialFixedSuccess: true },
      boss: { name: '寻木青雀', hp: 680, speed: 12, r: 52, value: 52, kind: 'chapter' },
      firstClear: { gold: 680, materials: { qingqueFeather: 3, pactCharm: 1 }, pet: 'xunmuQingque' },
      repeat: { gold: 220, materials: { qingqueFeather: 1 } },
    },
    {
      id: '1-10', title: '山门余火', type: 'story', recommendedPower: 325,
      intro: { speaker: '裴观岳', text: '荒原暂安。青雀留下的灵痕，已指向灵木妖林。' },
      outro: { speaker: '万剑真君', text: '守住山门只是开始。下一处封印，我会亲自寻回。' },
      firstClear: { gold: 520, materials: { qingqueFeather: 1, spiritSand: 2 } }, repeat: { gold: 100, materials: { swordIron: 1 } },
    },
  ];

  const gear = {
    wildBracer: { id: 'wildBracer', name: '荒原护腕', slot: 'bracer', rarity: '凡品', icon: '🪬', stats: { damage: 3 }, description: '残阵玉石制成的护腕，略微增强御剑之力。' },
    arrayRobe: { id: 'arrayRobe', name: '守阵法衣', slot: 'robe', rarity: '凡品', icon: '🧥', stats: { wallHp: 90 }, description: '蕴有残阵灵纹的法衣，能稳固护宗大阵。' },
    warmJade: { id: 'warmJade', name: '温灵玉佩', slot: 'jade', rarity: '凡品', icon: '📿', stats: { goldBonus: 0.08 }, description: '温养灵息的玉佩，增加基础仙石收获。' },
    stoneTalisman: { id: 'stoneTalisman', name: '石甲镇符', slot: 'talisman', rarity: '灵品', icon: '🪨', stats: { wallHp: 120 }, description: '取石甲兽残纹炼成，进一步稳固护宗大阵。' },
  };

  const materials = {
    swordIron: { name: '剑胚残铁', icon: '⛓️' }, spiritSand: { name: '阵纹灵砂', icon: '✨' },
    pactCharm: { name: '清灵结契符', icon: '📜' }, qingqueFeather: { name: '青雀灵羽', icon: '🪶' },
  };

  const pets = {
    xunmuQingque: {
      id: 'xunmuQingque', name: '寻木青雀', icon: '🦅', rarity: '灵品',
      description: '幽冥荒原的守林灵禽，曾受裂隙妖气侵蚀，现已与天衍剑宗缔结灵契。',
      activeSkill: { name: '青翎回风', cooldown: 12, damage: 42, slow: 2.4, description: '唤起青羽灵风，重创最前方妖物，并短暂迟缓周围妖物。' },
      levelCap: 5, upgrade: { gold: 180, feather: 1, damage: 10, cooldownReduction: 0.5 },
    },
  };

  globalThis.P1_CONFIG = { stages, gear, materials, pets };
})();
