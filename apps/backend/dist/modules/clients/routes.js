"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
exports.clientsRouter = router;
router.use(auth_1.authMiddleware);
router.get('/', controller_1.getClients);
router.get('/:id', controller_1.getClient);
router.post('/', controller_1.createClient);
router.put('/:id', controller_1.updateClient);
router.delete('/:id', controller_1.deleteClient);
router.post('/:id/documents', controller_1.uploadDocument);
router.delete('/:id/documents/:docId', controller_1.deleteDocument);
//# sourceMappingURL=routes.js.map