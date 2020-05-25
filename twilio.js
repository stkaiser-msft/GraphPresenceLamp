const secrets = require('./secrets');
const axios = require('axios');
const baseUrl = "https://api.twilio.com/2010-04-01/Accounts/";

module.exports = {
    SendSms: async function(message) {
        const url = baseUrl + secrets.SECRET_TWILIO_ACCOUNTSID + "/Messages.json";
        const postData = "From=" + secrets.SECRET_TWILIO_SENDER + "&To=" + secrets.SECRET_RECIPIENT_SMS + 
            "&Body=" + encodeURIComponent(message);
        const params = {
            "headers": {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": postData.length
            },
            "method": "POST",
            "auth": {
                "username": secrets.SECRET_TWILIO_ACCOUNTSID,
                "password": secrets.SECRET_TWILIO_AUTHTOKEN
            }
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