import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { applyJob, getAllApplications, getApplicants, getAppliedJobs, updateProgress, updateStatus } from "../controllers/application.controller.js";
 
const router = express.Router();

router.route("/apply/:id").get(isAuthenticated, applyJob);
router.route("/get").get(isAuthenticated, getAppliedJobs);
router.route("/:id/applicants").get(isAuthenticated, getApplicants);
router.route("/status/:id/update").post(isAuthenticated, updateStatus);
router.route("/progress/:id/update").post(isAuthenticated,updateProgress);
router.route("/getallapplications").get(getAllApplications);

 

export default router;

