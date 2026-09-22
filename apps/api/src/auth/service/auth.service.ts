import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { User } from "@app/database";
import { Repository } from "typeorm";
import { LoginDto, RegisterDto } from "../dto/auth.dto";
import {
  getAccessTokenExpiresIn,
  getAccessTokenSecret,
  getRefreshTokenExpiresIn,
  getRefreshTokenSecret,
  type JwtPayload,
} from "../guard/auth.config";

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly user: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.user.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("Email is already registered");
    }

    const user = await this.user.save(
      this.user.create({
        name: dto.name,
        email: dto.email,
        password: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
        avatarUrl: dto.avatarUrl ?? null,
      }),
    );

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.user
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email: dto.email })
      .getOne();

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const payload = this.verifyRefreshToken(refreshToken);
    const user = await this.user.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return this.issueTokens(user);
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
    const { password: _password, ...publicUser } = user;

    return {
      user: publicUser,
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
