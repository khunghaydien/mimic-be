import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "@app/database";
import { Repository } from "typeorm";

export type SafeUser = Omit<User, "password">;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  toSafeUser(user: User): SafeUser {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  create(data: {
    name: string;
    email: string;
    password: string;
    avatarUrl?: string | null;
  }): Promise<User> {
    const user = this.usersRepository.create({
      name: data.name,
      email: data.email,
      password: data.password,
      avatarUrl: data.avatarUrl ?? null,
    });
    return this.usersRepository.save(user);
  }
}
