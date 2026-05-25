-- CreateEnum
CREATE TYPE "InvitationType" AS ENUM ('MINI_WEBSITE', 'VIDEO', 'VIDEO_PROSKLITIRIO');

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN "invitationType" "InvitationType" NOT NULL DEFAULT 'MINI_WEBSITE';
