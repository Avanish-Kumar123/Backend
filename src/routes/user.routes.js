import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken } from "../controllers/user.controller.js"; // is tarh se tbhi import hoga jb export iska default na ho
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()


//this is middleWare
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

router.route("/login").post(loginUser)

//secured routed
//parameter me do chije pass krne ka matalab yah hai ki phle phla wala parameter execute hoga, uske bad hi dusra wala kam krna hai jaise yaha phle verify krna hai aur next() ka isiliye use hota hai taki dusra wala bhi run kre, auth.middleware ke end me next() hmlog likhe hue hai 
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)


export default router