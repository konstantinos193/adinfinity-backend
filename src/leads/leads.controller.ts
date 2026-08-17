import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  HttpException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadsService } from './leads.service';

/** Requests allowed per IP inside the window. */
const MAX_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000;

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  /**
   * In-memory sliding window. Deliberately not @nestjs/throttler — that would
   * add a dependency for one public endpoint. Resets on restart and is
   * per-process, which is acceptable: this is spam friction, not a hard quota.
   */
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly leads: LeadsService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Submit an invitation request from the website' })
  async create(@Body() dto: CreateLeadDto, @Ip() ip: string) {
    this.enforceRateLimit(ip);
    return this.leads.submit(dto);
  }

  private enforceRateLimit(ip: string) {
    const now = Date.now();
    const recent = (this.hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

    if (recent.length >= MAX_PER_WINDOW) {
      throw new HttpException(
        'Πολλές αιτήσεις. Δοκιμάστε ξανά σε λίγο.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recent.push(now);
    this.hits.set(ip, recent);

    // Opportunistic cleanup so the map can't grow without bound.
    if (this.hits.size > 5000) {
      for (const [key, times] of this.hits) {
        if (times.every((t) => now - t >= WINDOW_MS)) this.hits.delete(key);
      }
    }
  }
}
