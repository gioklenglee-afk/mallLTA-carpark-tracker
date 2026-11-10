import type { Request, Response } from 'express';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
  ltaAccountKeyConfigured: boolean;
  uptimeSeconds: number;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  const isConfigured = Boolean(
    process.env.LTA_ACCOUNT_KEY?.trim() || process.env.ACCOUNT_KEY?.trim()
  );

  const payload: HealthResponse = {
    status: 'ok',
    service: 'Singapore LTA Carpark Tracker API',
    timestamp: new Date().toISOString(),
    ltaAccountKeyConfigured: isConfigured,
    uptimeSeconds: Math.floor(process.uptime()),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(200).json(payload);
}
