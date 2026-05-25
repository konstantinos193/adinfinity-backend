import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { InvitationsService } from './invitations.service';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private service: InvitationsService) {}

  // Public: fetch invitation mini-website data by slug
  @Get(':slug')
  @ApiOperation({ summary: 'Get invitation by slug (public)' })
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }
}

@ApiTags('admin / invitations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/invitations')
export class AdminInvitationsController {
  constructor(private service: InvitationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create invitation' })
  create(@Body() dto: CreateInvitationDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all invitations' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invitation by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update invitation' })
  update(@Param('id') id: string, @Body() dto: UpdateInvitationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete invitation' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/rsvps')
  @ApiOperation({ summary: 'Get all RSVPs for an invitation' })
  getRsvps(@Param('id') id: string) {
    return this.service.getRsvps(id);
  }
}
