import { env } from 'hono/adapter';
import { createRoute } from 'honox/factory';
import { DateUtils } from '@/lib/date';
import { fetchFromNavitime } from '@/lib/navitime';
import type {
  PlatformData,
  SearchRouteParameter,
  SearchTransitRoutesResult,
  SectionData,
} from '@/types/location';
import type { NavitimeResponse } from '@/types/navitime';

export const POST = createRoute(async (c) => {
  const { RAPID_API_KEY, SBU_API_HUB_KEY } = env<{
    RAPID_API_KEY: string;
    SBU_API_HUB_KEY: string;
  }>(c);

  if (RAPID_API_KEY == null && SBU_API_HUB_KEY == null)
    throw Error('API key is not defined');

  const getStationCoord = async (name: string): Promise<[number, number]> => {
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
    const { lat, lon } = response.items?.[0]?.coord ?? {};
    return [lat ?? 0, lon ?? 0];
  };

  const searchRoutes = async ({
    fromCoord,
    toCoord,
    date,
    via,
  }: {
    fromCoord: string;
    toCoord: string;
    date: string;
    via: string[];
  }) => {
    const config = {
      start: fromCoord,
      goal: toCoord,
      datum: 'wgs84',
      coord_unit: 'degree',
      term: 1440,
      start_time: date,
      shape: false,
      walk_speed: 5,
      unuse: [
        'domestic_flight',
        'superexpress_train',
        'sleeper_ultraexpress',
        'ultraexpress_train',
        'express_train',
        'semiexpress_train',
      ].join('.'),
      via: via.length > 0 ? via.join(',') : undefined,
    };
    const response = await fetchFromNavitime({
      sbuPath:
        '%E3%83%AB%E3%83%BC%E3%83%88%E6%A4%9C%E7%B4%A2%EF%BC%88%E3%83%88%E3%83%BC%E3%82%BF%E3%83%AB%E3%83%8A%E3%83%93%EF%BC%89',
      endpoint: 'route_transit',
      config,
      rapidApiKey: RAPID_API_KEY,
      sbuApiHubKey: SBU_API_HUB_KEY,
      rapidApiHostName: 'navitime-route-totalnavi.p.rapidapi.com',
    });
    const navitimeResult = response as unknown as NavitimeResponse;

    const getTimeString = (date: Date | string) => {
      const dateUtils = new DateUtils(date);
      return `${dateUtils.hour}:${dateUtils.minute}`;
    };

    const results: SearchTransitRoutesResult[] = navitimeResult.items.map(
      (item) => {
        const { sections, summary } = item;

        const stationPoints = sections.filter(
          (s) => s.type === 'point' && s.name !== 'start' && s.name !== 'goal',
        );
        const fromStation = stationPoints[0]?.name ?? '';
        const toStation = stationPoints[stationPoints.length - 1]?.name ?? '';

        const platformData: PlatformData[] = [];
        const sectionData: SectionData[] = [];

        let sectionIndex = 0;
        for (let i = 0; i < sections.length; i++) {
          const current = sections[i];
          if (
            current.type === 'point' &&
            current.name !== 'start' &&
            current.name !== 'goal'
          ) {
            const stationName = current.name ?? '';
            if (stationName === fromStation) {
              continue;
            }

            const arrivalMove = sections[i - 1];
            const departureMove = sections[i + 1];

            sectionData.push({
              index: sectionIndex++,
              station: stationName,
              offTimeOfChange:
                arrivalMove?.type === 'move' && arrivalMove.to_time
                  ? getTimeString(arrivalMove.to_time)
                  : '',
              onTimeOnChange:
                departureMove?.type === 'move' && departureMove.from_time
                  ? getTimeString(departureMove.from_time)
                  : '',
            });
          }
        }

        let platformIndex = 0;
        for (let i = 0; i < sections.length; i++) {
          const current = sections[i];
          if (current.type === 'move' && current.move !== 'walk') {
            const lineName = current.line_name ?? '';

            platformData.push({
              index: platformIndex++,
              onLine: null,
              offLine: null,
              lineName: lineName,
            });
          }
        }

        const durationHours = Math.floor(summary.move.time / 60);
        const durationMinutes = summary.move.time % 60;
        return {
          id: `transit-${summary.no}`,
          from: fromStation,
          to: toStation,
          via: via,
          departureTime: getTimeString(summary.move.from_time),
          arrivalTime: getTimeString(summary.move.to_time),
          duration: `${durationHours}時間${durationMinutes}分`,
          transferCount: summary.move.transit_count,
          totalPrice: summary.move.fare?.['unit_0'] ?? 0,
          searchUrl: '',
          platformData: platformData,
          sectionData: sectionData,
        };
      },
    );
    return results;
  };

  const {
    from,
    to,
    date: isoDate,
    via,
  } = await c.req.json<SearchRouteParameter>();
  const [fromLat, fromLon] = await getStationCoord(from);
  const fromCoord = `${fromLat},${fromLon}`;
  const [toLat, toLon] = await getStationCoord(to);
  const toCoord = `${toLat},${toLon}`;
  const date = new DateUtils(isoDate).toISOString;
  const routes = await searchRoutes({ fromCoord, toCoord, date, via });
  return c.json(routes);
});
