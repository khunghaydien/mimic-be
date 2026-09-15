import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { User } from "@app/database";
import { SafeUser, UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtPayload } from "./interfaces/jwt-payload.interface";
import {
  getAccessTokenExpiresIn,
  getAccessTokenSecret,
  getRefreshTokenExpiresIn,
  getRefreshTokenSecret,
} from "./jwt.config";

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException("Email is already registered");
    }

    const password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password,
      avatarUrl: dto.avatarUrl || null,
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const matches = await bcrypt.compare(dto.password, user.password);
    if (!matches) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const payload = this.verifyRefreshToken(refreshToken);
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return this.issueTokens(user);
  }

  me(user: User): SafeUser {
    return this.usersService.toSafeUser(user);
  }

  private verifyRefreshToken(refreshToken: string): JwtPayload {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: getRefreshTokenSecret(),
      });
      if (payload.type !== "refresh") {
        throw new UnauthorizedException("Invalid refresh token");
      }
      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  private issueTokens(user: User) {
    const claims = { sub: user.id, email: user.email };

    return {
      user: this.usersService.toSafeUser(user),
      accessToken: this.jwtService.sign(
        { ...claims, type: "access" } satisfies JwtPayload,
        {
          secret: getAccessTokenSecret(),
          expiresIn: getAccessTokenExpiresIn(),
        },
      ),
      refreshToken: this.jwtService.sign(
        { ...claims, type: "refresh" } satisfies JwtPayload,
        {
          secret: getRefreshTokenSecret(),
          expiresIn: getRefreshTokenExpiresIn(),
        },
      ),
    };
  }
}
