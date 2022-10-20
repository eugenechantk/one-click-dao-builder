import SessionNode from "supertokens-node/recipe/session";
import { TypeInput, AppInfo } from "supertokens-node/types";
import jwt from "jsonwebtoken";

let appInfo: AppInfo = {
  appName: "One-click DAO builder",
  apiDomain: "http://localhost:3000",
  websiteDomain: "http://localhost:3000",
};

let supabase_signing_secret = String(process.env.REACT_APP_SUPABASE_SIGNING_SECRET);

let backendConfig = (): TypeInput => {
  return {
      framework: "express",
      supertokens: {
          connectionURI: String(process.env.REACT_APP_SUPERTOKEN_CONNECT_URI),
          apiKey: String(process.env.REACT_APP_SUPETOKEN_CONNECT_KEY),
      },
      appInfo,
      recipeList: [
          SessionNode.init({
              override: {
                  functions: (originalImplementation) => {
                      return {
                          ...originalImplementation,
                          // We want to create a JWT which contains the users userId signed with Supabase's secret so
                          // it can be used by Supabase to validate the user when retrieving user data from their service.
                          // We store this token in the accessTokenPayload so it can be accessed on the frontend and on the backend.
                          createNewSession: async function (input) {
                              const payload = {
                                  userId: input.userId,
                                  exp: Math.floor(Date.now() / 1000) + 60 * 60,
                              };

                              const supabase_jwt_token = jwt.sign(payload, supabase_signing_secret);

                              input.accessTokenPayload = {
                                  ...input.accessTokenPayload,
                                  supabase_token: supabase_jwt_token,
                              };

                              return await originalImplementation.createNewSession(input);
                          },
                      };
                  },
              },
          }),
      ],
      isInServerlessEnv: true,
  };
};