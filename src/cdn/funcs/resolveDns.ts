/* --- DNS resolver for the CDN storing SWTOR’s patch files ---
|
| The SWTOR launcher first connects to cdn-patch.swtor.com,
| there the traffic is split onto Akamai and Level3, and
| distributed to local points of presence.
| The master files appear to be stored on 159.153.92.51, and
| all CDNs are synchronized with that source.
|
| > cdn-patch.swtor.com
|    -> gslb-patch.swtor.biowareonline.net
|        -> cdn-patch.swtor.com.edgesuite.net (Akamai)
|        |   -> a56.d.akamai.net
|        |       -> 2.21.74.90
|        |       -> 2.21.74.98
|        -> cdn-patch.swtor.com.c.footprint.net (Level3)
|            -> eu.lvlt.cdn.ea.com.c.footprint.net (Europe)
|            |   -> 8.12.207.125
|            |   -> 8.253.37.126
|            -> na.lvlt.cdn.ea.com.c.footprint.net (US)
|                -> 205.128.74.252
|                -> 4.23.36.253
|                -> 192.221.105.254
|
| Examples:
|  - http://cdn-patch.swtor.com/patch/assets_swtor_main/assets_swtor_main_-1to0.solidpkg
|  - http://159.153.92.51/patch/assets_swtor_main/assets_swtor_main_-1to0.solidpkg
*/

import { exec} from 'child_process';
import * as dns from 'dns';
import { IDnsResult } from '../../interfaces/IDnsResult';

//TODO: send e-mail with the error
const assert = function(condition: boolean) { if (!condition) { console.warn('Assert failed'); } };

/** Looks up the given domain and returns a list of IP addresses, along with their time-to-live */
async function resolveDns(domain: string): Promise<IDnsResult[]> {
  return new Promise(function(resolve) {
    //check given string for correctness to prevent injection attacks
    if (domain.match(/^[a-z0-9]+(?:[-.]{1}[a-z0-9]+)*\.[a-z]{2,3}$/) === null) { return resolve([]); }

    //Check Level3/North_America separately
    if (domain !== 'cdn-patch.swtor.com') {
      dns.resolve4(domain, { ttl: true }, (err, result) => (
        resolve(result.map(({ address, ttl }) => ({ address, ttl, type: 'level3-us' as IDnsResult['type'] })))
      ));
    } else {
      //Use bash so we get more information.
      //Also do plenty of asserts to ensure that overall CDN structure has stayed unchanged, and TODO send e-mail if it's different (max. once per hour)
      exec('dig +noall +answer "cdn-patch.swtor.com"', { timeout: 10000 }, function(error, stdout) {
        //check for error
        assert(!error);
        if (error) {
          return resolve([]);
        }

        const data = stdout.trim().split('\n').map((line) => line.split(/\t| /));

        //Verify output
        assert(data.length > 3);
        data.forEach((dataLine) => assert(dataLine.length === 5));
        assert(data[0][0] === 'cdn-patch.swtor.com.');
        assert(data[0][1].match(/^[0-9]{1,3}$/) !== null); //at least up to 598
        assert(data[0][2] === 'IN');
        assert(data[0][3] === 'CNAME');
        assert(data[0][4] === 'gslb-patch.swtor.biowareonline.net.');

        assert(data[1][0] === 'gslb-patch.swtor.biowareonline.net.');
        assert(data[1][1].match(/^[0-9]{1,2}$/) !== null); //up to 60 seconds
        assert(data[1][2] === 'IN');
        assert(data[1][3] === 'CNAME');
        assert(data[1][4] === 'cdn-patch.swtor.com.edgesuite.net.' || data[1][4] === 'cdn-patch.swtor.com.c.footprint.net.');

        assert(data[2][0] === data[1][4]);
        assert(data[2][1].match(/^[0-9]{1,5}$/) !== null); //at least up to 15092 if Akamai, at least up to 627 if Level3
        assert(data[2][2] === 'IN');
        assert(data[2][3] === 'CNAME');
        assert(
          (data[2][4] === 'a56.d.akamai.net.' && data[1][4] === 'cdn-patch.swtor.com.edgesuite.net.') ||
          (data[2][4] === 'eu.lvlt.cdn.ea.com.c.footprint.net.' && data[1][4] === 'cdn-patch.swtor.com.c.footprint.net.'),
        );

        for (let i = 3, il = data.length; i < il; i += 1) {
          assert(data[i][0] === data[2][4]);
          assert(data[i][1].match(/^[0-9]{1,3}$/) !== null); //up to 60 seconds if Akamai, at least up to 218 if Level3
          assert(data[i][2] === 'IN');
          assert(data[i][3] === 'A');
          assert(data[i][4].match(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/) !== null);
        }

        //Prepare return values
        let type: IDnsResult['type'];
        switch (data[1][4]) {
          case 'cdn-patch.swtor.com.edgesuite.net.': type = 'akamai'; break;
          case 'cdn-patch.swtor.com.c.footprint.net.': type = 'level3-eu'; break;
          default: type = 'unknown';
        }

        resolve(data.filter((e, index) => index >= 3).map(([, ttl, , , address]) => ({ ttl: Math.min(Number(ttl), Number(data[0][1]), Number(data[1][1]), Number(data[2][1])), address, type })));
      });
    }
  }) as Promise<IDnsResult[]>;
}

export default resolveDns;
