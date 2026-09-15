import { SetMetadata } from "@nestjs/common";

export const SKIP_TRANSFORM_KEY = "skipTransform";

/** Bỏ qua envelope response (file download, webhook raw body, ...) */
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
