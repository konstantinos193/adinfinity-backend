-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CEREMONY', 'RECEPTION');

-- CreateEnum
CREATE TYPE "ContactRole" AS ENUM ('BRIDE', 'GROOM', 'BEST_MAN', 'MAID_OF_HONOR');

-- CreateEnum
CREATE TYPE "DietaryType" AS ENUM ('NONE', 'VEGAN', 'VEGETARIAN');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brideName" TEXT NOT NULL,
    "groomName" TEXT NOT NULL,
    "weddingDate" TIMESTAMP(3) NOT NULL,
    "story" TEXT,
    "videoUrl" TEXT,
    "coverImageUrl" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'DRAFT',
    "rsvpDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "address" TEXT,
    "mapsUrl" TEXT,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationContact" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "role" "ContactRole" NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,

    CONSTRAINT "InvitationContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftRegistry" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "bankName" TEXT,
    "iban" TEXT NOT NULL,

    CONSTRAINT "GiftRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RSVP" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "phone" TEXT,
    "attending" BOOLEAN NOT NULL,
    "adultCount" INTEGER NOT NULL DEFAULT 1,
    "hasChildren" BOOLEAN NOT NULL DEFAULT false,
    "childCount" INTEGER NOT NULL DEFAULT 0,
    "dietary" "DietaryType" NOT NULL DEFAULT 'NONE',
    "hasAllergy" BOOLEAN NOT NULL DEFAULT false,
    "allergyNote" TEXT,
    "message" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RSVP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_slug_key" ON "Invitation"("slug");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationContact" ADD CONSTRAINT "InvitationContact_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftRegistry" ADD CONSTRAINT "GiftRegistry_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
