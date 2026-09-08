import { _decorator, Component, Node, tween, Vec3 } from 'cocos';
import { NetworkManager } from '../core/NetworkManager';
import { EventManager, GAME_EVENTS } from '../core/EventManager';
const { ccclass, property } = _decorator;

@ccclass('CatchBarUI')
export class CatchBarUI extends Component {
    @property(Node)
    public catchPanel: Node = null!;

    onLoad() {
        EventManager.on(GAME_EVENTS.SHOW_CATCH_BAR, this.showCatchBar, this);
    }

    onDestroy() {
        EventManager.off(GAME_EVENTS.SHOW_CATCH_BAR, this.showCatchBar, this);
    }

    public showCatchBar() {
        if (!this.catchPanel) return;
        this.catchPanel.active = true;
        tween(this.catchPanel)
            .to(0.3, { position: new Vec3(0, -300, 0) })
            .start();
    }

    public hideCatchBar() {
        if (!this.catchPanel) return;
        this.catchPanel.active = false;
    }

    public async onSelectProp(event: Event, itemKey: string) {
        this.hideCatchBar();

        const res = await NetworkManager.instance.request<{ code: number; data: any }>('/api/combat/catch-boss', {
            userId: "usr_local_test",
            dungeonId: "dungeon_epic_01",
            bossId: "boss_fox_01",
            itemKey: itemKey,
            bossHpPercent: 0.18
        });

        if (res && res.code === 200 && res.data.success) {
            console.log("[CatchBarUI] 抓捕成功！获得宠物:", res.data.capturedPet);
            EventManager.emit(GAME_EVENTS.CATCH_RESULT, { success: true, pet: res.data.capturedPet });
        } else {
            console.log("[CatchBarUI] 抓捕失败！BOSS狂暴");
            EventManager.emit(GAME_EVENTS.CATCH_RESULT, { success: false });
        }
    }
}
