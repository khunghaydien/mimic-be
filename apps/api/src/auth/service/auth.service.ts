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
    const taken = await this.user.existsBy({ email: dto.email });
    if (taken) {
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
    const user = await this.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException("Invalid email or password");
    }
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const payload = this.readRefreshToken(refreshToken);
    const user = await this.user.findOneBy({ id: payload.sub });
    if (!user) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    return this.issueTokens(user);
  }

  private findByEmail(email: string) {
    return this.user
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();
  }

  private readRefreshToken(refreshToken: string): JwtPayload {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: getRefreshTokenSecret(),
      });
      if (payload.type === "refresh") {
        return payload;
      }
    } catch {}
    throw new UnauthorizedException("Invalid refresh token");
  }

  private issueTokens(user: User) {
    const { password: _, ...profile } = user;
    return {
      user: profile,
      accessToken: this.sign(user, "access"),
      refreshToken: this.sign(user, "refresh"),
    };
  }

  private sign(user: User, type: "access" | "refresh") {
    const secret =
      type === "access" ? getAccessTokenSecret() : getRefreshTokenSecret();
    const expiresIn =
      type === "access"
        ? getAccessTokenExpiresIn()
        : getRefreshTokenExpiresIn();
    return this.jwtService.sign(
      { sub: user.id, email: user.email, type } satisfies JwtPayload,
      { secret, expiresIn },
    );
  }
}
