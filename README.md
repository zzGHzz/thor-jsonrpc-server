# thor-jsonrpc-server
A local server that implements ETH JSON-RPC APIs for interacting with the [VeChain Thor protocol](https://github.com/vechain/thor).

## Installation
```
npm i thor-jsonrpc-server
```

## Usage
```ts
import { ThorJsonRPCServer } from 'thor-jsonrpc-server';
import { SimpleWallet } from '@vechain/connex-driver';

const wallet = new SimpleWallet();
// Add private key
wallet.import(key);

const srv = new ThorJsonRPCServer(
  url, // Node url, e.g., 
       // Solo node: 	http://127.0.0.1:8669
       // Main net: 	https://sync-mainnet.veblocks.net/	
       // Test net: 	https://sync-testnet.veblocks.net/
  wallet
);

// start the server with a given port
srv.start(port);
```

## Example
- Request:
```json
{
  "id":1,
  "jsonrpc": "2.0",
  "method":"eth_blockNumber"
}
```
- Response
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": "0x23"
}
```
## License
This software is licensed under the
[GNU Lesser General Public License v3.0](https://www.gnu.org/licenses/lgpl-3.0.html), also included
in *LICENSE* file in repository.