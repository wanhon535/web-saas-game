import { _decorator, Component, Label } from 'cocos';
import { NetworkManager } from '../core/NetworkManager';
import { EventManager, GAME_EVENTS } from '../core/EventManager';
const { ccclass, property } = _decorator;

@ccclass('MainUI')
export class MainUI extends Component {
    @property(Label)
    public goldLabel: Label = null!;
    @property(Label)
    public staminaLabel: Label = null!;
    @property(Label)
    public coreLabel: Label = null!;

    async start() {
        await this.loadPlayerData();
    }

    public async loadPlayerData() {
        const res = await NetworkManager.instance.request<{ code: number; data: any }>('/api/player/load', {
            userId: 'usr_local_test'
        });

        if (res && res.code === 200 && res.data) {
            const info = res.data.userInfo;
            const inv = res.data.inventory;
            if (this.goldLabel) this.goldLabel.string = String(info.gold);
            if (this.staminaLabel) this.staminaLabel.string = `${info.stamina}/100`;
            if (this.coreLabel) this.coreLabel.string = `${inv.purgatory_core || 0}/50`;
        }
    }
}