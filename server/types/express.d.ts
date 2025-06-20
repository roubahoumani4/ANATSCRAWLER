import { User } from './User';

declare global {
  namespace Express {
    interface Request {
      user?: User;  // Optional because it's not present on unauthenticated requests 
      token?: string;
    }
  }
}
