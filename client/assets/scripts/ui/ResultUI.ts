import { _decorator, Component, Node, Label } from 'cocos';
import { EventManager, GAME_EVENTS } from '../core/EventManager';
const { ccclass, property } = _decorator;

@ccclass('ResultUI')
export class ResultUI extends Component {
    @property(Node)
    public resultModal: Node = null!;
    @property(Label)
    public titleLabel: Label = null!;
    @property(Label)
    public descLabel: Label = null!;
    @property(Label)
    public badgeLabel: Label = null!;

    onLoad() {
        EventManager.on(GAME_EVENTS.CATCH_RESULT, this.onCatchResult, this);
    }

    onDestroy() {
        EventManager.off(GAME_EVENTS.CATCH_RESULT, this.onCatchResult, this);
    }

    public onCatchResult(data: { success: boolean; pet?: any }) {
        if (!this.resultModal) return;
        this.resultModal.active = true;

        if (data.success) {
            if (this.badgeLabel) this.badgeLabel.string = 'S 级通关';
            if (this.titleLabel) this.titleLabel.string = 'S 级大满贯通关！';
            if (this.descLabel) this.descLabel.string = `🔮 契印成功！收服【${data.pet ? data.pet.petName : '灵宠'}】进入仙宠阁！获得双重重宝结算！`;
        } else {
            if (this.badgeLabel) this.badgeLabel.string = 'A 级狂暴阶段';
            if (this.titleLabel) this.titleLabel.string = '抓捕失败！BOSS 狂暴！';
            if (this.descLabel) this.descLabel.string = '⚠️ BOSS 挣脱符印并触发狂暴反弹，请彻底击杀 BOSS 以获取 A 级装备结算！';
        }
    }

    public onClose() {
        if (this.resultModal) this.resultModal.active = false;
    }
}