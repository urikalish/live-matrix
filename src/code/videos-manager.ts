export class VideosManager {
  videoIds: string[] = [];

  async loadVideoIdsData() {
    const res = await fetch('/video-ids.json');
    this.videoIds = await res.json();
    let currentIndex = this.videoIds.length;
    let randomIndex;
    while (currentIndex > 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [this.videoIds[currentIndex], this.videoIds[randomIndex]] = [
        this.videoIds[randomIndex],
        this.videoIds[currentIndex],
      ];
    }
  }

  getYouTubeVideoSrc(videoId: string) {
    return `https://www.youtube.com/embed/${videoId}?autohide=1&autoplay=1&controls=0&disablekb=1&iv_load_policy=3&modestbranding=1&mute=1&playsinline=1&rel=0&showinfo=0&vq=hd1080`;
  }

  async init() {
    await this.loadVideoIdsData();
  }
}
