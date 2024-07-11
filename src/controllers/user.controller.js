import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async ( userId ) => {

    try {
        
        const user = await User.findById( userId );
        const accessToken = user.generateAccessToken( userId );
        const refreshToken = user.refreshAccessToken( userId );

        user.refreshToken = refreshToken;
        await user.save( { validateBeforeSave: false } );

        return { accessToken, refreshToken };


    } catch ( error ) {
        throw new ApiError( 501, "something went wrong when generating error" )
    }
}

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

    const existedUser = await User.findOne( {
        $or: [ { userName }, { email } ]
    } )

    if ( existedUser ) {
        throw new ApiError( 409, "userName or email already exists" )
    };

    const avatarLocalPath = req.files?.avatar[0]?.path;
    
    console.log( avatarLocalPath )
    let coverImageLocalPath = '';

    if (  !avatarLocalPath ) throw new ApiError( 400, "Avtar file is required" )

    if ( req && req?.files && req.files?.coverImage && req.files?.coverImage.length && req.files?.coverImage[0].path ) {
        coverImageLocalPath = req.files?.coverImage[0].path;
    }

    console.log( avatarLocalPath, coverImageLocalPath )

    const avatarUpload = await uploadOnCloudinary( avatarLocalPath );
    const coverImageUpload = await uploadOnCloudinary( coverImageLocalPath );
    console.log(11111111111111, avatarUpload);

    if ( !avatarUpload ) throw new ApiError( 400, "Avtar is required" )

    const user = await User.create({
        fullName,
        coverImage: coverImageUpload?.url || "",
        avatar: avatarUpload.url,
        email,
        password,
        userName: userName.toLowerCase()
    })

    console.log( 3333333333333, user )

    const createdUser = await User.findById( user._id ).select(
        "-password -refreshToken"
    )

    console.log( 22222222222222222222, createdUser )

    if ( !createdUser ) {
        throw new ApiError( 500, "wrong with registering user" )
    }

    return res.status(201).json(
        new ApiResponse( 200, createdUser, "user registered succesfully" )
    )
} )

const loginUser = asyncHandler( async ( req, res ) => {

    //req.body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookies

    const { email, userName, password } = req.body;

    console.log( '>>>>>>>>>>>',  email, userName, password )

    if ( !userName && !email ) {
        throw new ApiError( 400, "username or email is required" )
    }

    const user = await User.findOne( {
        $or: [ { userName }, { email } ]
    } )

    if ( !user ) {
        throw new ApiError( 404, "user not register" ) 
    }

    const isPasswordValid = await user.isPasswordCorrect( password );

    if ( !isPasswordValid ) {
        throw new ApiError( 401, "Invalid user credentials" )
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken( user._id );

    const loggedInUser = await User.findById( user._id ).select( "-password -refreshToken" );
    
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse( 
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In successfully"
        )
    )

} )

const logoutUser = asyncHandler( async ( req, res ) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie( "accessToken", options )
    .clearCookie( "refreshToken", options )
    .json(
        new ApiResponse(
            201,
            {},
            "Logout Successfully"
        )
    )
} )

const refreshAccessToken = asyncHandler( async ( req, res ) => {
    
    const incomingRefreshToken = req?.cookies?.refreshToken || req?.body?.refreshToken;

    if ( !incomingRefreshToken ) {
        throw new ApiError( 401, "unathorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById( decodedToken?._id );
        if ( !user ) {
            throw new ApiError( 401, "invalid refresh token" )
        }

        if ( incomingRefreshToken !== user?.refreshToken ) {
            throw new ApiError( 401, "refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken( user?._id );

        return res
        .status(200)
        .cookie( "accessToken", accessToken, options )
        .cookie( "refreshToken", refreshToken, options )
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken },
                "Access token refreshed"
            )
        )

    } catch (error) {
        throw new ApiError( 501, error?.message || "some problem while refresh the access token" )
    }

} )

const changeCurrentPassword = asyncHandler( async ( req, res ) => {

    const { newPassword, oldPassword } = req.body;

    const user = await User.findById( req.user?._id );
    const isPasswordCorrect = await user.isPasswordCorrect( oldPassword );

    if ( !isPasswordCorrect ) {
        throw new ApiError( 400, "invalid old password" )
    }

    user.password = newPassword;
    user.save(  { validateBeforeSave: false } )

    return res
    .status(200)
    .json( new ApiResponse( 200, {}, "password changed successfully" ) )

} )

const getCurrentUser = asyncHandler( async ( req, res ) => {
    return res
    .status(200)
    .json( new ApiResponse( 200, req.user, "current user fetched successfully" ) )
} )

const updateAccountDetails = asyncHandler( async ( req, res ) => {

    const { email, fullName } = req.body;

    if ( !email && !fullName ) {
        throw new ApiError( 401, "email or full Name required" );
    }

    const user = User.findByIdAndUpdate(

        req?.user._id,
        {
            $set: {
                email,
                fullName
            }
        },
        {
            new: true
        }
    ).select( "-password" )

    return res
    .status(200)
    .json(
        new ApiResponse( 200, user, "Update the user details successfully" )
    )

} )

const updateUserAvatar = asyncHandler( async ( req, res ) => {

    const avatarLocalPath = req?.file?.path;
    if ( !avatarLocalPath ) {
        new ApiError ( 400, "Avatar file is missing" )
    }

    const avatar = await uploadOnCloudinary( avatarLocalPath );

    if ( !avatar?.url ) {
        throw new ApiError( 400, "error while uploading on avatar" )
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.file
            }
        },
        {
            new: true
        }
    ).select( "-password" )

    return res
    .status(200)
    .json(
        new ApiResponse( 200, user, "updated user avatar successfully" )
    )

} )

const updateUserCoverImage = asyncHandler( async ( req, res ) => {

    const coverImageLocalPath = req?.file?.path;
    if ( !avatarLocalPath ) {
        new ApiError ( 400, "Cover Image file is missing" )
    }

    const coverImage = await uploadOnCloudinary( coverImageLocalPath );

    if ( !coverImage?.url ) {
        throw new ApiError( 400, "error while uploading on Cover Image" )
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.file
            }
        },
        {
            new: true
        }
    ).select( "-password" )

    return res
    .status(200)
    .json(
        new ApiResponse( 200, user, "updated user Cover Image successfully" )
    )

} )

const getUserChannelProfile = asyncHandler ( async ( req, res ) => {

    const { userName } = req?.params;

    if ( !userName?.trim() ) {
        throw new ApiError( 401, "userName is missing" )
    }

    const channelObj = await User.aggregate( [
        {
            $match: {
                userName: userName?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribeTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribeTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [ req?.user?._id, "$subscribers.subscriber" ] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ] )

    if ( !channelObj?.length ) {
        throw new ApiError( 404, "channel does not exists" )
    }

    return res
    .status(200)
    .json(
        new ApiResponse( 200, channelObj[0], "fetched channel data successfully" )
    )

} )

export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
};