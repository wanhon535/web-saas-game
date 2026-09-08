import { _decorator } from 'cocos';

/**
 * 客户端网络通信单例 (支持 本地/测试/抖音/微信 环境变量)
 */
export class NetworkManager {
    private static _instance: NetworkManager;
    private baseUrl: string = "http://127.0.0.1:3000"; // 默认本地开发服务端地址

    public static get instance(): NetworkManager {
        if (!this._instance) this._instance = new NetworkManager();
        return this._instance;
    }

    public setBaseUrl(url: string) {
        this.baseUrl = url;
    }

    public async request<T = any>(endpoint: string, data: any): Promise<T | null> {
        try {
            const response = await fetch(this.baseUrl + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                console.error(`[Network] HTTP Error ${response.status}`);
                return null;
            }
            return await response.json();
        } catch (err) {
            console.error("[Network] Error requesting endpoint:", endpoint, err);
            return null;
        }
    }
}
