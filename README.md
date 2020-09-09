# GraphPresenceLamp

Uses Microsoft Graph to query for Teams presence (Available, Busy, etc.) and send that status to a Particle IoT device, such as Photon. This allows changing the color of an RGB LED to show your status.

I chose the Particle device because it's small and simple, with low power requirements. But the code can be modified to run great on a Raspberry Pi or other WiFi-enabled device!

## Steps

- Create an [App Registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app) in your Azure AD.
- Copy `secrets-template.js` to `secrets.js` and fill in values for your Office 365 and application.
> Note: Twilio support is included in case you run the code on a headless computer, so you can get the device login code. You can disable Twilio by setting `const useTwilio = false;` in index.js.
- Run `node index.js`. 