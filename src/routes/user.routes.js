import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken } from "../controllers/user.controller.js";
import { uploadOnMulter } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route( "/register" ).post( 
    uploadOnMulter.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser 
)
router.route( "/login" ).post( loginUser );

//secure routes
router.route( "/logout" ).post( verifyJWT, logoutUser )
router.route( "/refresh-route" ).post( refreshAccessToken )

export default router;