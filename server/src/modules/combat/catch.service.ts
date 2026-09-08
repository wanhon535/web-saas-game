import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class CatchService {
    // P0 道具服务端抓捕基础概率表
    private propRates: Record<string, number> = {
        'item_paper_talisman': 0.15,
        'item_gourd': 0.35,
        'item_rope': 0.65,
        'item_god_banner': 1.00
    };

    public async processCatch(userId: string, itemKey: string, bossHpPercent: number) {
        if (bossHpPercent > 0.25) {
            throw new BadRequestException("BOSS未处于衰弱状态 (HP > 25%)，抓捕失败！");
        }

        const baseRate = this.propRates[itemKey];
        if (baseRate === undefined) {
            throw new BadRequestException("无效的抓捕道具！");
        }

        // 服务端独立随机判定，防前端作弊
        const roll = Math.random();
        const isSuccess = roll <= baseRate;

        if (isSuccess) {
            return {
                code: 200,
                data: {
                    success: true,
                    capturedPet: {
                        id: "pet_" + Date.now(),
                        petId: "pet_fox_01",
                        petName: "九尾天狐灵宠",
                        quality: "epic",
                        skills: ["ice_storm"]
                    },
                    remainingItems: 4,
                    clearType: "phase_2_success"
                }
            };
        } else {
            return {
                code: 200,
                data: {
                    success: false,
                    remainingItems: 4,
                    clearType: "phase_2_fail_enraged",
                    reason: "BOSS受惊解封并进入狂暴反弹状态！"
                }
            };
        }
    }
}
