import { _decorator, Component, Node } from 'cocos';
import { EventManager, GAME_EVENTS } from '../core/EventManager';
const { ccclass, property } = _decorator;

@ccclass('BossController')
export class BossController extends Component {
    @property
    public maxHp: number = 10000;
    public currentHp: number = 10000;
    
    public isWeakened: boolean = false;
    public isEnraged: boolean = false;

    public takeDamage(amount: number) {
        this.currentHp = Math.max(0, this.currentHp - amount);
        const hpPercent = this.currentHp / this.maxHp;

        // BOSS 血量跌破 25% 触发衰弱状态与浮窗提示
        if (hpPercent <= 0.25 && !this.isWeakened) {
            this.isWeakened = true;
            this.triggerWeakState();
        }
    }

    private triggerWeakState() {
        console.log("[BossController] BOSS 血量低于 25%，触发衰弱与抓捕机制！");
        EventManager.emit(GAME_EVENTS.BOSS_WEAKENED, { bossHpPercent: this.currentHp / this.maxHp });
    }

    public onClickBoss() {
        if (this.isWeakened && !this.isEnraged) {
            EventManager.emit(GAME_EVENTS.SHOW_CATCH_BAR);
        }
    }
}
