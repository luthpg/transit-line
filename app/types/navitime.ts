export interface NavitimeResponse {
  items: NavitimeItem[];
  unit: unknown;
}

export interface NavitimeItem {
  sections: Section[];
  summary: Summary;
}

export interface Section {
  coord?: Coord;
  name?: string;
  type: 'point' | 'move';
  distance?: number;
  from_time?: string;
  line_name?: string;
  move?: string;
  time?: number;
  to_time?: string;
  gateway?: string;
  node_id?: string;
  node_types?: string[];
  numbering?: Numbering;
  transport?: Transport;
}

export interface Coord {
  lat: number;
  lon: number;
}

export interface Numbering {
  departure?: NumberingInfo[];
  arrival?: NumberingInfo[];
}

export interface NumberingInfo {
  number: string;
  symbol: string;
}

export interface Transport {
  color: string;
  company: Company;
  fare: { [key: string]: number };
  fare_break: { [key: string]: boolean };
  fare_detail: FareDetail[];
  fare_season: string;
  getoff?: string;
  id: string;
  links: Link[];
  name: string;
  type: string;
}

export interface Company {
  id: string;
  name: string;
}

export interface FareDetail {
  fare: number;
  goal: FareGoal;
  id: string;
  start: FareStart;
}

export interface FareGoal {
  name: string;
  node_id: string;
}

export interface FareStart {
  name: string;
  node_id: string;
}

export interface Link {
  destination: Destination;
  direction: string;
  from: From;
  id: string;
  name: string;
  to: To;
}

export interface Destination {
  id: string;
  name: string;
}

export interface From {
  id: string;
  name: string;
}

export interface To {
  id: string;
  name: string;
}

export interface Summary {
  goal: Goal;
  move: Move;
  no: string;
  start: Start;
}

export interface Goal {
  coord: Coord;
  name: string;
  type: string;
}

export interface Move {
  distance: number;
  fare?: { [key: string]: number };
  from_time: string;
  time: number;
  to_time: string;
  transit_count: number;
  type: string;
  walk_distance: number;
}

export interface Start {
  coord: Coord;
  name: string;
  type: string;
}
