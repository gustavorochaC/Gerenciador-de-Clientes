"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
exports.transactionsRouter = router;
router.use(auth_1.authMiddleware);
router.get('/', controller_1.getTransactions);
//# sourceMappingURL=routes.js.map