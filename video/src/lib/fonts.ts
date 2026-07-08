import {loadFont} from '@remotion/fonts';
import {continueRender, delayRender, staticFile} from 'remotion';

// Self-hosted IBM Plex (OFL — receipt at public/fonts/OFL.txt and in
// refs/sources.md). Explicit delayRender guarantees no first-frame FOUT.
const handle = delayRender('fonts');

Promise.all([
  loadFont({family: 'IBM Plex Sans', url: staticFile('fonts/IBMPlexSans-Regular.woff2'), weight: '400'}),
  loadFont({family: 'IBM Plex Sans', url: staticFile('fonts/IBMPlexSans-SemiBold.woff2'), weight: '600'}),
  loadFont({family: 'IBM Plex Sans', url: staticFile('fonts/IBMPlexSans-Bold.woff2'), weight: '700'}),
  loadFont({family: 'IBM Plex Mono', url: staticFile('fonts/IBMPlexMono-Regular.woff2'), weight: '400'}),
  loadFont({family: 'IBM Plex Mono', url: staticFile('fonts/IBMPlexMono-Medium.woff2'), weight: '500'}),
])
  .then(() => continueRender(handle))
  .catch((err) => {
    console.error('font load failed', err);
    continueRender(handle);
  });
