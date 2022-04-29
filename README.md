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
## Supported ETH JSON-RPC APIs
|Name|Remark|
|:--|:--|
|`eth_estimateGas`|Args:<ul><li>`gasPrice` can be omitted</li></ul>|
|`eth_blockNumber`||
|`eth_getBalance`| Args:<ul><li>Default block parameter `pending` not supported |
|`eth_getBlockByNumber`<br>`eth_getBlockByHash`|Args:<ul><li>Default block parameter `pending` not supported</li></ul>Returned block object:<ul><li>`hash` [32 bytes] - Thor block ID</li><li>`transactions` [`Array<string>`] - always return transaction hashes</li><li>Unsupported fields: `difficulty`, `totalDifficulty`, `uncles`, `sha3Uncles`, `nonce`, `logsBloom`, `extraData`</li></ul>|
|`eth_chainId`||
|`eth_getCode`||
|`eth_getLogs`|Returned log object:<ul><li>Unsupported fields: `transactionIndex`, `logIndex`</li></ul>|
|`eth_getStorageAt`||
|`eth_getTransaction`|Returned transaction object:<ul><li>`hash` [32 bytes] - Thor transaction ID</li><li>Unsupported fields: `nonce`, `gasPrice`, `transactionIndex`, `maxPriorityFeePerGas`, `maxFeePerGas`</li></ul>|
|`eth_getTransactionReceipt`|Returned transaction receipt object:<ul><li> Unsupported fields: `transactionIndex`, `cumulativeGasUsed`, `from`, `to`, `logsBloom`</li></ul>|
|`eth_isSyncing`|If under syncing, returned object:<ul><li> `currentBlock` [`Number`]</li><li>`highestBlock` [`Number`]</li></ul>|
|`eth_sendTransaction`|Args:<ul><li>`txObj` includes fields: `from`, `to`, `value`, `data`, `gas`</li></ul>|
|`eth_call`|Args:<ul><li>`gasPrice` can be omitted</li></ul>|
|`eth_subscribe`<br>`eth_unsubscribe`|Args:<ul><li>Supported subscription type: `newHeads`, `logs`</li></ul>|
|`eth_gasPrice`|Return 0|
|`eth_getTransactionCount`| Return 0|
|`net_version`|Return 0|
## License
This software is licensed under the
[GNU Lesser General Public License v3.0](https://www.gnu.org/licenses/lgpl-3.0.html), also included
in *LICENSE* file in repository.