import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js"


export const verifyJWT = asyncHandler( async ( req, res, next ) => {
    // we can also write the argument this type :- ( req, _, next )

    try {

        // console.log( '>>>>>>>>', req.cookies )

        const token = req?.cookies?.accessToken || req?.header( "Authorization" )?.replace("Basic ", "");
    
        if ( !token ) {
            throw new ApiError( 401, "unauthorised request" )
        }
    
        const decodedToken = jwt.verify( token, process.env.ACCESS_TOKEN_SECRET );
    
        const user = await User.findById( decodedToken?._id ).select( "-password -refreshToken" );
    
        if ( !user ) {
            throw new ApiError( 401, "Invalid access token" )
        }
    
        req.user = user;
        next();

    } catch (error) {
        throw new ApiError( 401, error?.message || "invalid access token")
    }

} )