"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
exports.dashboardRouter = router;
router.use(auth_1.authMiddleware);
router.get('/summary', controller_1.getSummary);
router.get('/chart', controller_1.getChartData);
//# sourceMappingURL=routes.js.map