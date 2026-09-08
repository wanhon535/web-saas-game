import { _decorator, Component, AudioSource } from 'cocos';

/**
 * 音效与背景音乐单例
 */
export class AudioManager {
    private static _instance: AudioManager;
    private audioSource: AudioSource | null = null;

    public static get instance(): AudioManager {
        if (!this._instance) this._instance = new AudioManager();
        return this._instance;
    }

    public playSFX(clipName: string) {
        // 音效播放桩代码
        console.log(`[Audio] Play SFX: ${clipName}`);
    }
}
