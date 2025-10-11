export interface ResponseBody {
  status_code?: number;
  message?: string;
  msg?: string;
  details?: Record<string, string>;
  items?: {
    name: string;
    time: string;
    coord?: { lat: number; lon: number };
  }[];
  unit?: Record<string, string>;
}

export const fetchFromNavitime = async ({
  sbuPath,
  endpoint,
  config,
  rapidApiKey,
  sbuApiHubKey,
  rapidApiHostName,
}: {
  sbuPath: string;
  endpoint: string;
  config: Record<string, string | number | boolean | undefined>;
  rapidApiKey: string | undefined;
  sbuApiHubKey: string | undefined;
  rapidApiHostName: string;
}): Promise<ResponseBody> => {
  const queryString = Object.entries(config)
    .filter(([, value]) => value != null)
    .map(([key, value]) => `${key}=${encodeURI(value!.toString())}`)
    .join('&');

  const handleResponse = async (res: Response): Promise<ResponseBody> => {
    const response = await res.json<ResponseBody>();
    if (
      (response.status_code && response.status_code !== 200) ||
      !response.items
    ) {
      const copied = { ...response };
      throw Error(
        `${copied.message ?? copied.msg}: ${JSON.stringify(
          copied.details ?? copied.msg,
        )}`,
      );
    }
    return response;
  };

  try {
    if (!rapidApiKey) throw new Error('RAPID_API_KEY is not defined');
    const url = `https://navitime-transport.p.rapidapi.com/${endpoint}?${queryString}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': rapidApiHostName,
      },
    });
    return await handleResponse(res);
  } catch (e) {
    console.error(e);
    console.warn('Workaround to use SBU API');
    if (!sbuApiHubKey) throw new Error('SBU_API_HUB_KEY is not defined');
    const url = `https://proxy.sbi-digitalhub.co.jp/202209150000003/${sbuPath}/1/${endpoint}?${queryString}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Sbiapi-User-Appkey': sbuApiHubKey,
        'X-SBIAPI-Host': 'https://proxy.sbi-digitalhub.co.jp',
      },
    });
    return await handleResponse(res);
  }
};
