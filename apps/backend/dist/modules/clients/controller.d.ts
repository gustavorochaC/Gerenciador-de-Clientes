import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare function getClients(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getClient(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createClient(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateClient(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deleteClient(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function uploadDocument(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deleteDocument(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=controller.d.ts.map