import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/** Bỏ qua AuthGuard — dùng cho login, register, health, ... */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
