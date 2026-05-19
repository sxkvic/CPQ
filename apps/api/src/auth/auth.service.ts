import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByUsername(dto.username);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('账号或密码错误');
    }

    const valid = await compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
      roleCode: user.roleCode,
    });

    return {
      accessToken,
      user: this.usersService.toPublicUser(user),
    };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    return this.usersService.toPublicUser(user);
  }
}
