import { IServerEntry } from '../interfaces/IDnsResult';
import patchMasterSource from '../interfaces/PatchMasterSource';
import resolveDns from './funcs/resolveDns';

/** Time when this script started, for delta time calculations */
const startTime = Date.now();
let lastUpdate = 0;

/** List of servers, sorted by reliability */
let servers: IServerEntry[] = [];
//the master source is included by default
servers.push({ ip: patchMasterSource, type: 'master', lastSeen: Infinity, weight: Infinity });

/** Updates the list of servers based on current DNS data */
async function heartbeatDns(domain: string) {
  //Get list of current patch servers
  const dnsResults = await resolveDns(domain);

  //Remember time when response came in
  const now = Date.now() - startTime;

  //Schedule next check based on time-to-live, but never longer than 1 minute
  const ttl = Math.min(60, ...(dnsResults.map((obj) => obj.ttl))) + 1;
  setTimeout(heartbeatDns.bind(null, domain), ttl * 1000);

  //Update array with new information
  dnsResults.forEach(
    function({ address, type }, index) {
      //Calculate weight:
      //on cdn-patch.swtor.com: 3 if first, 2 if second, otherwise 1
      let weight = (index < 2) ? (3 - index) : 1;
      //on Level3 US: 1.2 is first, 1 if second
      if (domain !== 'cdn-patch.swtor.com') {
        weight = (index === 0) ? 1.2 : 1;
      }

      //if ip is already contained
      for (let i = 0, il = servers.length; i < il; i += 1) {
        const server = servers[i];
        if (server.ip === address) {
          server.lastSeen = now;
          server.weight += weight;
          if (server.type !== type) { server.type = type; }
          return;
        }
      }

      //if not yet contained, add to array
      servers.push({
        ip: address,
        lastSeen: now,
        type,
        weight: weight + 1, //give a boost to new values compared to existing values
      });
    },
  );

  //Remove old entries - old = not seen for one hour
  servers = servers.filter((server) => (now - server.lastSeen) < 3600000);

  //Decay weights - reduce them based on update frequency (-50% if full minute, but less if TTL was shorter than a minute)
  const decayFactor = 0.5 ** ((now - lastUpdate) / 60000);
  lastUpdate = now;
  servers.forEach(function(server) { server.weight *= decayFactor; });

  //Sort the array by weight
  servers.sort((a, b) => b.weight - a.weight);

  //Output current list
  let output = '';
  servers.forEach(function(server) {
    //set colors based on server type, see https://en.wikipedia.org/wiki/ANSI_escape_code#Colors
    //bright color if seen within last 5 minutes
    if (now - server.lastSeen < 300000) { output += '\x1b[1m'; } else { output += '\x1b[0m'; }
    switch (server.type) {
      case 'master': output += '\x1b[37m'; break; //white
      case 'akamai': output += '\x1b[35m'; break; //magenta
      case 'level3-us': output += '\x1b[32m'; break; //green
      case 'level3-eu': output += '\x1b[36m'; break; //cyan
      case 'unknown': default: output += '\x1b[31m'; //red
    }
    output += server.ip;
    output += '\t';
  });
  //Reset color to default
  output += '\x1b[0m';
  console.log(output);
}

//start loading additional addresses, both from CDN, and specifically from Level3/North_America so we have more than just European servers
heartbeatDns('cdn-patch.swtor.com');
heartbeatDns('na.lvlt.cdn.ea.com.c.footprint.net');
