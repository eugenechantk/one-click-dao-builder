import {appInfo} from "./appInfo";
import ThirdPartyEmailPasswordNode from 'supertokens-node/recipe/thirdpartyemailpassword'
import SessionNode from 'supertokens-node/recipe/session';
import { TypeInput } from "supertokens-node/types";
import jwt from "jsonwebtoken";


let backendConfig = (): TypeInput => {
    return {
        framework: "express",
        supertokens: {
            connectionURI: "https://try.supertokens.com",
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

                                const supabase_jwt_token = jwt.sign(payload, String(process.env.REACT_APP_SUPABASE_SIGNING_SECRET));

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