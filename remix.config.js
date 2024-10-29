/** @type {import('@remix-run/dev').AppConfig} */
export default {
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true,
  },
  // Add these configurations
  dev: {
    port: 3005,
    websocketPort: 3005
  }
};