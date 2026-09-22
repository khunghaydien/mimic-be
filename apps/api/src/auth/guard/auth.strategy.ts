import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { User } from "@app/database";
import { Repository } from "typeorm";
import { getAccessTokenSecret, type JwtPayload } from "./auth.config";

@Injectable()
export class AuthStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly user: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getAccessTokenSecret(),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type !== "access") {
      throw new UnauthorizedException();
    }

    const user = await this.user.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
