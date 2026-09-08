import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    await app.listen(3000);
    console.log("==========================================");
    console.log("《修仙御兽：万剑封妖》服务端服务已成功启动！");
    console.log("监听地址: http://127.0.0.1:3000");
    console.log("==========================================");
}
bootstrap();
