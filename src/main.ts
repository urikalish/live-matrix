import { VideosManager } from './code/videos-manager';
import { UIManager } from './code/ui-manager';

class Main {
  videosManager: VideosManager = new VideosManager();
  uiManager: UIManager= new UIManager(this.videosManager);

  async init() {
    await this.videosManager.init();
    await this.uiManager.init();
  }
}

const main = new Main();
main.init().then(null);
