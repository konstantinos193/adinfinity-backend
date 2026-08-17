import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InvitationAccessService } from '../invitations/invitation-access.service';
import { CreateRsvpDto } from './dto/create-rsvp.dto';
import { RsvpService } from './rsvp.service';

@ApiTags('rsvp')
@Controller('invitations/:slug/rsvp')
export class RsvpController {
  constructor(
    private service: RsvpService,
    private access: InvitationAccessService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Submit RSVP for an invitation (public)' })
  async submit(
    @Param('slug') slug: string,
    @Body() dto: CreateRsvpDto,
    @Headers('authorization') authorization?: string,
  ) {
    // A locked invitation must not accept RSVPs from someone who never
    // entered the PIN — otherwise the gate only hides the page, not the form.
    await this.access.assertCanSubmit(slug, authorization);
    return this.service.submit(slug, dto);
  }
}
