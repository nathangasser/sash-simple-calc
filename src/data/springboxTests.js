// Bench test results for Acme Duplex springboxes — ONE test unit per model,
// so treat these as preliminary. Replace/extend this table as more units
// are tested; nothing else in the app needs to change.
//
// Each entry is the pull force in lbs per cable at the cable extensions in
// TEST_EXTENSIONS (inches out of the box, measured from the box bottom),
// for 0-3 clicks of ratchet tension.
//
//   bottom spring = left cable
//   top spring    = right cable
//
// SPRINGBOX_DATA[model][spring][clicks] = [at 3", at 12", at 24"]
// D5 has not been tested yet, so it isn't included.

export const TEST_EXTENSIONS = [3, 12, 24];

export const SPRINGBOX_DATA = {
  D1: {
    bottom: [
      [5, 6.6, 8.2],
      [5.2, 6.4, 7.8],
      [5.2, 6.6, 8],
      [5.2, 6.2, 8.8],
    ],
    top: [
      [5, 6.8, 9.8],
      [5.6, 7, 9.4],
      [5.8, 6.8, 9.2],
      [5.8, 8, 9.4],
    ],
  },
  D2: {
    bottom: [
      [6.5, 8, 11.5],
      [6.6, 9, 11.5],
      [6.8, 9.4, 13],
      [7.2, 9.4, 12.8],
    ],
    top: [
      [7.4, 9.2, 13.4],
      [8, 10, 13.8],
      [8.2, 10.8, 14.4],
      [8.4, 10.8, 14.8],
    ],
  },
  D4: {
    bottom: [
      [13, 16, 18.8],
      [13.6, 16.8, 20],
      [13.5, 15.6, 19],
      [14.2, 17, 19.4],
    ],
    top: [
      [12.8, 15.8, 18],
      [13.2, 16.4, 18],
      [13.6, 16.8, 18],
      [13.6, 16.6, 18],
    ],
  },
};
