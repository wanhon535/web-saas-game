import { Module } from '@nestjs/common';
import { MysqlProvider } from './database/mysql.provider';
import { PlayerController } from './modules/player/player.controller';
import { PlayerService } from './modules/player/player.service';
import { CatchController } from './modules/combat/catch.controller';
import { CatchService } from './modules/combat/catch.service';
import { ForgeController } from './modules/forge/forge.controller';
import { ForgeService } from './modules/forge/forge.service';

@Module({
    imports: [],
    controllers: [PlayerController, CatchController, ForgeController],
    providers: [MysqlProvider, PlayerService, CatchService, ForgeService],
})
export class AppModule {}
