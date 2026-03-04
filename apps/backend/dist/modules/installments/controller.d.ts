import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare function getInstallments(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function payInstallment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateInstallmentStatus(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=controller.d.ts.map