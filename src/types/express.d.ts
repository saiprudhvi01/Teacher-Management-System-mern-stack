import { AuthUserPayload } from '../../server/middleware/auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}
