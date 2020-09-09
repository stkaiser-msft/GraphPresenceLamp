# GraphPresenceLamp

Uses Microsoft Graph to query for Teams presence (Available, Busy, etc.) and send that status to a Particle IoT device, such as Photon. This allows changing the color of an RGB LED to show your status.

I chose the Particle device because it's small and simple, with low power requirements. But the code can be modified to run great on a Raspberry Pi or other WiFi-enabled device!