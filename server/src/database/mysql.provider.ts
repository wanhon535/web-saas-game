import { Injectable } from '@nestjs/common';

/**
 * MySQL 数据库连接池适配组件
 */
@Injectable()
export class MysqlProvider {
    private config = {
        host: process.env.MYSQL_HOST || '127.0.0.1',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'root',
        database: process.env.MYSQL_DATABASE || 'xiuxian_game'
    };

    public async query(sql: string, params: any[] = []): Promise<any> {
        // 此处封装 mysql2 连接池 query 逻辑
        console.log(`[MySQL Query] ${sql} | Params: ${JSON.stringify(params)}`);
        return [];
    }
}
