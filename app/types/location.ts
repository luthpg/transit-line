import { z } from 'zod';

export interface Station {
  name: string;
  walkMinutes: number;
}

export const SearchRouteParameterSchema = z.object({
  from: z.string(),
  to: z.string(),
  date: z.string(),
  via: z.array(z.string()).max(3),
});

export declare type SearchRouteParameter = z.infer<
  typeof SearchRouteParameterSchema
>;

export type PlatformData = {
  index: number;
  onLine: string | null;
  offLine: string | null;
  lineName: string;
};

export type SectionData = {
  index: number;
  station: string;
  offTimeOfChange: string;
  onTimeOnChange: string;
};

export type SearchTransitRoutesResult = {
  id: string;
  from: string;
  to: string;
  via: string[];
  departureTime: string;
  arrivalTime: string;
  duration: string;
  transferCount: number;
  totalPrice: number;
  hasDelay?: boolean;
  searchUrl: string;
  platformData: PlatformData[];
  sectionData: SectionData[];
};
