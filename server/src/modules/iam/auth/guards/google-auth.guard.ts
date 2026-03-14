import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Applied to GET /auth/google and GET /auth/google/callback.
 * No JWT needed on these routes — Google handles the authentication.
 *
 * handleRequest is overridden so that Passport errors (e.g. user denies
 * consent, or the auth code is replayed) don't result in a raw 500.
 * Instead the error is re-thrown and caught by the controller's try/catch,
 * which redirects to /login?error=...
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  handleRequest(err: any, user: any, _info: any, _context: ExecutionContext) {
    // If Passport errored (TokenError, user denied, etc.) or no user,
    // return null so the controller can handle it via try/catch
    if (err || !user) {
      return null;
    }
    return user;
  }
}
