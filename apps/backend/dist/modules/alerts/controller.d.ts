import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare function getAlerts(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function markAsRead(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function markAllAsRead(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=controller.d.ts.map