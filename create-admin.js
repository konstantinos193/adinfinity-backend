/**
 * One-time helper: creates an admin account directly in the database.
 * Usage: node create-admin.js
 * Env vars: ADMIN_EMAIL, ADMIN_PASSWORD
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const email = process.env.ADMIN_EMAIL || 'admin@test.com';
const password = process.env.ADMIN_PASSWORD || 'password123';

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL) });
  try {
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      console.log(`Admin already exists: ${email}`);
      return;
    }
    const hash = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({ data: { email, password: hash } });
    console.log(`Admin created: ${admin.email} (id: ${admin.id})`);
    console.log(`Password: ${password}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
