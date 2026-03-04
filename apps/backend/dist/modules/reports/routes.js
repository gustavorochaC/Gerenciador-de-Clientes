"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
exports.reportsRouter = router;
router.use(auth_1.authMiddleware);
router.get('/pdf/client/:id', controller_1.getClientReport);
router.get('/pdf/general', controller_1.getGeneralReport);
//# sourceMappingURL=routes.js.map