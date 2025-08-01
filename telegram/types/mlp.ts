interface Character {
  id: string;
  name: string;
  alias: string;
  url: string;
  sex: string;
  residence: string;
  occupation: string;
  kind: string;
  image: string[];
}

interface Episode {
  id: string;
  name: string;
  image: string;
  url: string;
  season: string;
  episode: string;
  overall: string;
  airdate: string;
  storyby: string;
  writtenby: string;
  storyboard: string;
}

interface Comic {
  id: string;
  name: string;
  series: string;
  image: string;
  url: string;
  writer: string;
  artist: string;
  colorist: string;
  letterer: string;
  editor: string;
}

export { Character, Episode, Comic };