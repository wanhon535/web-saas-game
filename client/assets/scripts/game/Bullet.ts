import { _decorator, Component, Vec3, Node } from 'cocos';
import { NodePoolManager } from '../core/NodePoolManager';
const { ccclass, property } = _decorator;

@ccclass('Bullet')
export class Bullet extends Component {
    @property
    public speed: number = 800;
    @property
    public damage: number = 50;

    private flyDir: Vec3 = new Vec3(0, 1, 0);

    public init(startPos: Vec3, direction: Vec3) {
        this.node.setPosition(startPos);
        this.flyDir.set(direction).normalize();
    }

    update(deltaTime: number) {
        const pos = this.node.position;
        const nextPos = new Vec3();
        Vec3.scaleAndAdd(nextPos, pos, this.flyDir, this.speed * deltaTime);
        this.node.setPosition(nextPos);

        // 超出视口范围回收回对象池
        if (Math.abs(nextPos.y) > 1000 || Math.abs(nextPos.x) > 600) {
            NodePoolManager.put(this.node);
        }
    }
}