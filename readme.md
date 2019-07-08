# A memo on how to implement Azure AD authentication using React and .NET Core

![Azure AD logo](https://miro.medium.com/max/900/1*zBRB2ndXYp9xTlCNsT7pag.png)

I found many ways to implement Azure AD authentication using React and a .NET Core 2.x backend. In this article, I will demonstrate how to implement this type of authentication.

### Register your application

The first step is to register your Azure AD. Once you’ve done that, you can use the keys generated by Azure to implement authentication in your app.

Now, we will configure the frontend to get an Azure AD access token and then to consume this token in the backend.
If you want to see the code in details, please check the following repository: https://github.com/Odonno/azuread-react-dotnet-core

### The frontend

There is plenty of implementation for the frontend and the most used is surely the `angular-adal` library, not really the best choice in our case. We could use the simple `adal.js` but why having to reinvent the wheel everytime?

Fortunately, I found a [library on GitHub](https://github.com/salvoravida/react-adal) called `react-adal` that seems to make a pretty good job. So, let’s start with it and see how simple it is.

```
npm install react-adal
```

Once you get there you’ll need to write two things:

* a config file with the keys you got from Azure in the previous step
* call the authenticate method

```js
import { AuthenticationContext, AdalConfig } from 'react-adal';

const adalConfig: AdalConfig = {
    tenant: 'my-org.onmicrosoft.com',
    clientId: '11111111-aaaa-2222-bbbb-33333333333',
    redirectUri: 'http://localhost:3000',
    endpoints: {
        api: 'https://my-org.onmicrosoft.com/11111111-aaaa-2222-bbbb-33333333333'
    },
    cacheLocation: 'sessionStorage'
};

export const authContext = new AuthenticationContext(adalConfig);

export const getToken = () => authContext.getCachedToken(adalConfig.clientId);
```

Once you got your configuration file completed, execute this function in your `index.tsx` file:

```js
import { runWithAdal } from 'react-adal';
import { authContext } from './adalConfig';

const DO_NOT_LOGIN = false;

runWithAdal(
    authContext,
    () => { require('./indexApp'); },
    DO_NOT_LOGIN
);
```

And you are ready to go. Now, each time a user enter in this function, a new page will be displayed so he can set his credentials and connect. And as a bonus, I give you the `getToken()` method to easily get the authentication token we will need to ensure the user has access to our backend.

Remember to set your headers as is to make your HTTP calls with the Azure AD authentication token.

```js
const headers = { Authorization: `Bearer ${getToken()}` };
```

One thing to note is that the first token you generate from the callback url has a 1 hour lifetime. So, when this token is near expiration, a refresh token will be retrieved by the library. By default, the `react-adal` library will try to refreh the token at least 5 minutes before the current token expiration date.

### The backend

Now, everytime the user send a request to your backend, you need to ensure the token is valid one. And this token will also help you to detect who is the user.

#### The configuration file

You will have to set this information in your `appsettings.json` according to your keys.

```json
"AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "Tenant": "my-org.onmicrosoft.com",
    "ClientId": "11111111-aaaa-2222-bbbb-33333333333"
}
```

#### Configure services

Start adding a few line of code in the `ConfigureServices() ` method.

```cs
// Add authentication (Azure AD) 
services
    .AddAuthentication(sharedOptions =>
    {
        sharedOptions.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        var authSettings = Configuration.GetSection("AzureAd").Get<AzureAdOptions>();

        options.Audience = authSettings.ClientId;
        options.Authority = authSettings.Authority;
    });
```

And make sure you have this line of code in your `Configure()` method.

```cs
app.UseAuthentication();
```

Oh, and if you use a Swagger generator, here is the code to add the Authorization token form in Swagger.

```cs
services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Info { Title = "Example API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new ApiKeyScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = "header",
        Type = "apiKey"
    });

    c.AddSecurityRequirement(new Dictionary<string, IEnumerable<string>>
    {
        { "Bearer", Enumerable.Empty<string>() }
    });
});
```

#### Detect user profile

Well now, your backend is secure but how do we know who is logged in.
Here are some basic methods you can use in your application:

```cs
public class AzureAdIdentityService
{
    // Indicates if the user is authenticated
    public bool IsAuthenticated()
    {
        return _httpContextAccessor.HttpContext.User.Identity.IsAuthenticated;
    }

    // Returns the principal user login (ie. principal account mail)
    public string GetMail()
    {
        return _httpContextAccessor.HttpContext.User.Identity.Name;
    }

    // Returns the id of the user in Azure AD (GUID format)
    public string GetId()
    {
        var idClaims = _httpContextAccessor.HttpContext.User.Claims
            .FirstOrDefault(c => c.Type == AzureAdClaimTypes.ObjectId);

        return idClaims?.Value;
    }
}
```

### Conclusion

And voila, you are good to go.