import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare function getLoans(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getLoan(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createLoan(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateLoan(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateLoanStatus(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deleteLoan(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=controller.d.ts.map