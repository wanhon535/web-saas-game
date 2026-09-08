import { _decorator, Node, Prefab, instantiate, NodePool } from 'cocos';

/**
 * 高性能节点对象池（万剑归宗子弹与怪物渲染，支持 500+ 单位不卡顿）
 */
export class NodePoolManager {
    private static pools: Map<string, NodePool> = new Map();

    public static get(prefab: Prefab): Node {
        const name = prefab.name;
        if (!this.pools.has(name)) {
            this.pools.set(name, new NodePool());
        }
        const pool = this.pools.get(name)!;
        return pool.size() > 0 ? pool.get()! : instantiate(prefab);
    }

    public static put(node: Node) {
        const name = node.name;
        if (this.pools.has(name)) {
            this.pools.get(name)!.put(node);
        } else {
            node.destroy();
        }
    }

    public static clearAll() {
        this.pools.forEach(pool => pool.clear());
        this.pools.clear();
    }
}
