const secrets = require('./secrets');
const axios = require('axios');
module.exports = {
    // Get openid config and parse JSON to find the token endpoint
    GetTenantDeviceoAuthURL: function (loginHostname) {
        let tokenEndpoint = "";

        const domain = secrets.SECRET_OFFICE365_DOMAIN;
        const url = "https://" + loginHostname + "/common/v2.0/.well-known/openid-configuration";
        tokenEndpoint = axios.get(url)
            .then(response => {
                //console.log(data.token_endpoint);
                return response.data.token_endpoint;
            })
            .catch(error => { console.log(error); });
        return tokenEndpoint;
    },

    // Log into server and returns a deviceCode to be used with TokenPollRequest
    OAuthRequest: function (url, retry = true) {
        let deviceCode = {};
        const clientId = secrets.SECRET_OFFICE365_CLIENTID;
        const postData = "client_id=" + clientId + "&scope=user.read%20openid%20profile%20offline_access";
        const params = {
            "headers": {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": postData.length
            },
            "method": "POST"
        };
        deviceCode = axios.post(url, postData, params)
            .then(response => {
                //console.log(response.data);
                return response.data;
            })
            .catch(error => { 
                console.log(error);
                return {"statusText": "Error"};
            });
        return deviceCode;

    },

    OAuthRefresh: function(url, refreshToken) {
        let tokenResponse = {};
        const clientId = secrets.SECRET_OFFICE365_CLIENTID;
        const postData = "client_id=" + clientId + 
            "&scope=user.read%20openid%20profile%20offline_access" +
            "&grant_type=refresh_token" +
            "&redirect_uri=http%3A%2F%2Flocalhost%2F" +
            "&refresh_token=" + refreshToken;
        const params = {
            "headers": {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": postData.length
            },
            "method": "POST"
        };
        tokenResponse = axios.post(url, postData, params)
            .then(response => {
                //console.log(response.data);
                return response.data;
            })
            .catch(error => { 
                console.log(error);
                return {"statusText": "Error"};
            });
        return tokenResponse;


    },

    // Worker to poll once for device token. Returns null if token is not ready yet.
    // Call repeatedly until token is returned.
    TokenPollRequest: function (clientId, deviceCode, url) {
        const postData = "grant_type=urn:ietf:params:oauth:grant-type:device_code&client_id=" + clientId + "&device_code=" + deviceCode;
        const params = {
            "headers": {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": postData.length
            },
            "method": "POST"
        };
        tokenResponse = axios.post(url, postData, params)
            .then(response => {
                //console.log(response.data);
                return response;
            })
            .catch(error => {
                //console.log(error); 
                return {"statusText": "Error"};}
            );
        return tokenResponse;

    },

    // Get my Teams presence value
    GetPresenceRequest: function (accessToken) {
        let presence = "";
        const url = "https://graph.microsoft.com/beta/me/presence";
        const params = {
            "headers": {
                "Authorization": "Bearer " + accessToken
            },
            "method": "GET"
        };
        presence = axios.get(url, params)
            .then(response => {
                // console.log(response.data);
                return response.data;
            })
            .catch(error => { console.log(error.response.status + " " + error.response.statusText); });
        return presence;
    }

}

// 😁

