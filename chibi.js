(() => {
  'use strict';

  const W = 27, H = 31;
  const palette = {
    k: '#201823', d: '#39313d', t: '#5d5260',
    g: '#928894', s: '#c9c0ca', w: '#f0e9e5', h: '#fff8ef',
    f: '#f3d6ce', p: '#dca6a7', b: '#f2abb2',
    v: '#632639', r: '#9f3852', m: '#d7798d'
  };
  const cache = new Map();

  function frame(stride = 0, blink = false, toss = false) {
    const key = `${stride}/${+blink}/${+toss}`;
    if (cache.has(key)) return cache.get(key);
    const sprite = document.createElement('canvas');
    sprite.width = W; sprite.height = H;
    const c = sprite.getContext('2d');
    const pixel = (x, y, fill, width = 1, height = 1) => {
      c.fillStyle = palette[fill]; c.fillRect(x, y, width, height);
    };
    const rows = (x, y, data) => data.forEach((row, dy) => {
      for (let dx = 0; dx < row.length; dx++) {
        if (row[dx] !== '.') pixel(x + dx, y + dy, row[dx]);
      }
    });

    // Two short boots with independent footfalls and a pixel of rim light.
    const boot = (x, high) => rows(x, high ? 26 : 27, ['.kk.', 'kdkk', 'kttk', 'kkkk']);
    boot(stride < 0 ? 8 : 9, stride > 0);
    boot(stride > 0 ? 15 : 14, stride < 0);

    // Split lab coat, black collar, hanging sash and a tiny name badge.
    rows(4, 18, [
      '.....kkkkkkkk.....',
      '...kkshkddkhskk...',
      '..kshwhdkdkhhsk..',
      '.kswshhhkkshwssk.',
      '.kwskswkdtkwhkswk',
      '.kswkswkdtkwhkswk',
      '..kkkswktdkwhkkk.',
      '...kswhkkkwhsvk..',
      '...kswkkdkkwsvk..',
      '...kkk.kdk.kkvrk.',
      '.......kk.....kk.'
    ]);
    pixel(11, 23, 'h'); pixel(16, 23, 'r'); pixel(16, 24, 'v');
    pixel(13, 23, 's'); pixel(12, 24, 's', 3); pixel(13, 25, 's');
    if (toss) rows(20, 19, ['...kk.', '..kddk', '.kskdk', 'kwhsk.', 'kwsk..', '.kk...']);

    // Silvery tufts form a stepped silhouette. The side locks frame the coat.
    const y = stride < 0 ? -1 : 0;
    const head = (x, top, data) => rows(x, top + y, data);
    head(0, 4, [
      '.......kkkkkkkkkk.......',
      '.....kkwwdkkkkdswkk.....',
      '..k.kwwhdktddkdhwwsk....',
      '..kkshhwkkdtdkswshwkk...',
      '.kwwwhwdkdddkhshhwwskk..',
      'kkshhwhkdtdkwhwwhshwwkk.',
      '.kwswhwkkdkwhhwhwkswsskk',
      '..kkhwskkkwhwhwhwskkkwk.',
      '..kwhwkspffwwhhwsshwwkk.',
      '.kshwksfffpwhwwswhswwsk.',
      '.kwwskpfhhfffwswfhkswskk',
      '..kkhksffhffffwwhpskwsk.',
      '...kskwpffhhfffwpfwkwwk.',
      '..kshwsppfffhfffpswswsk.',
      '.kwhwskkppffffpskwwswwkk',
      '..kkwskkkspppskkkswskkk.',
      '....kkkswkkskkwsswkk....',
      '.....kkwk...kswskk......',
      '.......k......kk........'
    ]);

    // A tilted nurse cap: off-white crown, charcoal trim and a wine-red cross.
    head(5, 1, [
      '..kkkkkkkkk......',
      '.khhhhhwwsskk....',
      '.kwwhrhwwwssskk..',
      '..khrvrwskhwsskk.',
      '..kwhrwskswhwwsk.',
      '...kwwskkswwsskk.',
      '....kkk..kkkkk...'
    ]);

    // Half-lidded wine eyes (or resting blink), warm cheeks and a tiny mouth.
    if (blink) {
      head(7, 14, ['.kkkk......kkkk', '..kk........kk.']);
    } else {
      head(7, 13, ['..kk........k..', '.kkkk......kkkk', '.kvhk......kvhk', '..rmk.......rmk']);
    }
    head(7, 17, ['.bb...v....bb..', '......p........']);
    cache.set(key, sprite);
    return sprite;
  }

  window.ClinicChibi = { W, H, frame };
})();
