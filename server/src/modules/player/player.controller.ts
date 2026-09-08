import { Controller, Post, Body } from '@nestjs/common';
import { PlayerService } from './player.service';

@Controller('api/player')
export class PlayerController {
    constructor(private readonly playerService: PlayerService) {}

    @Post('load')
    async loadPlayer(@Body() body: { userId: string }) {
        return this.playerService.loadPlayer(body.userId || 'usr_local_test');
    }
}
