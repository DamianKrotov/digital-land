import {Config} from '@remotion/cli/config';

Config.setOverwriteOutput(true);
Config.setVideoImageFormat('jpeg');
// Flat vector graphics compress transparently at CRF 18 (plan §Commands).
Config.setCrf(18);
