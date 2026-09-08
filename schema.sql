-- 《修仙御兽：万剑封妖》 MySQL 数据库建表脚本 (P0 核心数据表)

CREATE DATABASE IF NOT EXISTS `xiuxian_game` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `xiuxian_game`;

-- 玩家基础数据表
CREATE TABLE IF NOT EXISTS `users` (
    `user_id` VARCHAR(64) NOT NULL PRIMARY KEY COMMENT '玩家ID',
    `username` VARCHAR(64) NOT NULL COMMENT '玩家名称',
    `level` INT NOT NULL DEFAULT 1 COMMENT '玩家等级',
    `stamina` INT NOT NULL DEFAULT 100 COMMENT '体力值',
    `gold` BIGINT NOT NULL DEFAULT 0 COMMENT '金币',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='玩家账号信息';

-- 玩家背包与道具表
CREATE TABLE IF NOT EXISTS `user_inventory` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `item_key` VARCHAR(64) NOT NULL COMMENT '道具KEY (item_paper_talisman, item_gourd, item_rope, item_god_banner, purgatory_core, epic_ticket)',
    `count` INT NOT NULL DEFAULT 0,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_item` (`user_id`, `item_key`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='玩家背包道具';

-- 玩家装备表
CREATE TABLE IF NOT EXISTS `user_equipments` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY COMMENT '装备唯一实例ID',
    `user_id` VARCHAR(64) NOT NULL,
    `equip_id` VARCHAR(64) NOT NULL COMMENT '装备配置ID',
    `equip_name` VARCHAR(64) NOT NULL COMMENT '装备名称',
    `quality` VARCHAR(32) NOT NULL COMMENT '品质 (common, rare, epic, epic_purgatory)',
    `power` INT NOT NULL DEFAULT 0 COMMENT '战斗力',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='玩家装备实例';

-- 玩家灵宠表
CREATE TABLE IF NOT EXISTS `user_pets` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY COMMENT '灵宠唯一实例ID',
    `user_id` VARCHAR(64) NOT NULL,
    `pet_id` VARCHAR(64) NOT NULL COMMENT '灵宠配置ID',
    `pet_name` VARCHAR(64) NOT NULL COMMENT '灵宠名称',
    `quality` VARCHAR(32) NOT NULL COMMENT '品质 (common, epic, myth)',
    `skills` JSON NULL COMMENT '技能列表 JSON',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='玩家灵宠实例';

-- 初始测试数据
INSERT INTO `users` (`user_id`, `username`, `level`, `stamina`, `gold`) 
VALUES ('usr_local_test', '修仙者001', 10, 100, 50000)
ON DUPLICATE KEY UPDATE `gold` = 50000;

INSERT INTO `user_inventory` (`user_id`, `item_key`, `count`) VALUES
('usr_local_test', 'item_paper_talisman', 10),
('usr_local_test', 'item_gourd', 5),
('usr_local_test', 'item_rope', 2),
('usr_local_test', 'item_god_banner', 1),
('usr_local_test', 'purgatory_core', 52),
('usr_local_test', 'epic_ticket', 3)
ON DUPLICATE KEY UPDATE `count` = VALUES(`count`);
