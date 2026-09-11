import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

// Hit by scripts/deploy.sh before nginx is cut over to a new container, and by
// the compose healthcheck afterwards. It round-trips the database on purpose:
// Prisma connects lazily, so a container with a bad DATABASE_URL would
// otherwise report healthy and take traffic.
@ApiExcludeController()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'down' });
    }
    return { status: 'ok', db: 'ok' };
  }
}
