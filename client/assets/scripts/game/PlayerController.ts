import { _decorator, Component, Vec3, KeyCode, input, Input, EventKeyboard } from 'cocos';
const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {
    @property
    public moveSpeed: number = 300;

    private moveDir: Vec3 = new Vec3(0, 0, 0);

    onLoad() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    private onKeyDown(event: EventKeyboard) {
        if (event.keyCode === KeyCode.KEY_W) this.moveDir.y = 1;
        if (event.keyCode === KeyCode.KEY_S) this.moveDir.y = -1;
        if (event.keyCode === KeyCode.KEY_A) this.moveDir.x = -1;
        if (event.keyCode === KeyCode.KEY_D) this.moveDir.x = 1;
    }

    private onKeyUp(event: EventKeyboard) {
        if (event.keyCode === KeyCode.KEY_W || event.keyCode === KeyCode.KEY_S) this.moveDir.y = 0;
        if (event.keyCode === KeyCode.KEY_A || event.keyCode === KeyCode.KEY_D) this.moveDir.x = 0;
    }

    update(deltaTime: number) {
        if (this.moveDir.lengthSqr() > 0) {
            const pos = this.node.position;
            const targetPos = new Vec3();
            Vec3.scaleAndAdd(targetPos, pos, this.moveDir.normalize(), this.moveSpeed * deltaTime);
            this.node.setPosition(targetPos);
        }
    }
}
