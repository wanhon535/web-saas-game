/**
 * P1.1 第一章静态内容配置。
 * 此文件定义当前客户端原型的关卡、奖励、材料与固定装备数据来源。
 */
(() => {
  const stages = [
    {
      id: '1-01',
      title: '荒原警兆',
      type: 'normal',
      unlockedByDefault: true,
      recommendedPower: 126,
      intro: { speaker: '裴观岳', text: '阵眼将碎。先守山门，其余真相，待妖潮退后再问。' },
      outro: { speaker: '万剑真君', text: '剑还在。便先斩开一条生路。' },
      waves: 2,
      firstClear: { gold: 180, materials: { swordIron: 2 } },
      repeat: { gold: 70, materials: { swordIron: 1 } },
    },
    {
      id: '1-02',
      title: '残阵回响',
      type: 'normal',
      unlockedByDefault: false,
      recommendedPower: 145,
      intro: { speaker: '裴观岳', text: '残阵尚有余烬，守住这一息，妖潮的来处便有迹可循。' },
      outro: { speaker: '叶轻舟', text: '荒原里还有能用的残器，别让它们埋在妖尘里。' },
      waves: 2,
      firstClear: { gold: 220, materials: { swordIron: 3 }, gear: 'wildBracer' },
      repeat: { gold: 85, materials: { swordIron: 1 } },
    },
    {
      id: '1-03',
      title: '剑痕拾遗',
      type: 'normal',
      unlockedByDefault: false,
      recommendedPower: 168,
      intro: { speaker: '叶轻舟', text: '拾起残器，护住剑意。天衍剑宗还未到绝路。' },
      outro: { speaker: '万剑真君', text: '剑痕未灭，便还有人曾在此处镇妖。' },
      waves: 3,
      firstClear: { gold: 260, materials: { swordIron: 4 }, gear: 'arrayRobe' },
      repeat: { gold: 100, materials: { swordIron: 2 } },
    },
    {
      id: '1-09',
      title: '寻木巢穴',
      type: 'boss',
      unlockedByDefault: false,
      recommendedPower: 210,
      lockedReason: '完成前三个普通关后于后续迭代开放',
    },
  ];

  const gear = {
    wildBracer: {
      id: 'wildBracer',
      name: '荒原护腕',
      slot: 'bracer',
      rarity: '凡品',
      icon: '🪬',
      stats: { damage: 3 },
      description: '残阵玉石制成的护腕，略微增强御剑之力。',
    },
    arrayRobe: {
      id: 'arrayRobe',
      name: '守阵法衣',
      slot: 'robe',
      rarity: '凡品',
      icon: '🧥',
      stats: { wallHp: 90 },
      description: '蕴有残阵灵纹的法衣，能稳固护宗大阵。',
    },
    warmJade: {
      id: 'warmJade',
      name: '温灵玉佩',
      slot: 'jade',
      rarity: '凡品',
      icon: '📿',
      stats: { goldBonus: 0.08 },
      description: '温养灵息的玉佩，增加基础仙石收获。',
    },
  };

  globalThis.P1_CONFIG = { stages, gear, materials: { swordIron: { name: '剑胚残铁', icon: '⛓️' } } };
})();
