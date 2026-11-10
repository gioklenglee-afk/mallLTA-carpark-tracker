import type { Request, Response } from 'express';

const LTA_CARPARK_ENDPOINT =
  'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';

export interface LTACarParkRecord {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // e.g. "1.2936 103.8572" (Latitude Longitude)
  AvailableLots: number;
  LotType: 'C' | 'H' | 'Y'; // C: Car, H: Heavy Vehicle, Y: Motorcycle
  Agency: 'HDB' | 'LTA' | 'URA';
}

export interface LTACarparkApiResponse {
  success: boolean;
  configured: boolean;
  message?: string;
  count: number;
  value: LTACarParkRecord[];
  timestamp: string;
  source: 'lta-datamall' | 'unconfigured-standby';
}

/**
 * Serverless / Express request handler for pulling live Singapore carpark availability from LTA DataMall.
 * Endpoint: GET /api/carparkavailability
 * Header used upstream: AccountKey: <process.env.LTA_ACCOUNT_KEY>
 */
export default async function handler(req: Request, res: Response): Promise<void> {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  // Read API AccountKey from environment variable (Do not hardcode keys)
  const accountKey =
    process.env.LTA_ACCOUNT_KEY?.trim() || process.env.ACCOUNT_KEY?.trim();

  if (!accountKey) {
    const standbyResponse: LTACarparkApiResponse = {
      success: false,
      configured: false,
      message:
        'LTA_ACCOUNT_KEY environment variable is not configured. Set LTA_ACCOUNT_KEY in your server environment to pull live carpark feeds from LTA DataMall.',
      count: 0,
      value: [],
      timestamp: new Date().toISOString(),
      source: 'unconfigured-standby',
    };

    res.status(200).json(standbyResponse);
    return;
  }

  try {
    const skip = req.query.$skip ? Number(req.query.$skip) : 0;
    const fetchAll = req.query.all === 'true' || req.query.fetchAll === 'true';

    // Helper to fetch one page of 500 records from LTA DataMall
    const fetchPage = async (skipCount: number): Promise<LTACarParkRecord[]> => {
      const url = new URL(LTA_CARPARK_ENDPOINT);
      if (skipCount > 0) {
        url.searchParams.set('$skip', String(skipCount));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      try {
        const upstreamRes = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            AccountKey: accountKey,
            accept: 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!upstreamRes.ok) {
          const errText = await upstreamRes.text().catch(() => '');
          throw new Error(
            `LTA DataMall responded with status ${upstreamRes.status} ${upstreamRes.statusText}: ${errText.slice(0, 200)}`
          );
        }

        const data = (await upstreamRes.json()) as { value?: LTACarParkRecord[] };
        return Array.isArray(data.value) ? data.value : [];
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    let allRecords: LTACarParkRecord[] = [];

    if (fetchAll) {
      // LTA returns data in batches of 500. Loop until empty page or safe max (e.g. 10 pages / 5000 records)
      let currentSkip = 0;
      const MAX_PAGES = 10;
      for (let page = 0; page < MAX_PAGES; page++) {
        const batch = await fetchPage(currentSkip);
        allRecords = allRecords.concat(batch);
        if (batch.length < 500) {
          break; // Last page reached
        }
        currentSkip += 500;
      }
    } else {
      allRecords = await fetchPage(skip);
    }

    const payload: LTACarparkApiResponse = {
      success: true,
      configured: true,
      count: allRecords.length,
      value: allRecords,
      timestamp: new Date().toISOString(),
      source: 'lta-datamall',
    };

    res.status(200).json(payload);
  } catch (error: unknown) {
    console.error('Error fetching from LTA DataMall:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown upstream error';

    res.status(502).json({
      success: false,
      configured: true,
      error: 'Upstream LTA DataMall connection failed',
      details: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
