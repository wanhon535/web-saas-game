import { Injectable } from '@nestjs/common';

@Injectable()
export class PlayerService {
    public async loadPlayer(userId: string) {
        return {
            code: 200,
            data: {
                userInfo: { userId, username: "修仙者001", level: 10, stamina: 100, gold: 50000 },
                equipments: [
                    { id: "eq_01", equipId: "sword_01", equipName: "紫霄仙剑", quality: "epic", power: 1200 }
                ],
                pets: [
                    { id: "pet_101", petId: "fox_01", petName: "九尾天狐", quality: "epic", skills: ["ice_storm"] }
                ],
                inventory: {
                    item_paper_talisman: 10,
                    item_gourd: 5,
                    item_rope: 2,
                    item_god_banner: 1,
                    purgatory_core: 52,
                    epic_ticket: 3
                }
            }
        };
    }
}
