'use strict';

import { Driver, Net, SimpleNet, Wallet } from '@vechain/connex-driver';
import { Framework } from '@vechain/connex-framework';
import WebSocket from 'websocket';
import http from 'http';
import { ReqHandler } from './req-handler';
import { now } from './utils';

export class ThorJsonRPCServer {
	private readonly net: Net;
	private readonly wallet: Wallet;
	private driver: Driver | null;
	private wsSrv: WebSocket.server | null;

	constructor(node: string, wallet: Wallet) {
		this.net = new SimpleNet(node);
		this.wallet = wallet;

		this.driver = null;
		this.wsSrv = null;
	}

	public async start(port: number) {
		try {
			this.driver = await Driver.connect(this.net, this.wallet);
			const connex = new Framework(this.driver);
			const reqHandler = new ReqHandler({
				connex: connex,
				net: this.net,
				wallet: this.wallet
			});

			const httpSrv = http.createServer(reqHandler.handleHttpReq);

			httpSrv.listen(port, function () {
				console.log(`${now()} Server is listening on port ${port}`);
			});

			this.wsSrv = new WebSocket.server({
				httpServer: httpSrv,
				autoAcceptConnections: false,
			});

			this.wsSrv.on('request', function (req) {
				const conn = req.accept(null, req.origin);

				console.log(`${now()} Connection accepted: ${req.origin}`);

				conn.on('message', function (req) {
					reqHandler.handleWsReq(req, conn);
				});

				conn.on('close', function () {
					console.log((new Date()).toTimeString() + ' Peer ' + conn.remoteAddress + ' disconnected.');
				});
			})

		} catch (err: any) {
			throw err;
		}
	}

	public close() {
		if (this.driver) {
			this.driver.close();
		}

		if (this.wsSrv) {
			this.wsSrv.closeAllConnections();
		}
	}
}