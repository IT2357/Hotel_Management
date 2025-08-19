const express = require("express");
const router = express.Router();
const refundController = require("../controllers/financialController");

router.post("/api/financial/refunds", refundController.createRefundRequest);
router.get("/api/financial/refunds/:id", refundController.getRefundRequest);
router.put("/api/financial/refunds/:id", refundController.updateRefundRequest);
router.delete(
  "/api/financial/refunds/:id",
  refundController.deleteRefundRequest
);

module.exports = router;
