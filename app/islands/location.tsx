import dayjs, { type Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useEffect, useMemo, useState } from 'hono/jsx';
import { Button } from '@/islands/button';
import { getUserHomeStation, saveUserHomeStation } from '@/lib/api';
import { scrollToId, sleep } from '@/lib/utils';
import type {
  SearchRouteParameter,
  SearchTransitRoutesResult,
  Station,
} from '@/types/location';
import 'dayjs/locale/ja';

interface Props {
  liffId: string;
  mock?: boolean;
}

export default function LocationClient({ liffId, mock = false }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [homeStation, setHomeStation] = useState('');
  const [isHomeStationOpen, setIsHomeStationOpen] = useState(false);
  const [isNearStationOpen, setIsNearStationOpen] = useState(true);
  const [stationLoading, setStationLoading] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [walkMinutes, setWalkMinutes] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routes, setRoutes] = useState<SearchTransitRoutesResult[]>([]);
  const [selectedRoute, setSelectedRoute] =
    useState<SearchTransitRoutesResult | null>(null);

  const getNearStations = async (latitude: number, longitude: number) => {
    const res = await fetch(
      `/api/station?latitude=${latitude}&longitude=${longitude}`,
    );
    return await res.json<Station[]>();
  };

  useEffect(() => {
    async function init() {
      setStationLoading(true);
      const { initLiff } = await import('@/islands/liff');
      try {
        const { userId } = await initLiff(liffId, mock);
        setUserId(userId);
        const station = await getUserHomeStation(userId);
        setHomeStation(station);
        setIsHomeStationOpen(!station);
      } catch (e) {
        console.error(e);
        setError('アプリの初期化に失敗しました');
        scrollToId('error-message');
        return;
      }

      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject),
        );
        const { latitude, longitude } = position.coords;
        const results = await getNearStations(latitude, longitude);
        setStations(results);
        if (results.length > 0) {
          setSelectedStation(results[0]);
          scrollToId('select-station-title');
        }
      } catch (e) {
        console.error(e);
        setError('位置情報の取得に失敗しました');
        scrollToId('error-message');
      } finally {
        setStationLoading(false);
      }
    }

    dayjs.extend(utc);
    dayjs.extend(timezone);
    dayjs.locale('ja');
    dayjs.tz.setDefault('Asia/Tokyo');

    init();
  }, []);

  useEffect(() => {
    selectedStation != null && setWalkMinutes(selectedStation.walkMinutes);
  }, [selectedStation]);

  const setManualStation = (name: string) => {
    setSelectedStation({
      name,
      walkMinutes: 0,
    });
  };

  const departureDate = useMemo(() => {
    if (!dayjs || !dayjs.tz) return null;
    const now = dayjs.tz();
    return now.add(walkMinutes || 0, 'minute') ?? null;
  }, [walkMinutes]);

  const handleSearchRoutes = async (from: string, to: string, date: Dayjs) => {
    if (from === to) {
      setError('出発駅と到着駅が同じです');
      scrollToId('error-message');
      return;
    }
    setRouteLoading(true);
    try {
      const res = await fetch('/api/searchRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          date: date.tz().toISOString(),
          via: [],
        } satisfies SearchRouteParameter),
      });
      const response = await res.json<SearchTransitRoutesResult[]>();
      setRoutes(response);
      await sleep(10);
      scrollToId('select-route-title');
    } catch (e) {
      console.error(e);
      setRoutes([]);
      console.error('Failed to fetch from Transit Search');
    } finally {
      setRouteLoading(false);
    }
  };

  useEffect(() => {
    routes.length && setSelectedRoute(routes[0]);
  }, [routes]);

  const handlePostRoute = async () => {
    setRouteLoading(true);
    const { initLiff } = await import('@/islands/liff');
    const { liff } = await initLiff(liffId, mock);
    liff.sendMessages([
      {
        type: 'text',
        text: JSON.stringify(selectedRoute),
      },
    ]);
    setRouteLoading(false);
    liff.closeWindow();
  };

  const handleSaveHomeStation = async () => {
    if (!userId || !homeStation) return;
    await saveUserHomeStation(userId, homeStation);
    setIsHomeStationOpen(false);
    scrollToId('select-station-title');
  };

  return (
    <div className="mt-8">
      <p id="error-message" className="mb-4 text-red-500">
        {error}
      </p>

      <div className="rounded-lg p-4 mb-6 bg-gray-50">
        <button
          type="button"
          className="flex w-full justify-between items-center cursor-pointer"
          onClick={() => setIsHomeStationOpen((prev) => !prev)}
        >
          <h2 className="text-lg font-bold">🏠 自宅の最寄り駅</h2>
          <span
            className={`transform transition-transform duration-300 ${
              isHomeStationOpen ? 'rotate-180' : ''
            }`}
          >
            ▼
          </span>
        </button>

        {!isHomeStationOpen && homeStation && (
          <p className="mt-2 p-2 text-gray-800 bg-gray-50 rounded-lg">
            <strong className="text-lg">{homeStation}</strong>
          </p>
        )}

        {isHomeStationOpen && (
          <div className="mt-4">
            <input
              className="mb-4 border rounded-lg w-full p-4"
              type="text"
              placeholder="自宅の最寄り駅を入力"
              value={homeStation}
              onChange={(e: any) => setHomeStation(e.currentTarget.value)}
            />
            <Button
              onClick={handleSaveHomeStation}
              disabled={!userId || !homeStation}
            >
              保存
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg p-4 mb-6 bg-gray-50">
        <button
          type="button"
          className="flex w-full justify-between items-center cursor-pointer"
          onClick={() => setIsNearStationOpen((prev) => !prev)}
        >
          <h2 id="select-station-title" className="text-lg font-bold">
            🚉 現在地の最寄り駅
          </h2>
          <span
            className={`transform transition-transform duration-300 ${
              isNearStationOpen ? 'rotate-180' : ''
            }`}
          >
            ▼
          </span>
        </button>

        {!isNearStationOpen && selectedStation && (
          <div className="mt-2 p-2 text-gray-800 bg-gray-50 rounded-lg">
            <p>
              🚃 最寄り駅:{' '}
              <strong className="text-lg">{selectedStation.name}</strong>
            </p>
            <p className="text-sm text-gray-600">
              徒歩 約 {selectedStation.walkMinutes} 分
            </p>
          </div>
        )}

        {isNearStationOpen && (
          <div className="mt-4">
            {stationLoading && <p>駅を検索中...</p>}
            {stations.map((station) => (
              <Button
                key={station.name}
                onClick={() => {
                  setSelectedStation(station);
                  setIsNearStationOpen(false);
                }}
                isSelected={selectedStation?.name === station.name}
              >
                <p>
                  <strong className="text-lg">{station.name}</strong> から乗る
                </p>
                <p className="text-sm text-gray-600">
                  徒歩 約 {station.walkMinutes} 分
                </p>
              </Button>
            ))}
            {!stationLoading && stations.length === 0 && (
              <>
                <p>周辺に駅が見つかりません</p>
                <label
                  htmlFor="manual-station"
                  className="block mb-2 font-bold"
                >
                  駅名を入力
                </label>
                <input
                  id="manual-station"
                  className="mb-4 border rounded-lg w-full p-4"
                  type="text"
                  placeholder="駅名を入力"
                  onChange={(e: any) => setManualStation(e.currentTarget.value)}
                />
              </>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg p-4 mb-6">
        <label htmlFor="walk-minutes" className="block mb-2 font-bold">
          最寄り駅までの時間（分）
        </label>
        <input
          className="mb-4 border rounded-lg w-full p-4"
          type="number"
          id="walk-minutes"
          value={walkMinutes}
          onChange={(e: any) => setWalkMinutes(Number(e.currentTarget.value))}
        />
        <Button
          onClick={() =>
            selectedStation &&
            handleSearchRoutes(
              selectedStation.name,
              homeStation,
              departureDate!,
            )
          }
          disabled={!selectedStation || !homeStation}
        >
          🔍 経路を探す
        </Button>
      </div>

      <div className="rounded-lg p-4 bg-gray-50">
        <h2 id="select-route-title" className="text-lg font-bold mb-4">
          🛤 経路を選択
        </h2>
        {routeLoading && <p>経路を検索中...</p>}
        {routes.map((route) => (
          <Button
            key={route.id}
            onClick={() => setSelectedRoute(route)}
            isSelected={selectedRoute?.id === route.id}
          >
            <p>
              {route.departureTime} - {route.arrivalTime} ({route.duration} -{' '}
              {route.transferCount}回)
            </p>
            <p className="text-sm text-gray-600">
              {route.platformData.map(({ lineName }) => lineName).join(' → ')}
            </p>
          </Button>
        ))}
        <Button
          onClick={() => selectedRoute && handlePostRoute()}
          disabled={!selectedRoute || !homeStation}
          className="bg-green-600 hover:bg-green-700 text-white mt-4"
        >
          ✉ 経路を投稿
        </Button>
      </div>
    </div>
  );
}
