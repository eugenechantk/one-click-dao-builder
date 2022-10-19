"use strict";
exports.__esModule = true;
exports.appInfo = exports.websiteDomain = void 0;
// Defining the info for backendConfig
var port = process.env.APP_PORT || 3000;
exports.websiteDomain = process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:".concat(port);
var apiBasePath = "/api/auth/";
exports.appInfo = {
    appName: "One-click DAO builder",
    websiteDomain: exports.websiteDomain,
    apiDomain: "http://localhost:8000",
    apiBasePath: apiBasePath
};
