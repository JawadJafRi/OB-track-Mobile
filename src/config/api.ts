/**
 * API endpoint configuration.
 *
 * Dev builds talk to the backend running on the developer's machine. The device
 * reaches it through `adb reverse tcp:3000 tcp:3000`, which forwards the phone's
 * own localhost:3000 to the laptop's — so no LAN IP is baked into the source and
 * the same build works on any machine.
 *
 * If you'd rather hit the backend over Wi-Fi instead of USB, drop the adb reverse
 * and set DEV_BASE_URL to `http://<your-laptop-lan-ip>:3000/api/v1`.
 */
const DEV_BASE_URL = 'http://localhost:3000/api/v1';
// TEMPORARY — local verification build. Revert to
// 'http://13.205.21.213/api/v1' before shipping.
const PROD_BASE_URL = 'http://localhost:3000/api/v1';

export const BASE_URL = __DEV__ ? DEV_BASE_URL : PROD_BASE_URL;
