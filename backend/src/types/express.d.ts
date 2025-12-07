import { UserContext } from '../auth/access-control';

declare global {
    namespace Express {
        interface Request {
            user?: UserContext;
        }
    }
}
