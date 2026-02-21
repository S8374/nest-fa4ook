/**
 * src/common/context/context.module.ts
 */
import { Global, Module, Logger } from '@nestjs/common';
import { ContextService } from './context.service';
import { PrismaService } from './prisma.service';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

@Global()
@Module({
  imports: [
    // 1. Caching Configuration
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('CacheModule');
        const redisUrl = configService.get<string>(
          'REDIS_URL',
          'redis://localhost:6379',
        );
        const ttl = configService.get<number>('CACHE_TTL', 60000);

        // Utility to mask password in logs: redis://:pass@host -> redis://:***@host
        const safeUrl = redisUrl.replace(/:\/\/(.*?)@/, '://***@');

        logger.log(`Initializing Cache Store (Keyv)...`);
        logger.debug(`Configuration -> URL: ${safeUrl}, TTL: ${ttl}ms`);

        try {
          const store = createKeyv(redisUrl, {
            namespace: 'AppCache',
          });

          // Listen for Keyv specific events
          store.on('error', (err) => {
            logger.error(`[Keyv] Redis Connection Error: `, err);
          });

          // Note: createKeyv is often lazy, so we force a set/get to verify connection during startup
          const result = await store.set('startup_check', 'ok', 1000);
          if (!result) {
            throw new Error('Failed to connect to Redis');
          }
          logger.debug(` Cache Store connected successfully.`);

          return {
            stores: [store],
            ttl: ttl,
          };
        } catch (error) {
          logger.error(`❌ Failed to initialize Cache Store: `, error);
          throw error;
        }
      },
      isGlobal: true,
    }),

    // 2. Queue Configuration (BullMQ)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('BullModule');
        const redisUrl = configService.get<string>(
          'REDIS_URL',
          'redis://localhost:6379',
        );

        try {
          // Parse URL to ensure valid connection params
          const url = new URL(redisUrl);

          // Log configuration (Masking password)
          logger.debug(`Initializing BullMQ Connection...`);
          logger.debug(
            `Configuration -> Host: ${url.hostname}, Port: ${url.port || 6379}`,
          );

          return {
            connection: {
              host: url.hostname,
              port: Number(url.port) || 6379,
              password: url.password || undefined,
              keepAlive: 10000,
            },
          };
        } catch (error) {
          logger.error(`❌ Failed to parse Redis URL for BullMQ: `, error);
          throw error;
        }
      },
    }),
  ],
  providers: [ContextService, PrismaService],
  exports: [ContextService, PrismaService],
})
export class ContextModule { }
