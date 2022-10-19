import express from "express";
import cors from "cors";
import supertokens from "supertokens-node";
// import { middleware } from "supertokens-node/framework/express/index";
import { appInfo } from "./appInfo";

const app = express();
const port = 8000;

app.use(cors({
    origin: appInfo.websiteDomain,
    allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
    credentials: true,
}));

// IMPORTANT: CORS should be before the below line.
// app.use(middleware());

// ...your API routes