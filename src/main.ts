import { VideosManager } from './code/videos-manager';
import { MastheadManager } from './code/masthead-manager';
import { UIManager } from './code/ui-manager';

class Main {
  videosManager: VideosManager = new VideosManager();
  mastheadManager: MastheadManager = new MastheadManager();
  uiManager: UIManager = new UIManager();

  async init() {
    await this.videosManager.init();
    await this.mastheadManager.init();
    await this.uiManager.init(this.videosManager, this.mastheadManager);
  }
}

const main = new Main();
main.init().then(null);
