import { AuthenticationContext, AdalConfig } from "react-adal";

export const adalConfig: AdalConfig = {
  tenant: "74831e7e-045b-4115-b3ec-8cbe36b54b59",
  clientId: "16273fd8-a47b-429c-82d0-fb973b6abfb0",
  redirectUri: "http://localhost:3000",
  endpoints: {
    api:
      "https://skyvolgahotmail.onmicrosoft.com/16273fd8-a47b-429c-82d0-fb973b6abfb0"
  },
  cacheLocation: "sessionStorage"
};

export const authContext = new AuthenticationContext(adalConfig);

export const getToken = () => authContext.getCachedToken(adalConfig.clientId);
