import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rateLimit.middleware";
import { 
  registerSchema, 
  loginSchema, 
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema
} from "../schemas";

const router = Router();

router.use(authLimiter);

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post("/logout", validate(refreshSchema), authController.logout);

router.get("/me", authenticate, authController.me);
router.patch("/me", authenticate, validate(updateProfileSchema), authController.updateProfile);
router.patch("/password", authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;