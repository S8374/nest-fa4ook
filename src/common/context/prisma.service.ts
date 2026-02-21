import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from 'src/generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // 1. Create a dedicated logger instance with context 'PrismaService'
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Ensure you have 'pg' installed: pnpm add pg @types/pg
    const connectionString = process.env.DATABASE_URL;

    // 2. Initialize the Pool correctly (PrismaPg typically expects a pg.Pool instance)
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      // 3. Enable internal Prisma logs if needed (optional)
      log: ['info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      // 1. Establish connection (Pool initialization)
      await this.$connect();

      // FIX: Force a real query to verify the network connection
      // If the DB is down, this line will throw an error.
      await this.$queryRaw`SELECT 1`;

      // 4. Security: Mask the password in the connection string
      const dbUrl = process.env.DATABASE_URL || '';
      const maskedUrl = dbUrl.replace(/:\/\/(.*)@/, '://***@');

      this.logger.debug(`Connected to database successfully: ${maskedUrl}`);
    } catch (error) {
      // 5. Error Handling
      this.logger.error('Failed to connect to the database', error);
      throw error; // This ensures the app stops if DB is down
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }
}
