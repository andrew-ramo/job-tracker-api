import { Router } from "express";
import * as applicationController from "../controllers/application.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createApplicationSchema,
  updateApplicationSchema,
  listApplicationsQuerySchema,
} from "../schemas";

const router = Router();

// كل مسارات التطبيقات محمية
router.use(authenticate);

router.post("/", validate(createApplicationSchema), applicationController.create);
router.get(
  "/",
  validate(listApplicationsQuerySchema, "query"),
  applicationController.list
);
router.get("/:id", applicationController.getById);
router.patch("/:id", validate(updateApplicationSchema), applicationController.update);
router.delete("/:id", applicationController.remove);

export default router;