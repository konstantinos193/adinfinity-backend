import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import {
  AdminInvitationsController,
  InvitationsController,
} from './invitations.controller';
import { InvitationAccessService } from './invitation-access.service';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [
    // Same secret as admin auth; invitation tokens are distinguished by their
    // `scope` claim, which the access service checks on every verify.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [InvitationsController, AdminInvitationsController],
  providers: [InvitationsService, InvitationAccessService],
  exports: [InvitationsService, InvitationAccessService],
})
export class InvitationsModule {}
