import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js"

const registerUser = asyncHandler( async ( req, res ) => {

    // get user detail from user
    // validate data- not empty
    // check already exit with email || userName
    // check for images, avatar
    // upload them to cloudinary, avatar
    // create user object- entry in db
    // remove password and token from response
    // check for user creation
    // return res

    const { userName, email, fullName, avatar, coverImage, password } = req.body;

    console.log( userName, email, fullName, avatar, coverImage, password )

    if( [ fullName, userName, email, password ].some( ( fields ) => fields.trim() == "" ) ) {
        throw new ApiError( 400, "All field are required" )
    }

    const existedUser = User.findOne( {
        $or: [ { userName }, { email } ]
    } )

    if ( existedUser ) {
        throw new ApiError( 409, "userName or email already exists" )
    };

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = '';

    if (  !avatarLocalPath ) throw new ApiError( 400, "Avtar file is required" )

    if ( req && req?.files && req.files?.avatar && req.files?.avatar.length && req.files?.avatar[0].path ) {
        coverImageLocalPath = req.files?.avatar[0].path;
    }

    const avatarUpload = await uploadOnCloudinary( avatarLocalPath );
    const coverImageUpload = await uploadOnCloudinary( coverImageLocalPath );

    if ( !avatarUpload ) throw new ApiError( 400, "Avtar is required" )

    const user = User.create({
        fullName,
        coverImage: coverImageUpload?.url || "",
        avatar: avatarUpload.url,
        email,
        userName: userName.toLowerCase()
    })

    const createdUser = await User.findById( user._id ).select(
        "-password -refreshToken"
    )

    if ( !createdUser ) {
        throw new ApiError( 500, "wrong with registering user" )
    }

    return res.status(201).json(
        new ApiResponse( 200, createdUser, "user registered succesfully" )
    )
} )

export { registerUser };