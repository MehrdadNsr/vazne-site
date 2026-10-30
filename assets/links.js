/*
 * Vazne download and tester links: the only place to change them.
 * Used by /test/ and by the download buttons on the home pages (assets/testers.js reads it).
 *
 * - iosAppStore: leave '' until the App Store page is live. Once it is filled, every iPhone
 *   button switches to the App Store and TestFlight becomes a small secondary link.
 * - The HTML keeps the same links as a fallback for visitors without JavaScript; after changing
 *   a link here, search the HTML for the old one (grep) and update it there too.
 */
window.VAZNE_LINKS = {
  // Android closed testing (Google Play), in this order
  androidGroup: 'https://groups.google.com/g/vazne-pre-release-testing',
  androidOptIn: 'https://play.google.com/apps/testing/com.vazne.app',
  androidStore: 'https://play.google.com/store/apps/details?id=com.vazne.app',
  // Direct download for testers who can't reach Google Play (Iran). The file lives in this repo under /download/;
  // replace it (and the name here and in test/index.html) with each new Android build. Keep only the newest file.
  androidApk: '/download/vazne-1.1.9.apk',

  // iPhone
  iosTestFlight: 'https://testflight.apple.com/join/9g8auNhk',
  iosAppStore: '',
  testFlightApp: 'https://apps.apple.com/app/testflight/id899247664',

  // The tester page itself. The QR code on /test/ is a fixed picture of this address:
  // if it ever changes, regenerate it with `python3 tools/make_qr.py` and paste the SVG.
  testerPage: 'https://vazne.app/test/',
};
