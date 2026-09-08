import { _decorator, Component, Node, Prefab, Vec3, instantiate } from 'cocos';
import { EventManager, GAME_EVENTS } from '../core/EventManager';
import { NodePoolManager } from '../core/NodePoolManager';
import { Bullet } from './Bullet';
import { Monster } from './Monster';
import { BossController } from './BossController';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    public static instance: GameManager;

    @property(Node)
    public playerNode: Node = null!;
    @property(Prefab)
    public bulletPrefab: Prefab = null!;
    @property(Prefab)
    public monsterPrefab: Prefab = null!;

    @property
    public fireInterval: number = 0.2;
    private fireTimer: number = 0;

    private isGameActive: boolean = false;

    onLoad() {
        GameManager.instance = this;
    }

    start() {
        this.startGame();
    }

    public startGame() {
        this.isGameActive = true;
        console.log('[GameManager] 战斗开始！万剑割草模式启动');
    }

    update(deltaTime: number) {
        if (!this.isGameActive) return;

        this.fireTimer += deltaTime;
        if (this.fireTimer >= this.fireInterval) {
            this.fireTimer = 0;
            this.shootSwordBullets();
        }
    }

    private shootSwordBullets() {
        if (!this.playerNode || !this.bulletPrefab) return;

        const pPos = this.playerNode.position;
        const angles = [-0.2, 0, 0.2];
        angles.forEach(angleX => {
            const bulletNode = NodePoolManager.get(this.bulletPrefab);
            bulletNode.parent = this.node;
            const bScript = bulletNode.getComponent(Bullet) || bulletNode.addComponent(Bullet);
            bScript.init(pPos, new Vec3(angleX, 1, 0));
        });
    }
}