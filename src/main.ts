import * as videos from './code/videos';
import * as ui from './code/ui';
import * as masthead from './code/masthead';

async function init() {
  await videos.init();
  await masthead.init();
  await ui.init();
}

init().catch(console.error);
