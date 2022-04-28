'use strict';

import { Wallet, Net } from '@vechain/connex-driver';
import * as thor from 'web3-providers-connex';
import {
	JsonRpcRequest,
	JsonRpcResponse,
	parseReqData,
	parseErrFromProvider
} from './json-rpc';
import WebSocket from 'websocket';
import http from 'http';
import { parse as parseEthRawTx } from '@ethersproject/transactions';

import { now } from './utils';

export class ReqHandler {
	private readonly provider: thor.ConnexProvider;

	constructor(opt: {
		connex: Connex;
		net?: Net;
		wallet?: Wallet;
	}) {
		this.provider = new thor.ConnexProvider(opt);
	}

	handleWsReq = async (req: WebSocket.Message, conn: WebSocket.connection) => {
		const data = parseWsReq(req, conn);
		if (!data) { return; }

		const resultOrError = await this._request(data);

		sendWsResponse(conn, resultOrError);
	}

	handleHttpReq = async (req: http.IncomingMessage, resp: http.ServerResponse) => {
		const data = await parseHttpReq(req, resp);
		if (!data) { return; }

		const resultOrError = await this._request(data);

		sendHttpResponse(resp, resultOrError);
	}

	private _request = async (req: JsonRpcRequest): Promise<JsonRpcResponse> => {
		if (req.method === 'eth_sendRawTransaction') {
			try {
				const params = req.params || [];
				const ethTx = parseEthRawTx(params[0]);
				req.method = 'eth_sendTransaction';
				req.params = [{
					from: ethTx.from,
					to: ethTx.to || null,
					gas: ethTx.gasLimit.toNumber(),
					value: ethTx.value.toHexString(),
					data: ethTx.data,
				}];
			} catch { }
		}

		try {
			const result = await this.provider.request({
				method: req.method,
				params: req.params || []
			});
			return {
				id: req.id,
				jsonrpc: '2.0',
				result: result,
			};
		} catch (err: any) {
			const error = parseErrFromProvider(err);

			return {
				id: req.id,
				jsonrpc: '2.0',
				error: error,
			};
		}
	}
}



function sendWsResponse(conn: WebSocket.connection, resultOrError: JsonRpcResponse) {
	console.log(`${now()} Sending ws response ${JSON.stringify(resultOrError)}`);

	conn.sendUTF(JSON.stringify(resultOrError));
}

function sendHttpResponse(resp: http.ServerResponse, resultOrError: JsonRpcResponse) {
	console.log(`${now()} Sending http response ${JSON.stringify(resultOrError)}`);

	if (resultOrError) {
		const responseStr = JSON.stringify(resultOrError);
		resp.setHeader('Content-Type', 'application/json');
		resp.setHeader('Content-Length', Buffer.byteLength(responseStr));
		resp.write(responseStr);
	} else {
		// Respond 204 for notifications with no response
		resp.setHeader('Content-Length', 0);
		resp.statusCode = 204;
	}
	resp.end();
}

async function parseHttpReq(
	req: http.IncomingMessage,
	resp: http.ServerResponse
): Promise<JsonRpcRequest | null> {
	const err = checkHttpReq(req, '/');
	if (err) {
		sendHttpError(resp, err.statusCode, err.message);
		return null;
	}

	const buffers = [];
	for await (const chunk of req) {
		buffers.push(chunk);
	}

	const data = Buffer.concat(buffers).toString();

	// const method = <string>(JSON.parse(data)).method;
	// if (
	// 	method !== 'eth_getBalance' &&
	// 	method !== 'eth_blockNumber' &&
	// 	method !== 'eth_getBlockByNumber'
	// ) {
	console.log(`${now()} Processing http request ${JSON.stringify(JSON.parse(data))}`);
	// }

	try {
		return parseReqData(data);
	} catch (err: any) {
		sendHttpResponse(resp, <JsonRpcResponse>err);
		return null;
	}
}

function checkHttpReq(req: http.IncomingMessage, path: string) {
	let err;
	if (req.url !== path) {
		err = { statusCode: 404 };
	} else if (req.method !== 'POST') {
		err = { statusCode: 405 };
	} else if (!req.headers['content-type'] || (req.headers['content-type'] !== 'application/json'
		&& !req.headers['content-type'].startsWith('application/json;'))) {
		err = { statusCode: 415 };
		// } else if (!req.headers.accept || (req.headers.accept !== 'application/json'
		// 	&& !req.headers.accept.split(',').some((value) => {
		// 		const trimmedValue = value.trim();
		// 		return trimmedValue === 'application/json' || trimmedValue.startsWith('application/json;');
		// 	}))) {
		// 	err = { statusCode: 400, message: consts.INVALID_ACCEPT_HEADER_MSG };
	} else {
		if (req.headers['content-length']) {
			const reqContentLength = parseInt(req.headers['content-length'], 10);
			if (Number.isNaN(reqContentLength) || reqContentLength < 0) {
				err = { statusCode: 400, message: 'Invalid content-length header' };
			}
		}
	}
	return err;
}

function sendHttpError(resp: http.ServerResponse, statusCode: number, message?: string) {
	resp.statusCode = statusCode;
	if (message) {
		const formattedMessage = `{"error":"${message}"}`;
		resp.setHeader('Content-Type', 'application/json');
		resp.setHeader('Content-Length', Buffer.byteLength(formattedMessage));
		resp.write(formattedMessage);
	}
	resp.end();
}

function parseWsReq(
	msg: WebSocket.Message,
	conn: WebSocket.connection
): JsonRpcRequest | null {
	let data: string;
	if (msg.type === 'utf8') {
		data = msg.utf8Data;
	} else {
		data = msg.binaryData.toString();
	}

	console.log(`${now()} Processing ws request ${JSON.stringify(JSON.parse(data))}`);

	try {
		return parseReqData(data);
	} catch (err) {
		conn.sendUTF(JSON.stringify(err));
		return null;
	}
}