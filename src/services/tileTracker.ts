const TILES_PER_VIEWPORT = 12;

let owmTiles = 0;
let googleMapsTiles = 0;

export const tileTracker = {
  incrementOWM() {
    owmTiles += TILES_PER_VIEWPORT;
  },

  incrementGoogleMaps() {
    googleMapsTiles += TILES_PER_VIEWPORT;
  },

  getCounts() {
    return { owmTiles, googleMapsTiles };
  },

  reset() {
    owmTiles = 0;
    googleMapsTiles = 0;
  },

  hasCounts() {
    return owmTiles > 0 || googleMapsTiles > 0;
  },
};
