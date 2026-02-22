
const { DataSource } = require('typeorm');
const { User } = require('./dist/users/user.entity');
const { Message } = require('./dist/chat/message.entity');
const { Ban } = require('./dist/admin/ban.entity');
const { Block } = require('./dist/blocks/block.entity');
const { Friendship } = require('./dist/social/entities/friendship.entity');
const { WallPost } = require('./dist/social/entities/wall-post.entity');
const { UserGift } = require('./dist/social/entities/user-gift.entity');
const { Notification } = require('./dist/notifications/notification.entity');
const { SupportMessage } = require('./dist/support/support-message.entity');
const { Gift } = require('./dist/social/entities/gift.entity');
const { Report } = require('./dist/reports/report.entity');
const { Room } = require('./dist/chat/room.entity');
const { AuditLog } = require('./dist/chat/audit-log.entity');

async function testTypeORM() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'sa',
        password: 'sa1234',
        database: 'lovelink_db',
        entities: [User, Message, Ban, Block, Friendship, WallPost, UserGift, Notification, SupportMessage, Gift, Report, Room, AuditLog],
        synchronize: false,
    });

    await dataSource.initialize();
    const repo = dataSource.getRepository(User);
    const user = await repo.findOne({ where: { email: 'testuser1703728589@example.com' } });
    console.log('TypeORM result:', JSON.stringify(user, null, 2));
    await dataSource.destroy();
}

testTypeORM().catch(console.error);
