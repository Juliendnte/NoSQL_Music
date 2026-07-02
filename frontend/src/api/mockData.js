// Demo dataset used while the backend/Neo4j import isn't wired yet
// (VITE_USE_MOCKS=true). Shapes mirror the API contract in the project spec
// so swapping to the real API later is a no-op for the UI.

export const areas = [
  { mbid: "area-fr", name: "France", type: "Country" },
  { mbid: "area-us", name: "United States", type: "Country" },
  { mbid: "area-gb", name: "United Kingdom", type: "Country" },
  { mbid: "area-ca", name: "Canada", type: "Country" },
  { mbid: "area-bb", name: "Barbados", type: "Country" },
];

export const genres = [
  { name: "Electronic" },
  { name: "House" },
  { name: "Pop" },
  { name: "Hip-Hop" },
  { name: "R&B" },
  { name: "Funk" },
];

export const artists = [
  { mbid: "artist-daft-punk", name: "Daft Punk", type: "Group", country: "FR", gender: null, beginDate: "1993", endDate: "2021", disambiguation: "French electronic duo", genres: ["Electronic", "House", "Funk"] },
  { mbid: "artist-pharrell", name: "Pharrell Williams", type: "Person", country: "US", gender: "Male", beginDate: "1973", endDate: null, disambiguation: "Producer, singer", genres: ["Funk", "Pop", "Hip-Hop"] },
  { mbid: "artist-weeknd", name: "The Weeknd", type: "Person", country: "CA", gender: "Male", beginDate: "1990", endDate: null, disambiguation: null, genres: ["R&B", "Pop"] },
  { mbid: "artist-dualipa", name: "Dua Lipa", type: "Person", country: "GB", gender: "Female", beginDate: "1995", endDate: null, disambiguation: null, genres: ["Pop"] },
  { mbid: "artist-calvinharris", name: "Calvin Harris", type: "Person", country: "GB", gender: "Male", beginDate: "1984", endDate: null, disambiguation: "DJ, producer", genres: ["Electronic", "House", "Pop"] },
  { mbid: "artist-kendrick", name: "Kendrick Lamar", type: "Person", country: "US", gender: "Male", beginDate: "1987", endDate: null, disambiguation: null, genres: ["Hip-Hop"] },
  { mbid: "artist-sza", name: "SZA", type: "Person", country: "US", gender: "Female", beginDate: "1989", endDate: null, disambiguation: null, genres: ["R&B"] },
  { mbid: "artist-justice", name: "Justice", type: "Group", country: "FR", gender: null, beginDate: "2003", endDate: null, disambiguation: "French electronic duo", genres: ["Electronic"] },
  { mbid: "artist-rihanna", name: "Rihanna", type: "Person", country: "BB", gender: "Female", beginDate: "1988", endDate: null, disambiguation: null, genres: ["Pop", "R&B"] },
  { mbid: "artist-travisscott", name: "Travis Scott", type: "Person", country: "US", gender: "Male", beginDate: "1991", endDate: null, disambiguation: null, genres: ["Hip-Hop"] },
];

export const labels = [
  { mbid: "label-columbia", name: "Columbia Records", country: "US" },
  { mbid: "label-daftlife", name: "Daft Life", country: "FR" },
  { mbid: "label-xl", name: "XL Recordings", country: "GB" },
];

export const releases = [
  { mbid: "release-rah", title: "Random Access Memories", date: "2013-05-17", country: "FR", status: "Official", releaseType: "Album", label: "label-daftlife" },
  { mbid: "release-starboy", title: "Starboy", date: "2016-11-25", country: "CA", status: "Official", releaseType: "Album", label: "label-columbia" },
  { mbid: "release-onekiss", title: "One Kiss", date: "2018-04-06", country: "GB", status: "Official", releaseType: "Single", label: "label-xl" },
  { mbid: "release-thisiswhatyoucamefor", title: "This Is What You Came For", date: "2016-04-29", country: "GB", status: "Official", releaseType: "Single", label: "label-columbia" },
  { mbid: "release-damn", title: "DAMN.", date: "2017-04-14", country: "US", status: "Official", releaseType: "Album", label: "label-columbia" },
  { mbid: "release-blackpanther", title: "Black Panther: The Album", date: "2018-02-09", country: "US", status: "Official", releaseType: "Soundtrack", label: "label-columbia" },
  { mbid: "release-ctrl", title: "Ctrl", date: "2017-06-09", country: "US", status: "Official", releaseType: "Album", label: "label-columbia" },
];

export const recordings = [
  { mbid: "rec-getlucky", title: "Get Lucky", length: 369267, firstReleaseDate: "2013-04-19", artistIds: ["artist-daft-punk", "artist-pharrell"], releaseIds: ["release-rah"], popularity: 96 },
  { mbid: "rec-starboy", title: "Starboy", length: 230453, firstReleaseDate: "2016-09-21", artistIds: ["artist-weeknd", "artist-daft-punk"], releaseIds: ["release-starboy"], popularity: 94 },
  { mbid: "rec-onekiss", title: "One Kiss", length: 214847, firstReleaseDate: "2018-04-06", artistIds: ["artist-dualipa", "artist-calvinharris"], releaseIds: ["release-onekiss"], popularity: 89 },
  { mbid: "rec-thisiswhatyoucamefor", title: "This Is What You Came For", length: 207200, firstReleaseDate: "2016-04-29", artistIds: ["artist-calvinharris", "artist-rihanna"], releaseIds: ["release-thisiswhatyoucamefor"], popularity: 91 },
  { mbid: "rec-humble", title: "HUMBLE.", length: 177000, firstReleaseDate: "2017-03-30", artistIds: ["artist-kendrick"], releaseIds: ["release-damn"], popularity: 93 },
  { mbid: "rec-allthestars", title: "All the Stars", length: 232586, firstReleaseDate: "2018-01-04", artistIds: ["artist-kendrick", "artist-sza"], releaseIds: ["release-blackpanther"], popularity: 90 },
  { mbid: "rec-lovegalore", title: "Love Galore", length: 235000, firstReleaseDate: "2017-06-09", artistIds: ["artist-sza", "artist-travisscott"], releaseIds: ["release-ctrl"], popularity: 85 },
  { mbid: "rec-workb", title: "Work (feat. Drake mock)", length: 219000, firstReleaseDate: "2016-01-27", artistIds: ["artist-rihanna"], releaseIds: [], popularity: 88 },
];

// (:Artist)-[:COLLABORATED_WITH]->(:Artist)
export const collaborations = [
  { source: "artist-daft-punk", target: "artist-pharrell", weight: 2, recordingIds: ["rec-getlucky"] },
  { source: "artist-daft-punk", target: "artist-weeknd", weight: 1, recordingIds: ["rec-starboy"] },
  { source: "artist-daft-punk", target: "artist-justice", weight: 1, recordingIds: [] },
  { source: "artist-dualipa", target: "artist-calvinharris", weight: 1, recordingIds: ["rec-onekiss"] },
  { source: "artist-calvinharris", target: "artist-rihanna", weight: 1, recordingIds: ["rec-thisiswhatyoucamefor"] },
  { source: "artist-kendrick", target: "artist-sza", weight: 1, recordingIds: ["rec-allthestars"] },
  { source: "artist-sza", target: "artist-travisscott", weight: 1, recordingIds: ["rec-lovegalore"] },
  { source: "artist-rihanna", target: "artist-travisscott", weight: 1, recordingIds: [] },
  { source: "artist-kendrick", target: "artist-weeknd", weight: 1, recordingIds: [] },
];
