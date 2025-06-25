import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js"; // is tarh se tbhi import hoga jb export iska default na ho
import { upload } from "../middlewares/multer.middleware.js";


const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount:1 
        }
    ]),
    registerUser
)


export default router