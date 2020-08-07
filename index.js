const secrets = require("./secrets");
const graph = require("./graph");
const twilio = require("./twilio");
const particle = require("./particle")
const fs = require("fs");
const { Console } = require("console");

const baseUrl = "https://login.microsoftonline.com/" + secrets.SECRET_OFFICE365_TENANTID + "/oauth2/v2.0/";
const clientId = secrets.SECRET_OFFICE365_CLIENTID;
const presenceCheckIntervalSeconds = 10;
const deviceUrl = baseUrl + "devicecode";
const tokenUrl = baseUrl + "token";
const useTwilio = true;
const useParticle = true;

// RGB constants for LED
const OFF = 0x101010;
const RED = 0xFF0000;
const YELLOW = 0xFFFF00;
const ORANGE = 0xFF8800;
const GREEN = 0x00FF00;
const PURPLE = 0xFF00FF;

// Auth stuff
let accessToken = null;
let tokenExpires = null;
let refreshToken = null;

let state = "none";
let presence = {
    availability: "none",
    activity: "none"
};

// main loop
readCreds();
doTheThing();

function doTheThing() {
    switch (state) {
        case "none":
            // check if we have a valid access token. If so, get presence
            if (accessToken && tokenExpires && tokenExpires > new Date().getTime()) {
                state = "waiting";
                graph.GetPresenceRequest(accessToken)
                    .then(result => {
                        // send status only if changed since last poll
                        if (result.availability !== presence.availability || result.activity !== presence.activity) {
                            console.log(`${new Date().toLocaleTimeString()} Presence changed. Availability: ${result.availability}, Activity: ${result.activity}`);
                            switch (result.availability) {
                                case "Available":
                                case "AvailableIdle":
                                    setColor(GREEN);
                                    break;
                                case "Busy":
                                case "BusyIdle":
                                    switch (result.activity) {
                                        case "InACall":
                                        case "InAConferenceCall":
                                            setColor(RED);
                                            break;
                                        default:
                                            setColor(ORANGE);
                                    }
                                    break;
                                case "DoNotDisturb":
                                    setColor(RED);
                                    break;
                                case "Away":
                                    switch (result.activity) {
                                        case "OutOfOffice":
                                            setColor(PURPLE);
                                            break;
                                        default: 
                                            setColor(YELLOW);
                                    }
                                    break;
                                case "BeRightBack":
                                    console.log("Yellow");
                                    setColor(YELLOW);
                                    break;
                                case "Offline":
                                    setColor(OFF);
                                    break;
                                default:
                                    setColor(PURPLE);
                                    break;
                            }
                            presence = result;
                        }
                        state = "none";
                    })
                    .catch((error) => {
                        // graph query failed, so remove the access token and force a refresh
                        accessToken = null;
                        state = "none";
                    });
            }
            // Access token doesn't exist or is expired, so try to get a new one using refresh token
            else if (refreshToken) {
                state = "waiting";
                console.log("Refreshing token...")
                refreshAccessToken();
            }
            // Otherwise ask user to login and get a new token set
            else {
                state = "waiting";
                console.log("Getting new device token...");
                getToken();
            }
            break;
        case "error":
            console.log("Error; exiting");
            process.exit(1);
            break;
    }
    setTimeout(doTheThing, presenceCheckIntervalSeconds * 1000);
}

function setColor(color) {
    if (useParticle) {
        particle.callFunction("SetColor", color);
    }
}

function getToken() {
    graph.OAuthRequest(deviceUrl)
        .then(deviceLogin => {
            console.log(deviceLogin.message);
            if (useTwilio) {
                twilio.SendSms(deviceLogin.message);
            }
            // device code should expire in minutes. Subtract a 10 second buffer for SMS notification
            const deviceCodeExpiry = deviceLogin.expires_in * 1000 - 10000;
            // poll the token endpoint until user logs in
            poll(() => {
                return graph.TokenPollRequest(clientId, deviceLogin.device_code, tokenUrl);
            }, deviceCodeExpiry, 1000)
                .then(data => {
                    // got the end result. If valid, we can extract the user's presence
                    accessToken = data.access_token;
                    tokenExpires = new Date().getTime() + (data.expires_in * 1000);
                    refreshToken = data.refresh_token;
                    saveCreds();
                    state = "none";
                    console.log(tokenExpires);
                })
                .catch(() => {
                    console.log("failed to get data");
                    state = "error";
                });
        });
}

function refreshAccessToken() {
    graph.OAuthRefresh(tokenUrl, refreshToken)
        .then(data => {
            if (data.statusText && data.statusText === "Error") {
                return "Error";
            }
            else {
                accessToken = data.access_token;
                tokenExpires = new Date().getTime() + (data.expires_in * 1000);
                refreshToken = data.refresh_token;
                saveCreds();
                state = "none";
                return "OK";
            }
        })
        .catch(() => state = "error");
}
function readCreds() {
    if (fs.existsSync("./access.json")) {
        const access = JSON.parse(fs.readFileSync("./access.json"));
        accessToken = access.accessToken;
        tokenExpires = access.tokenExpires;
        refreshToken = access.refreshToken;
    }
}

function saveCreds() {
    const access = {
        "accessToken": accessToken,
        "tokenExpires": tokenExpires,
        "refreshToken": refreshToken
    };
    fs.writeFileSync("./access.json", JSON.stringify(access), {mode: 0o600});
}

function poll(fn, timeout, interval) {
    const endTime = Number(new Date()) + (timeout || 10000);
    interval = interval || 1000;

    const checkCondition = (resolve, reject) => {
        let worker = fn();
        worker.then(response => {
            if (response && response.statusText === "OK") {
                resolve(response.data);
            } else if (Number(new Date()) < endTime) {
                process.stdout.write(".");
                setTimeout(checkCondition, interval, resolve, reject);
            } else {
                reject(new Error("Timeout for " + fn + " : " + arguments));
            }
        });
    };
    return new Promise(checkCondition);
}


