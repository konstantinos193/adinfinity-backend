import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateRsvpDto } from './dto/create-rsvp.dto';
import { RsvpService } from './rsvp.service';

@ApiTags('rsvp')
@Controller('invitations/:slug/rsvp')
export class RsvpController {
  constructor(private service: RsvpService) {}

  @Post()
  @ApiOperation({ summary: 'Submit RSVP for an invitation (public)' })
  submit(@Param('slug') slug: string, @Body() dto: CreateRsvpDto) {
    return this.service.submit(slug, dto);
  }
}
