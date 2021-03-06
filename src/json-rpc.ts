'use strict';

export enum ErrCode {
	// Standard
	PARSE_ERROR = -32700,
	INVALID_REQUEST = -32600,
	METHOD_NOT_FOUND = -32601,
	INVALID_PARAMS = -32602,
	INTERNAL_ERROR = -32603,

	// Non-standard https://docs.infura.io/infura/networks/ethereum/json-rpc-methods
	INVALID_INPUT = -32000,
	METHOD_NOT_SUPPORT = -32004,
}

// https://docs.infura.io/infura/networks/ethereum/json-rpc-methods
export const ethJsonRpcMethods = [
	'eth_accounts',
	'eth_blockNumber',
	'eth_call',
	'eth_chainId',
	'eth_coinbase',
	'eth_estimateGas',
	'eth_feeHistory',
	'eth_gasPrice',
	'eth_getBalance',
	'eth_getBlockByHash',
	'eth_getBlockByNumber',
	'eth_getBlockTransactionCountByHash',
	'eth_getBlockTransactionCountByNumber',
	'eth_getCode',
	'eth_getLogs',
	'eth_getStorageAt',
	'eth_getTransactionByBlockHashAndIndex',
	'eth_getTransactionByBlockNumberAndIndex',
	'eth_getTransactionByHash',
	'eth_getTransactionCount',
	'eth_getTransactionReceipt',
	'eth_getUncleByBlockHashAndIndex',
	'eth_getUncleByBlockNumberAndIndex',
	'eth_getUncleCountByBlockHash',
	'eth_getUncleCountByBlockNumber',
	'eth_getWork',
	'eth_mining',
	'eth_hashrate',
	'eth_protocolVersion',
	'eth_sendTransaction',
	'eth_sendRawTransaction',
	'eth_sign',
	'eth_submitWork',
	'eth_syncing',
	'net_listening',
	'net_peerCount',
	'net_version',
	'parity_nextNonce',
	'web3_clientVersion',
	'eth_newFilter',
	'eth_newBlockFilter',
	'eth_newPendingTransactionFilter',
	'eth_getFilterLogs',
	'eth_getFilterChanges',
	'eth_uninstallFilter',
	'eth_subscribe',
	'eth_unsubscribe',
]

export const ErrMsg: Record<number, string> = {};
ErrMsg[ErrCode.PARSE_ERROR] = 'Parse error';
ErrMsg[ErrCode.INVALID_REQUEST] = 'Invalid request';
ErrMsg[ErrCode.METHOD_NOT_FOUND] = 'Method not found';
ErrMsg[ErrCode.INVALID_PARAMS] = 'Invalid parameters';
ErrMsg[ErrCode.INTERNAL_ERROR] = 'Internal error';

const getPredefinedErr = (code: ErrCode, data?: any): JsonRpcError => {
	return {
		code: code,
		message: ErrMsg[code],
		data: data
	}
}

export type JsonRpcRequest = {
	id: number | string | null;
	jsonrpc: '2.0';
	method: string;
	params?: any[];
}

export type JsonRpcError = {
	code: number;
	message: string;
	data?: any;
}

export type JsonRpcResponse = {
	id: number | string | null;
	jsonrpc: '2.0';
	result?: any;
	error?: JsonRpcError;
}

export function parseReqData(data: string): JsonRpcRequest {
	let json: any;
	try {
		json = JSON.parse(data);
	} catch (err: any) {
		throw {
			id: null,
			jsonrpc: '2.0',
			error: getPredefinedErr(ErrCode.PARSE_ERROR)
		};
	}

	if (
		// id: required, number | string | null
		!json.id || (json.id !== null && typeof json.id !== 'number' && typeof json.id !== 'string')
		// method: required, string
		|| !json.method || typeof json.method !== 'string'
		// jsonrpc: required, '2.0'
		|| !json.jsonrpc || json.jsonrpc !== '2.0'
	) {
		throw {
			id: json.id || null,
			jsonrpc: '2.0',
			error: getPredefinedErr(ErrCode.INVALID_REQUEST)
		};
	}

	if (!ethJsonRpcMethods.find(method => method === json.method)) {
		throw {
			id: json.id || null,
			jsonrpc: '2.0',
			error: {
				code: ErrCode.METHOD_NOT_FOUND,
				message: `Method not found: method=${json.method}`
			}
		};
	}

	return {
		id: json.id,
		jsonrpc: json.jsonrpc,
		method: json.method,
		params: json.params || []
	}
}

export function parseErrFromProvider(err: any): JsonRpcError {
	let msg: string | undefined;
	if (err.message) { msg = err.message; }
	if (typeof err === 'string') { msg = err; }

	if (!msg) { 
		return {
			code: ErrCode.INTERNAL_ERROR,
			message: JSON.stringify(err),
		}
	}

	if (msg.startsWith('Method not supported:')) {
		return {
			code: ErrCode.METHOD_NOT_SUPPORT,
			message: msg
		}
	}

	if (msg.startsWith('Parameter not supported')) {
		return {
			code: ErrCode.INVALID_PARAMS,
			message: msg,
		}
	}

	if (msg.startsWith('Argument missing or invalid')) {
		return {
			code: ErrCode.INVALID_INPUT,
			message: msg,
		}
	}

	return {
		code: ErrCode.INTERNAL_ERROR,
		message: msg,
		data: err.data
	}
}