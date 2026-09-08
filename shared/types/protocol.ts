// 共享网络请求与响应 API 协议定义 (JSON Schema Types)

export interface UserInfo {
    userId: string;
    username: string;
    level: number;
    stamina: number;
    gold: number;
}

export interface Equipment {
    id: string;
    equipId: string;
    equipName: string;
    quality: string;
    power: number;
}

export interface Pet {
    id: string;
    petId: string;
    petName: string;
    quality: string;
    skills: string[];
}

export interface LoadPlayerReq {
    userId: string;
    token?: string;
}

export interface LoadPlayerResp {
    code: number;
    message?: string;
    data: {
        userInfo: UserInfo;
        equipments: Equipment[];
        pets: Pet[];
        inventory: Record<string, number>;
    };
}

export interface CatchBossReq {
    userId: string;
    dungeonId: string;
    bossId: string;
    itemKey: 'item_paper_talisman' | 'item_gourd' | 'item_rope' | 'item_god_banner';
    bossHpPercent: number;
}

export interface CatchBossResp {
    code: number;
    message?: string;
    data: {
        success: boolean;
        capturedPet?: Pet;
        remainingItems: number;
        clearType: 'phase_2_success' | 'phase_2_fail_enraged';
        reason?: string;
    };
}

export interface GuaranteeCraftReq {
    userId: string;
    targetEquipId: string;
}

export interface GuaranteeCraftResp {
    code: number;
    message?: string;
    data: {
        success: boolean;
        equipment?: Equipment;
        remainingCores: number;
    };
}
