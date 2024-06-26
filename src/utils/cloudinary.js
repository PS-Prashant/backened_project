import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// Upload an image
const uploadOnCloudinary = async ( localFilePath ) => {

    try {
        if ( !localFilePath ) return;
        const uploadFile = await cloudinary.uploader.upload( localFilePath, {
            resource_type: "auto"
        } )
        console.log("file is uploaded cloudinary successfully: ", uploadFile.url );
        fs.unlinkSync( localFilePath ) 
        return uploadFile;
    } catch ( error ) {
        fs.unlinkSync( localFilePath )  //remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export default uploadOnCloudinary;