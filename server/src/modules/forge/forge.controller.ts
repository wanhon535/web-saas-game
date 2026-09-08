import { Controller, Post, Body } from '@nestjs/common';
import { ForgeService } from './forge.service';

@Controller('api/forge')
export class ForgeController {
    constructor(private readonly forgeService: ForgeService) {}

    @Post('guarantee-craft')
    async guaranteeCraft(@Body() body: { userId: string; targetEquipId: string }) {
        return this.forgeService.guaranteeCraft(
            body.userId || 'usr_local_test',
            body.targetEquipId || 'equip_mirror_01'
        );
    }
}
