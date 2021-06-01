type NetworkType = 'master' | 'akamai' | 'level3-eu' | 'level3-us' | 'unknown';

/** One search result in a DNS query response */
interface IDnsResult {
  /** IP address to which cdn-patch.swtor.com resolves to. */
  address: string;
  /** Which network / cloud provider this IP address belongs to. */
  type: NetworkType;
  /** Time-to-live, given in seconds, of how long the results last, or when we need to update them. */
  ttl: number;
}

/** An IP address that was returned by resolved the CDN domain. */
interface IServerEntry {
  /** IP address to which cdn-patch.swtor.com resolves to. */
  ip: string;
  /** Which network / cloud provider this IP address belongs to. */
  type: NetworkType;
  /** When we were last able to resolve to this IP address, time given in milliseconds. */
  lastSeen: number;
  /** A measure of how reliable this IP address is, based on how often and how recently it was resolved. */
  weight: number;
}

export { IDnsResult, IServerEntry };
