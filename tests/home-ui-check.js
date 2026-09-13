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
const quickNavIndex = homeMarkup.indexOf('id="homeQuickNav"');
const scrollIndex = homeMarkup.indexOf('<main class="home-scroll">');
assert(!homeMarkup.includes('class="tabbar"'), '首页不再保留旧的重复页面导航');
assert(quickNavIndex > scrollIndex, '首页主导航位于页面内容之后的底部区域');
assert(homeMarkup.includes('class="home-utility-rail home-utility-left"') && homeMarkup.includes('data-action="toggle-home-promos"'), '活动与福利恢复为首页左侧收纳入口');
assert(!homeMarkup.includes('class="home-bottom-promo"'), '首页底部只保留主导航，不再放置活动栏');
assert(css.includes('.home-quick-nav { position: absolute;') && css.includes('bottom: 0;') && css.includes('.home-utility-left { left: 0;') && css.includes('.home-promo-panel[hidden] { display: none; }'), '首页底部主导航与左侧活动收纳样式存在');
assert(game.includes('function toggleHomePromos(show)') && game.includes('function openHomePlaceholder(title, icon ='), '首页收纳与占位窗口交互已接入');
assert(game.includes('setText("jadeTop", "0")') && game.includes('setText("homePowerValue", currentPower())'), '首页资产与修为展示由现有数据刷新');
assert(!game.includes('仙石'), '玩家可见的游戏文本已统一使用灵石');
const petMarkup = html.match(/<section id="pet"[\s\S]*?<section id="battle"/)?.[0] || '';
assert(!petMarkup.includes('class="topbar pet-topbar"') && !petMarkup.includes('万灵御兽录 · 御兽培养'), '灵宠页不再显示独立顶部标题栏');
assert(!petMarkup.includes('<div class="page-heading-row">'), '灵宠页不再显示旧版重复标题栏');
assert(petMarkup.includes('class="pet-showcase-meta"') && petMarkup.includes('class="pet-gourd-count"') && petMarkup.includes('id="gourdPet"'), '镇妖葫芦数量收纳在当前出战信息栏');
assert(!css.includes('#pet .pet-topbar') && css.includes('.pet-showcase-meta') && css.includes('.pet-showcase-head .pet-gourd-count'), '灵宠页移除标题栏并保留首屏道具信息样式');
assert(petMarkup.includes('id="petQuickNav"') && petMarkup.includes('class="home-quick-nav pet-main-nav"'), '灵宠页使用与首页统一的五项主导航');
assert(!petMarkup.includes('class="tabbar"') && !petMarkup.includes('>荒原<') && !petMarkup.includes('>法宝<'), '灵宠页不再保留旧三项返回导航');
for (const label of ['仙坊', '灵宠', '妖隙', '剑域', '宗门']) assert(petMarkup.includes('>' + label + '<'), '灵宠页主导航显示「' + label + '」');
assert(homeMarkup.includes('<button data-action="open-home"><i>隙</i><span>妖隙</span></button>') && petMarkup.includes('data-action="open-home"'), '首页与灵宠页妖隙均只使用统一返回首页动作');
assert((html.match(/data-action="toggle-chapter-drawer"/g) || []).length === 1 && html.includes('id="chapterDrawerToggle"'), '副本选择面板只允许通过首页“选择副本”按钮打开');
assert(!game.includes('RIFT_NAVIGATION_GUARD_MS') && !game.includes('riftNavigationGuardUntil'), '妖隙不再依赖限时点击保护，也不保留展开副本的旧关联逻辑');
assert(game.includes('function returnHomeFromRift() {\n    toggleChapterDrawer(false);\n    open("home");\n  }'), '每次点击妖隙都会关闭副本选择面板并回到首页');
assert(game.includes('if (a === "toggle-chapter-drawer") toggleChapterDrawer();') && game.includes('a === "open-home-placeholder"') && game.includes('a === "open-home"') && !game.includes('a === "open-chapter-home"'), '选择副本与妖隙导航动作已严格分离');

console.log(`首页 UI 检查通过：${assertions} 项断言全部通过。`);
