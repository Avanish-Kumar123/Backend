import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js" 
import { ApiResponse } from "../utils/ApiResponse.js";
import { response } from "express";
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async(userId) => 
{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()//user ko de dete hai
        const refreshToken = user.generateRefreshToken()// data base me dalte hai kaise niche password ki jarurat padti hai jo ki validate krke passkrte hai
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return {accessToken, refreshToken}

    } catch (error){
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }

}

const registerUser = asyncHandler( async (req, res) => {
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
   const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

     const avatarLocalPath = req.files?.avatar[0]?.path;
     //console.log(avatarLocalPath)
     const coverImageLocalPath = req.files?.coverImage[0]?.path;

     if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
     }
     const avatar = await uploadOnCloudinary(avatarLocalPath)
     //console.log(avatar)
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

const loginUser = asyncHandler(async (req, res) => {
    //req body -> data
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie 
    const {email, username, password} = req.body
    //(!userName && !email) jab dono ek sath jarurat ho login ke liye tb
    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    } 
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if(!user) {
        throw new ApiError(404, "User does not exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(404, "Invalid user credentials")
    }
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken") //select ka use hab hme jojo field nhi chahiye use iske ander rakh dete hai
    // http aur secure true krne se cookie sirf server se modifiable hoti hai bhale front end ko bhi dikhegi
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "user logged in successfully"

        )
    )

})
//cookie clear kr do,refresh token ko clear kro
//user kaise find kre yha: middleware(multer(third party): form ka data leke jana to image aur video bhi lete hue jana)
//yha khud ka middleware design kr le third party ki jarurat hi nhi like multer
const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
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
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    //req.body.refreshToken ye kyu?? ans: for mobile app user

    if(incomingRefreshToken){
        throw new ApiError(401, "unauthorised request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user) {
            throw new ApiError(401, "Invalid refresh  token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newrefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}

//token hi ek tarika hai login ho ya nhi janne ka 