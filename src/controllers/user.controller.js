import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js" 
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler( async (requestAnimationFrame, res) => {
    //get user details from frontend 
    //validation mtlb kya email shi format me hai password shi format me hai etc not empty 
    //check if user already exists: username or email se unique or not
    //check for images, check for avatar
    //coverimages hai to bhi thik ya nhi
    //upload them to cloudinary, avatar
    //create user object - create entry in db
    // remove password and refresh token field from response
    //check for user creation 
    //return res

    const {fullName, email, username, password } = req.body
    console.log("email: ", email); 

    if(
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    // aur bhi jitna chahe validation add kr skte hai email ke liye like @hai ya nhi, production lebel me hr validation ki alg file hoti hai hm call krte hai uske liye yha se
    //kaise check kre user exits krta hai ya nhi
   const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

     const avatarLocalPath = req.files?.avatar[0]?.path;
     const coverImageLocalPath = req.files?.coverImage[0]?.path;

     if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
     }
     const avatar = await uploadOnCloudinary(avatarLocalPath)
     const coverImage = await uploadOnCloudinary(coverImageLocalPath)

     if(!avatar){
        throw new ApiError(400, "Avatar file is required")
     }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
     })
     //user empty ya null to nhi 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})


export {
    registerUser,
}