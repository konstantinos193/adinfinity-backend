import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: admin.id, email: admin.email };
    return { access_token: this.jwt.sign(payload) };
  }

  async createAdmin(email: string, password: string) {
    const hash = await bcrypt.hash(password, 10);
    return this.prisma.admin.create({ data: { email, password: hash } });
  }
}
