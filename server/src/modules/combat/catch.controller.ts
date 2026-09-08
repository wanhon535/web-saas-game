import { Controller, Post, Body } from '@nestjs/common';
import { CatchService } from './catch.service';

@Controller('api/combat')
export class CatchController {
    constructor(private readonly catchService: CatchService) {}

    @Post('catch-boss')
    async catchBoss(@Body() body: { userId: string; itemKey: string; bossHpPercent: number }) {
        return this.catchService.processCatch(
            body.userId || 'usr_local_test',
            body.itemKey || 'item_gourd',
            body.bossHpPercent || 0.18
        );
    }
}
