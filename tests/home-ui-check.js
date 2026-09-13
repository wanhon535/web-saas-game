'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'p0.css'), 'utf8');
const game = fs.readFileSync(path.join(root, 'p0.js'), 'utf8');
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) throw new Error(`断言失败：${message}`);
}

assert(html.includes('id="homeProfile"') && html.includes('data-nav="equip"'), '首页角色头像入口会进入现有法宝页');
assert(html.includes('ID：WJ-0001') && html.includes('Lv.1') && html.includes('id="homePowerValue"'), '首页显示玩家 ID、等级与修为');
assert(html.includes('id="goldTop"') && html.includes('灵石') && html.includes('id="jadeTop"') && html.includes('仙玉'), '首页同时显示灵石与仙玉资产');
assert(html.includes('id="homeQuickNav"'), '首页存在主题快捷标题栏');
for (const label of ['仙坊', '灵宠', '妖隙', '剑域', '宗门']) assert(html.includes(`>${label}<`), `首页快捷栏显示「${label}」`);
assert(html.includes('id="chapterDrawerToggle"') && html.includes('选择副本 ›'), '首页保留副本选择入口');
assert(html.includes('class="home-character-entry"') && html.includes('点击配置法宝'), '首页显示万剑真君角色形象入口');
assert(html.includes('id="homePromoToggle"') && html.includes('id="homePromoPanel"'), '首页活动入口可收纳');
assert(html.includes('data-placeholder-title="仙玉"') && html.includes('data-placeholder-title="特惠"') && html.includes('data-placeholder-title="活动"'), '活动收纳栏保留仙玉、特惠与活动入口');
for (const label of ['任务', '好友', '邮件']) assert(html.includes(`data-placeholder-title="${label}"`), `首页显示「${label}」快捷图标`);
assert(html.includes('id="homePlaceholderPanel"') && html.includes('data-action="close-home-placeholder"'), '暂未开发的入口使用可关闭占位窗口');
const homeMarkup = html.match(/<section id="home"[\s\S]*?<section id="equip"/)?.[0] || '';
assert(!homeMarkup.includes('class="tabbar"'), '首页不再保留重复的底部页面导航');
assert(homeMarkup.includes('class="home-bottom-promo"') && homeMarkup.includes('data-action="toggle-home-promos"'), '首页底部使用活动与福利收纳入口');
assert(css.includes('.home-quick-nav') && css.includes('.home-bottom-promo') && css.includes('.home-placeholder-panel'), '首页新增布局和底部收纳样式存在');
assert(game.includes('function toggleHomePromos(show)') && game.includes('function openHomePlaceholder(title, icon ='), '首页收纳与占位窗口交互已接入');
assert(game.includes('setText("jadeTop", "0")') && game.includes('setText("homePowerValue", currentPower())'), '首页资产与修为展示由现有数据刷新');
assert(!game.includes('仙石'), '玩家可见的游戏文本已统一使用灵石');

console.log(`首页 UI 检查通过：${assertions} 项断言全部通过。`);
