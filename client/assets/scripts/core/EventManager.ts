/**
 * 全局轻量级事件总线
 */
export class EventManager {
    private static listeners: Map<string, Function[]> = new Map();

    public static on(event: string, fn: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(fn);
    }

    public static off(event: string, fn: Function) {
        if (!this.listeners.has(event)) return;
        const arr = this.listeners.get(event)!;
        const idx = arr.indexOf(fn);
        if (idx >= 0) arr.splice(idx, 1);
    }

    public static emit(event: string, ...args: any[]) {
        if (!this.listeners.has(event)) return;
        this.listeners.get(event)!.forEach(fn => fn(...args));
    }
}

// 常用事件 KEY 定义
export const GAME_EVENTS = {
    BOSS_WEAKENED: "BOSS_WEAKENED",      // Boss 血量跌破 25% 进入衰弱
    SHOW_CATCH_BAR: "SHOW_CATCH_BAR",    // 显示抓捕快捷栏
    CATCH_RESULT: "CATCH_RESULT",        // 抓捕判定结果
    CURRENCY_CHANGED: "CURRENCY_CHANGED" // 货币更新
};
