import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare function getSummary(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getChartData(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=controller.d.ts.map