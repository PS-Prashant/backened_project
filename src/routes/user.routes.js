import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { uploadOnMulter } from "../middlewares/multer.middleware.js"

const router = Router();

router.route( "/register" ).post( 
    uploadOnMulter.fields([
        {
            name: "avtar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser )

export default router;