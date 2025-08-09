import https from 'https';
import { URL } from 'url';

type MispSearchResult = {
  success: boolean;
  error?: string;
  attributes?: any[];
  events?: any[];
};

class MispService {
  private baseUrl: string;
  private apiKey: string;
  private verifyTLS: boolean;
  private timeoutMs: number;
  private cache: Map<string, { expires: number; value: any }>; // simple in-memory cache
  private cacheTtlMs: number;

  constructor() {
    this.baseUrl = (process.env.MISP_URL || '').replace(/\/$/, '');
    this.apiKey = process.env.MISP_API_KEY || '';
    this.verifyTLS = String(process.env.MISP_VERIFY_TLS || 'true').toLowerCase() !== 'false';
    this.timeoutMs = Number(process.env.MISP_TIMEOUT_MS || 10000);
    this.cache = new Map();
    this.cacheTtlMs = 60_000; // 60s default cache for IOC lookups
  }

  private async request(method: 'GET'|'POST', path: string, body?: any): Promise<any> {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('MISP not configured');
    }
    const url = new URL(this.baseUrl + path);
    const payload = body ? JSON.stringify(body) : undefined;
    const options: https.RequestOptions = {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.apiKey,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload).toString() } : {})
      },
      rejectUnauthorized: this.verifyTLS,
      timeout: this.timeoutMs
    } as any;

    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = data ? JSON.parse(data) : {};
            resolve(json);
          } catch (e) {
            // Some MISP endpoints might return plain text on certain errors
            resolve({ raw: data });
          }
        });
      });
      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        try { req.destroy(); } catch {}
        reject(new Error('MISP request timed out'));
      });
      if (payload) req.write(payload);
      req.end();
    });
  }

  public async ping(): Promise<{ ok: boolean; version?: string; error?: string }> {
    try {
      const res = await this.request('GET', '/servers/getVersion');
      if (res && (res.version || res.Version || res.Raw)) {
        return { ok: true, version: res.version || res.Version || res.Raw };
      }
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) };
    }
  }

  private cacheGet(key: string): any | undefined {
    const hit = this.cache.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.expires) {
      this.cache.delete(key);
      return undefined;
    }
    return hit.value;
  }

  private cacheSet(key: string, value: any) {
    this.cache.set(key, { value, expires: Date.now() + this.cacheTtlMs });
  }

  public async searchAttributes(value: string, type?: string): Promise<MispSearchResult> {
    try {
      const key = `attr:${value}:${type || ''}`;
      const cached = this.cacheGet(key);
      if (cached) return cached;

      const body: any = {
        returnFormat: 'json',
        value,
        // If type not provided, MISP will match by value; otherwise restrict
        ...(type ? { type } : {})
      };
      const res = await this.request('POST', '/attributes/restSearch', body);
      // MISP returns { response: { Attribute: [], Event: [] } } or variations
      const attributes = res?.response?.Attribute || res?.Attribute || [];
      const events = res?.response?.Event || res?.Event || [];
      const result: MispSearchResult = { success: true, attributes, events };
      this.cacheSet(key, result);
      return result;
    } catch (e: any) {
      return { success: false, error: e?.message || String(e) };
    }
  }
}

const mispService = new MispService();
export default mispService;


