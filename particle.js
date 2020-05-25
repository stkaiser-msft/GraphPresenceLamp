const secrets = require('./secrets');
const axios = require('axios');
const baseUrl = "https://api.particle.io/v1/devices/";

module.exports = {
    callFunction: function(functionName, functionParam) {
        const url = baseUrl + secrets.SECRET_PARTICLE_DEVICEID + "/" + functionName;
        const postData = "arg=" + functionParam + 
            "&access_token=" + secrets.SECRET_PARTICLE_TOKEN;
        const params = {
            "headers": {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": postData.length
            },
            "method": "POST",
        };
        const messageStatus = axios.post(url, postData, params)
            .then(response => {
                //console.log(response.data);
                return response.data;
            })
            .catch(error => { 
                console.log(error);
                return {"statusText": "Error"};
            });
        return messageStatus;

    }
}