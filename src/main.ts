// const app = document.getElementById('app');

async function init() {
  const res = await fetch('/video-ids.json');
  const videoIds = await res.json();
  console.log(videoIds);
}

init().then(null);
