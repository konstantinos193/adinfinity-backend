import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import {
  AdminInvitationsController,
  InvitationsController,
} from './invitations.controller';
import { InvitationAccessService } from './invitation-access.service';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [
    // AdminInvitationsController is behind JwtAuthGuard, which needs the
    // AuthModuleOptions that AuthModule registers and exports (see the note
    // there). Without this import the app fails to boot under Nest 12.
    AuthModule,
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
