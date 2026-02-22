import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: Redis;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        try {
            this.client = new Redis({
                host: this.configService.get('REDIS_HOST') || '127.0.0.1',
                port: this.configService.get('REDIS_PORT') || 6379,
                connectTimeout: 5000,
                maxRetriesPerRequest: 3,
            });
            console.log('✅ ioredis client instance created');
            this.client.on('error', (err) => {
                console.error('❌ Redis Error:', err);
            });
            this.client.on('connect', () => {
                console.log('✅ Connected to Redis');
            });
        } catch (e) {
            console.error('❌ Redis Connection Failed:', e);
        }
    }

    onModuleDestroy() {
        this.client.quit();
    }

    getClient(): Redis {
        return this.client;
    }

    // Helper wrappers
    async set(key: string, value: string, mode?: 'EX', duration?: number) {
        if (mode && duration) {
            return this.client.set(key, value, mode, duration);
        }
        return this.client.set(key, value);
    }

    async get(key: string) {
        return this.client.get(key);
    }

    async del(key: string) {
        return this.client.del(key);
    }
}
