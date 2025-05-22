import express from "express";
import { login, logout, register, updateProfile ,getAllUsers} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload } from "../middlewares/mutler.js";
import { updateResume } from "../controllers/user.controller.js";
 
const router = express.Router();

router.route("/register").post(singleUpload,register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/profile/update").post(isAuthenticated,singleUpload,updateProfile);
router.route("/profile/updateResume").post(isAuthenticated, singleUpload, updateResume);
router.route("/all").get(getAllUsers);

export default router;

