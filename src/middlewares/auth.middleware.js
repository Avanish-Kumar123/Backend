import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js"

//this will authenticate user, for reusibity, like for logout check authenticated user or not 
//for some likes post, that time also authenticate users
export const verifyJWT = asyncHandler(async(req, res, next) =>{ 
    //yaha ye bhi likh skte hai jaisa ki response ka use nhi hai isiliye (req, _+, next)
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
        throw new ApiError(401, "Unauthorized request")
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
    //iska matalb find krega id se aur 
    //decodedToken?._id iska matab hai ki yah decodedToken me se id ko unwrap kr dega 
    //select ka user jo hme nhi chahiye usko hatane ke liye likhte hai
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

    if(!user) {
        //Next video: discuss about frontend
        throw new ApiError(401, "Invalid Access Token")
    }

    req.user = user;
    next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    //middleware routes me use hote hai 

})