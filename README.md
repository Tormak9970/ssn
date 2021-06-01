# ssn

This library provides various methods for fetching releases from SWTOR’s patch server CDN and installing them. You can use it to write your own patch program. If you just want to install patches without having to do any programming, use the command line tools from the [ssn-tools](/swtor/ssn-tools) repository.

## Installation

For this library to work, the TypeScript compiler must be globally installed:

```bash
sudo npm install -g typescript
```

In the project where you want to use this library, add the following to your `package.json` file:

```json
{
  "dependencies": {
    "ssn": "git+https://git.jedipedia.net/swtor/ssn.git"
  }
}
```

Then run:

```bash
npm install
```

## Usage

To import the functions into your Node.js application:

```ts
import * as ssn from 'ssn';

(async function() {
  const manifestContents = await ssn.getManifest('assets_swtor_main');
  console.log(manifestContents);

  const solidpkgContents = await ssn.getSolidpkg('assets_swtor_main', 126, 127);
  console.log(solidpkgContents);
}())
```

## Development

To work with the repository locally:

```bash
sudo npm install -g typescript tslint
git clone https://git.jedipedia.net/swtor/ssn.git
cd ssn
npm install && npm start
```

## License

Copyright (C) 2018 Jedipedia.net

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
