// Defining the info for backendConfig
const port = process.env.APP_PORT || 3000;
export const websiteDomain =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  `http://localhost:${port}`;
const apiBasePath = "/api/auth/";

export const appInfo = {
  appName: "One-click DAO builder",
  websiteDomain,
  apiDomain: "http://localhost:8000",
  apiBasePath,
};
