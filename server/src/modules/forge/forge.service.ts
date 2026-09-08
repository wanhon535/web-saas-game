import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ForgeService {
    public async guaranteeCraft(userId: string, targetEquipId: string) {
        const userCores = 52; // 模拟从 MySQL 数据库查询
        
        if (userCores < 50) {
            throw new BadRequestException("炼狱晶核不足50个！");
        }

        return {
            code: 200,
            data: {
                success: true,
                equipment: {
                    id: "eq_" + Date.now(),
                    equipId: targetEquipId || "equip_mirror_01",
                    equipName: "史诗·昊天镜",
                    quality: "epic_purgatory",
                    power: 2500
                },
                remainingCores: userCores - 50
            }
        };
    }
}
