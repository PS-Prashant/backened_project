import express from "express";
import cors from "cors";
import cookiesParser from "cookie-parser";

const app = express();

app.use( cors({
    origin: ["*"],
    // origin: ["http://localhost:4200"],
    credentials: true
}) )

app.use( express.json({ limit: "16kb" }) )
app.use( express.urlencoded({ extended: true, limit: "16kb" }) )
app.use( express.static("public") )
app.use(cookiesParser())


//routes imports
import userRouter from "./routes/user.routes.js"

// routes decleration
app.use( "/api/v1/users", userRouter )

// app.use(function(req, res, next) {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//     res.setHeader('Access-Control-Allow-Credentials', true);
//     next();
// });

export { app }