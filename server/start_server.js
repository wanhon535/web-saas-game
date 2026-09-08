const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, '..');

let db = {
    user: { userId: 'usr_local_test', username: '蜀山掌门', level: 15, stamina: 120, gold: 8800, combatPower: 12850 },
    inventory: {
        item_paper_talisman: 15,
        item_gourd: 8,
        item_rope: 3,
        item_god_banner: 1,
        purgatory_core: 68,
        epic_ticket: 5,
        pet_shards: 18
    },
    equipped: {
        weapon: { id: 'eq_w01', slot: 'weapon', name: '史诗·紫霄仙剑', icon: '🗡️', quality: 'epic', atk: 120, hp: 0, crit: 0.08 },
        armor: { id: 'eq_a01', slot: 'armor', name: '帝品·八卦道袍', icon: '🥋', quality: 'emperor', atk: 0, hp: 800, crit: 0.0 },
        ring: { id: 'eq_r01', slot: 'ring', name: '仙品·阴阳乾坤戒', icon: '💍', quality: 'spirit', atk: 30, hp: 100, crit: 0.12 },
        boots: { id: 'eq_b01', slot: 'boots', name: '神行踏云履', icon: '👟', quality: 'spirit', atk: 15, hp: 150, crit: 0.02 },
        artifact: { id: 'eq_art01', slot: 'artifact', name: '神话·昊天神镜', icon: '🪞', quality: 'myth', atk: 200, hp: 500, crit: 0.15 }
    },
    equipments: [
        { id: 'eq_101', slot: 'weapon', name: '凡品·木剑', icon: '🗡️', quality: 'common', atk: 15, hp: 0 },
        { id: 'eq_102', slot: 'ring', name: '太乙符箓', icon: '📜', quality: 'epic', atk: 45, hp: 120, crit: 0.06 },
        { id: 'eq_103', slot: 'armor', name: '紫金仙冠', icon: '👑', quality: 'myth', atk: 110, hp: 450 }
    ],
    pets: [
        { id: 'pet_101', petId: 'bird_01', petName: '寻木青雀', icon: '🐦', quality: 'epic', skills: ['wind_blade'] },
        { id: 'pet_102', petId: 'alpaca_01', petName: '金光欧皇羊驼', icon: '🦙', quality: 'myth', skills: ['luck_buff'] }
    ]
};

const propRates = {
    item_paper_talisman: 0.20,
    item_gourd: 0.45,
    item_rope: 0.75,
    item_god_banner: 1.00
};

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'GET') {
        let filePath = path.join(ROOT_DIR, req.url === '/' ? 'index.html' : req.url);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath);
            const contentType = ext === '.html' ? 'text/html' : ext === '.css' ? 'text/css' : ext === '.js' ? 'application/javascript' : ext === '.json' ? 'application/json' : 'text/plain';
            res.writeHead(200, { 'Content-Type': contentType + '; charset=utf-8' });
            fs.createReadStream(filePath).pipe(res);
            return;
        }
    }

    if (req.method === 'POST') {
        let bodyStr = '';
        req.on('data', chunk => bodyStr += chunk);
        req.on('end', () => {
            let body = {};
            try { body = JSON.parse(bodyStr); } catch(e) {}

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });

            if (req.url === '/api/player/load') {
                res.end(JSON.stringify({
                    code: 200,
                    data: {
                        userInfo: db.user,
                        equipped: db.equipped,
                        equipments: db.equipments,
                        pets: db.pets,
                        inventory: db.inventory
                    }
                }));
                return;
            }

            if (req.url === '/api/combat/catch-boss') {
                const { itemKey, bossHpPercent, isSecondChance } = body;
                if (bossHpPercent > 0.30) {
                    res.end(JSON.stringify({ code: 400, message: 'BOSS未处于衰弱状态，无法抓捕！' }));
                    return;
                }
                let rate = propRates[itemKey] || 0.20;
                if (isSecondChance) rate = Math.min(1.0, rate + 0.20);

                const count = db.inventory[itemKey] || 0;
                if (count <= 0) {
                    res.end(JSON.stringify({ code: 400, message: '抓捕法宝数量不足！' }));
                    return;
                }
                db.inventory[itemKey] -= 1;
                const roll = Math.random();
                const isSuccess = roll <= rate;
                if (isSuccess) {
                    const newPet = { id: 'pet_' + Date.now(), petId: 'boss_pet', petName: '赤焰九尾狐灵宠', icon: '🦊', quality: 'myth', skills: ['boss_breath'] };
                    db.pets.push(newPet);
                    res.end(JSON.stringify({
                        code: 200,
                        data: {
                            success: true,
                            capturedPet: newPet,
                            remainingItems: db.inventory[itemKey],
                            clearType: 'phase_2_success'
                        }
                    }));
                } else {
                    db.inventory.pet_shards = (db.inventory.pet_shards || 0) + 3;
                    res.end(JSON.stringify({
                        code: 200,
                        data: {
                            success: false,
                            remainingItems: db.inventory[itemKey],
                            compensationShards: 3,
                            totalShards: db.inventory.pet_shards,
                            clearType: 'phase_2_fail_enraged',
                            reason: 'BOSS受到惊吓进入狂暴！已发放【灵兽精魄 x3】保底！'
                        }
                    }));
                }
                return;
            }

            if (req.url === '/api/combat/calm-boss') {
                if (db.user.gold < 200) {
                    res.end(JSON.stringify({ code: 400, message: '仙石不足以购买安神灵符！' }));
                    return;
                }
                db.user.gold -= 200;
                res.end(JSON.stringify({
                    code: 200,
                    data: {
                        success: true,
                        remainingGold: db.user.gold,
                        message: '成功使用【安神灵符】，BOSS被平息回衰弱弱化状态！'
                    }
                }));
                return;
            }

            if (req.url === "/api/combat/stage-clear") {
                const { stageId, goldEarned, equipsEarned } = body;
                db.user.gold += (goldEarned || 0);
                if (Array.isArray(equipsEarned)) {
                    equipsEarned.forEach(eName => {
                        db.equipments.push({
                            id: "eq_" + Date.now() + "_" + Math.floor(Math.random()*1000),
                            slot: "weapon",
                            name: eName,
                            icon: "🗡️",
                            quality: "epic",
                            atk: 50,
                            hp: 0
                        });
                    });
                }
                res.end(JSON.stringify({
                    code: 200,
                    data: {
                        success: true,
                        totalGold: db.user.gold,
                        equipCount: db.equipments.length,
                        message: "副本关卡通关成功！收益已同步落库！"
                    }
                }));
                return;
            }

            if (req.url === '/api/forge/guarantee-craft') {
                if (db.inventory.purgatory_core < 50) {
                    res.end(JSON.stringify({ code: 400, message: '炼狱晶核不足50个！' }));
                    return;
                }
                db.inventory.purgatory_core -= 50;
                const newEquip = { id: 'eq_' + Date.now(), slot: 'artifact', name: '神话·昊天神镜', icon: '🪞', quality: 'myth', atk: 350, hp: 1200, crit: 0.15 };
                db.equipments.push(newEquip);
                res.end(JSON.stringify({
                    code: 200,
                    data: {
                        success: true,
                        equipment: newEquip,
                        remainingCores: db.inventory.purgatory_core
                    }
                }));
                return;
            }

            res.end(JSON.stringify({ code: 404, message: 'Endpoint not found' }));
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log('==================================================');
    console.log('《修仙御兽：万剑封妖》P0 MVP 服务端已运行！');
    console.log('请在浏览器打开: http://127.0.0.1:' + PORT);
    console.log('==================================================');
});
