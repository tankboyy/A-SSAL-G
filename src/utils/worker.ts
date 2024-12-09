import {WebSocket} from "ws";

let socket: WebSocket;

self.onmessage = function (e) {
	if (e.data === "start") {
		socket = new WebSocket("wss://api.upbit.com/websocket/v1");
		socket.onopen = () => {
			socket.send(JSON.stringify([
				{ticket: "test"},
				{
					type: "trade",
					codes: ["KRW-BTC"],
				},
			]));
		};
		socket.onerror = console.error;
		socket.onmessage = (data) => {
			data.data.arrayBuffer().then((buffer: any) => {
				const decoder = new TextDecoder();
				const message = JSON.parse(decoder.decode(buffer));
				postMessage(message);
			});
		};
		socket.onclose = () => console.log("closed!");
	}
};
