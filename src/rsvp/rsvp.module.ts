import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { RsvpController } from './rsvp.controller';
import { RsvpService } from './rsvp.service';

@Module({
  imports: [EmailModule],
  controllers: [RsvpController],
  providers: [RsvpService],
})
export class RsvpModule {}
