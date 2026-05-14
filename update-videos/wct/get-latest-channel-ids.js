async function getChannelIdFromCamPage(camPageUrl) {
  try {
    const res = await fetch(camPageUrl);
    const htmlString = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const camSrc = doc.querySelector('#contentBox #insideCam > iframe')?.getAttribute('src') || '';
    const prefix = `https://www.youtube.com/embed/live_stream?channel=`;
    if (!camSrc.startsWith(prefix)) {
      return '';
    }
    const afterPrefix = camSrc.slice(prefix.length);
    const channelId = afterPrefix.split('&')[0];
    return channelId || '';
  } catch (err) {
    console.error(err);
    return '';
  }
}

async function getAllChannelIds() {
  const channelIds = [];
  try {
    const camElms = document.querySelectorAll('#contentBox .nspArtPage > .nspArt > a');
    for (let i = 0; i < camElms.length; i++) {
      const camPageUrl = camElms[i].getAttribute('href');
      const channelId = await getChannelIdFromCamPage(`https://www.webcamtaxi.com/${camPageUrl}`);
      if (channelId) {
        channelIds.push(channelId);
      }
    }
  } catch (err) {
    console.error(err);
  }
  return channelIds;
}

async function go() {
  const url = `https://www.webcamtaxi.com/en/latest-webcams.html`;
  if (window.location.href === url) {
    const channelIds = await getAllChannelIds();
    console.log(channelIds);
  } else {
    alert('This code snippet must be executed from\n' + url);
  }
}

go().then(() => {});
