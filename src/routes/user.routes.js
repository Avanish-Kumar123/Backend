import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js"; // is tarh se tbhi import hoga jb export iska default na ho

const router = Router()


router.route("/register").post(registerUser)
export default router