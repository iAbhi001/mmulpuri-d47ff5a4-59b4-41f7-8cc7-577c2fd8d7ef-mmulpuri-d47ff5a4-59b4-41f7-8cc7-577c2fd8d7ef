import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as public — skips JWT authentication.
 * Use for login and registration endpoints.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
