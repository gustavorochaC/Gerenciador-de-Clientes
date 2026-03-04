import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare function getClientReport(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getGeneralReport(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=controller.d.ts.map