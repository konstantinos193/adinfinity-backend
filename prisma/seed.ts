import 'dotenv/config';
import { ContactRole, EventType, InvitationStatus, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });

async function main() {
  // Default admin
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.admin.upsert({
    where: { email: 'admin@adifinity.gr' },
    update: {},
    create: { email: 'admin@adifinity.gr', password: hash },
  });
  console.log('✅ Admin created: admin@adifinity.gr / admin123');

  // Demo invitation: Ιωάννα & Αλέξανδρος
  const existing = await prisma.invitation.findUnique({
    where: { slug: 'ioanna-alexandros' },
  });
  if (existing) {
    console.log('ℹ️  Demo invitation already exists — skipping');
    return;
  }

  await prisma.invitation.create({
    data: {
      slug: 'ioanna-alexandros',
      brideName: 'Ιωάννα',
      groomName: 'Αλέξανδρος',
      weddingDate: new Date('2027-09-27T19:00:00'),
      status: InvitationStatus.ACTIVE,
      rsvpDeadline: new Date('2025-07-10T23:59:59'),
      story: `Μια φορά και έναν καιρό σε μια πολυσύχναστη πόλη, ένας άντρας και μια γυναίκα συναντήθηκαν και ο προορισμός παρενέβη. Οι ματιές τους συναντήθηκαν και σε εκείνη τη στιγμή δημιουργήθηκε μια απροσδιόριστη σύνδεση ανάμεσά τους. Περιπλανήθηκαν γύρω από αλλήλους, βιώνοντας στιγμές γέλιου και κοινοποίησης μυστικών. Τα καρδιοχτυπήματά τους έγιναν ολοένα και πιο δυνατά με κάθε πέρασμα της μέρας, μέχρι που συνειδητοποίησαν ότι δεν μπορούσαν να φανταστούν ένα μέλλον χωρίς ο ένας τον άλλον. Αυτός ο άντρας και αυτή η γυναίκα ήμασταν εμείς! 😉`,
      events: {
        create: [
          {
            type: EventType.CEREMONY,
            name: 'Ιερός Ναός Αγίου Ελευθερίου',
            date: new Date('2027-09-27T19:00:00'),
            address: 'Ιερός Ναός Αγίου Ελευθερίου, Αθήνα',
            mapsUrl: 'https://maps.google.com',
          },
          {
            type: EventType.RECEPTION,
            name: 'Κτήμα Όναρ, Κορωπί',
            date: new Date('2027-09-27T21:00:00'),
            address: 'Κτήμα Όναρ, Κορωπί, Αττική',
            mapsUrl: 'https://maps.google.com',
          },
        ],
      },
      contacts: {
        create: [
          {
            role: ContactRole.BRIDE,
            name: 'Ιωάννα',
            phone: '6937002000',
            email: 'ioanna@invitation.gr',
          },
          {
            role: ContactRole.GROOM,
            name: 'Αλέξανδρος',
            phone: '6937111200',
            email: 'alexandros@invitation.gr',
          },
          {
            role: ContactRole.MAID_OF_HONOR,
            name: 'Δήμητρα',
            phone: '6937111200',
            email: 'dimitra@invitation.gr',
          },
          {
            role: ContactRole.BEST_MAN,
            name: 'Στάθης',
            phone: '6937111200',
            email: 'stathis@invitation.gr',
          },
        ],
      },
      giftRegistries: {
        create: [
          {
            ownerName: 'Ιωάννα',
            bankName: 'The Best Bank',
            iban: 'GR00022211155522223333333664512',
          },
          {
            ownerName: 'Αλέξανδρος',
            bankName: 'The Best Bank',
            iban: 'GR00022211155522223333333664512',
          },
        ],
      },
    },
  });

  console.log('✅ Demo invitation created: /invitations/ioanna-alexandros');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
