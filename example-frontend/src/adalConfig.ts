import { AuthenticationContext, AdalConfig } from "react-adal";

export const adalConfig: AdalConfig = {
  tenant: "74831e7e-045b-4115-b3ec-8cbe36b54b59",
  clientId: "d0f5ebe0-d36c-4bb5-9264-b7e96c95d354",
  redirectUri: "http://localhost:3000",
  endpoints: {
    api:
      "https://skyvolgahotmail.onmicrosoft.com/d0f5ebe0-d36c-4bb5-9264-b7e96c95d354"
  },
  cacheLocation: "sessionStorage"
};

export const authContext = new AuthenticationContext(adalConfig);

export const getToken = () => authContext.getCachedToken(adalConfig.clientId);
