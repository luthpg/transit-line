import { env } from 'hono/adapter';
import { createRoute } from 'honox/factory';
import { fetchFromNavitime } from '@/lib/navitime';
import type { Station } from '@/types/location';

export const GET = createRoute(async (c) => {
  const { RAPID_API_KEY, SBU_API_HUB_KEY } = env<{
    RAPID_API_KEY: string;
    SBU_API_HUB_KEY: string;
  }>(c);

  if (RAPID_API_KEY == null && SBU_API_HUB_KEY == null)
    throw Error('API key is not defined');

  const getNearStations = async (
    latitude: number,
    longitude: number,
    ...excludeStations: string[]
  ): Promise<Station[]> => {
    const limit = 4;
    const config = {
      coord: `${latitude},${longitude}`,
      datum: 'wgs84',
      coord_unit: 'degree',
      limit,
      term: '60',
      walk_speed: '6',
    };
    const response = await fetchFromNavitime({
      sbuPath: '%E6%9C%80%E5%AF%84%E3%82%8A%E9%A7%85%E6%A4%9C%E7%B4%A2',
      endpoint: 'transport_node/around',
      config,
      rapidApiKey: RAPID_API_KEY,
      sbuApiHubKey: SBU_API_HUB_KEY,
      rapidApiHostName: 'navitime-transport.p.rapidapi.com',
    });
    const results: Station[] =
      response.items
        ?.map((item) => ({
          name: item.name,
          walkMinutes: parseInt(item.time, 10),
        }))
        ?.filter(({ name }) => !(excludeStations ?? []).includes(name)) ?? [];
    return results;
  };

  const sanitizeStationName = async (name: string): Promise<string> => {
    const config = {
      word: name,
      datum: 'wgs84',
      coord_unit: 'degree',
      offset: 0,
      limit: 1,
    };
    const response = await fetchFromNavitime({
      sbuPath: '%E9%A7%85%E5%90%8D%E6%A4%9C%E7%B4%A2',
      endpoint: 'transport_node',
      config,
      rapidApiKey: RAPID_API_KEY,
      sbuApiHubKey: SBU_API_HUB_KEY,
      rapidApiHostName: 'navitime-transport.p.rapidapi.com',
    });
    return response.items?.[0]?.name ?? name;
  };

  const latitude = c.req.query('latitude');
  const longitude = c.req.query('longitude');
  const stations = await getNearStations(Number(latitude), Number(longitude));
  const sanitizedStations = await Promise.all(
    stations.map(async (station) => ({
      ...station,
      name: await sanitizeStationName(station.name),
    })),
  );
  return c.json(sanitizedStations);
});
