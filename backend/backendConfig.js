import supertokens from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import { appInfo } from "../src/config/appInfo";

supertokens.init({
  framework: "express",
  supertokens: {
      // https://try.supertokens.com is for demo purposes. Replace this with the address of your core instance (sign up on supertokens.com), or self host a core.
      connectionURI: "https://6ab806e14fdf11edb100f1f0c7f75cb3-us-east-1.aws.supertokens.io:3573",
      apiKey: "TWNpx0l2zrBLo-JIPCT9BBbmurb6Lz",
  },
  appInfo: {
      // learn more about this on https://supertokens.com/docs/session/appinfo
      appName: "One click DAO builder",
      apiDomain: appInfo.apiDomain,
      websiteDomain: appInfo.websiteDomain,
      apiBasePath: appInfo.apiBasePath,
      websiteBasePath: appInfo.websiteDomain
  },
  recipeList: [
      Session.init()
  ]
});