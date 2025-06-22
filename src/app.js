//app hogi express ke through aur database hogi mongoose ke through
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true 
}))

app.use(express.json({limit: "16kb"}))//form se jo data aya
app.use(express.urlencoded({extended: true, limit: "16kb"}))//jo url se data aya vo hai, extended ka matlb object ke andar object le skte hai 
app.use(express.static("public")) // public name ka ek folder banaya hu jisme like images , favicon etc ko yha rakh skta hu
app.use(cookieParser())//isse sirf server hi cookie padh pata hai aur remove kr pata hai browser se securely


export { app }




