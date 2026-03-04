"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
exports.alertsRouter = router;
router.use(auth_1.authMiddleware);
router.get('/', controller_1.getAlerts);
router.patch('/:id/read', controller_1.markAsRead);
router.patch('/read-all', controller_1.markAllAsRead);
//# sourceMappingURL=routes.js.map