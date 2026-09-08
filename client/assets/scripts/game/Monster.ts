import { _decorator, Component, Vec3, Node } from 'cocos';
import { NodePoolManager } from '../core/NodePoolManager';
import { EventManager, GAME_EVENTS } from '../core/EventManager';
const { ccclass, property } = _decorator;

@ccclass('Monster')
export class Monster extends Component {
    @property
    public maxHp: number = 100;
    public currentHp: number = 100;
    @property
    public moveSpeed: number = 120;

    private targetPlayer: Node | null = null;

    public init(startPos: Vec3, playerNode: Node, hp: number = 100) {
        this.node.setPosition(startPos);
        this.targetPlayer = playerNode;
        this.maxHp = hp;
        this.currentHp = hp;
    }

    public takeDamage(amount: number) {
        this.currentHp -= amount;
        if (this.currentHp <= 0) {
            this.onDead();
        }
    }

    private onDead() {
        console.log('[Monster] 怪物被击杀，产生金币掉落！');
        EventManager.emit('MONSTER_DIED', { gold: 10 });
        NodePoolManager.put(this.node);
    }

    update(deltaTime: number) {
        if (!this.targetPlayer || !this.targetPlayer.isValid) return;

        const pos = this.node.position;
        const playerPos = this.targetPlayer.position;
        const dir = new Vec3();
        Vec3.subtract(dir, playerPos, pos);
        dir.normalize();

        const nextPos = new Vec3();
        Vec3.scaleAndAdd(nextPos, pos, dir, this.moveSpeed * deltaTime);
        this.node.setPosition(nextPos);
    }
}