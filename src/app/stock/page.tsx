'use client';

import {useEffect, useRef, useState, memo} from "react";
import {v4} from "uuid";
import {SignJWT} from 'jose';
import {io} from "socket.io-client";

const CoinTab = memo(function coinTab({code, price: price2}: any) {
	console.log(`Rendering CoinItem: ${code}`);
	const [price, setPrice] = useState(price2);
	const [priceChange, setPriceChange] = useState<null | 'up' | 'down'>(null);
	useEffect(() => {
		if (price2 !== price) {
			if (price2 > price) {
				setPriceChange('up');
			} else {
				setPriceChange('down');
			}

			// 0.5초 후에 상태를 초기화
			setTimeout(() => {
				setPriceChange(null);
			}, 500);

			// 가격 업데이트
			setPrice(price2);
		}
	}, [price, price2]);
	return (
		<div>
			<div>
				{code}
			</div>
			<div
				className={`transition-colors duration-500 ${priceChange === 'up' ? 'bg-green-500 text-white' : ''} ${priceChange === 'down' ? 'bg-red-500 text-white' : ''}`}
			>
				{price}
			</div>
		</div>
	);
});

export default function Page() {
	const [titleNames, setTitleNames] = useState<TCoinTitle[]>();
	const [coins, setCoins] = useState<TCoins>();


	const socket = useRef<WebSocket | null>(null);

	useEffect(() => {
		const getAll = async () => {
			await fetch("/api/stock", {
					method: 'GET',
				}
			).then((response) => response.json())
				.then((data: TCoinTitle[]) => {
					const resolveData = data.filter((item) => item.market.includes("KRW"));
					console.log(resolveData);
					setTitleNames(resolveData);
				});
		};
		getAll();
		const socketDataEncoder = (socketData: any) => {
			const encoder = new TextDecoder('utf-8');
			const rawData = new Uint8Array(socketData);
			try {
				const data = JSON.parse(encoder.decode(rawData));
				return data;
			} catch (error) {
				console.error(error);
				return undefined;
			}
		};
	}, []);


	useEffect(() => {
		(async () => {


			socket.current = new WebSocket("wss://api.upbit.com/websocket/v1");
			// socket.current.binaryType = "arraybuffer";
			socket.current.onopen = () => {
				console.log("open");
				socket.current?.send(JSON.stringify([
					{ticket: "test"},
					{
						type: "trade",
						codes: titleNames?.map(code => code.market),
					},
				]));
			};
			socket.current.onerror = console.error;
			socket.current.onmessage = (data) => {
				// console.log(socketDataEncoder(data.data));
				data.data.arrayBuffer().then((buffer: any) => {
					const decoder = new TextDecoder();
					const message = JSON.parse(decoder.decode(buffer));
					setCoins((prevCoins) => ({
						...prevCoins,
						[message.code]: message // 코인 심볼을 키로 사용해 상태를 업데이트
					}));
					// console.log(message);
				});
			};
			socket.current.onclose = () => console.log("closed!");
			// const ws = new WebSocket("wss://api.upbit.com/websocket/v1", {
			// 	headers: {
			// 		Authorization: `Bearer ${jwtToken}`,
			// 	}
			// });
			// ws.on("open", () => {
			// 	console.log("open");
			// 	ws.send('[{"ticket":"test example"},{"type":"myTrade"}]');
			// 	// ws.send('[{"ticket":"UNIQUE_TICKET"},{"type":"trade","codes":["KRW-BTC"]}]');
			// });
			// ws.on("error", console.error);
			//
			// ws.on("message", (data) => console.log(data.toString()));
			//
			// ws.on("close", () => console.log("closed!"));
		})();
	}, [titleNames]);


	const onClickTitle = async (item: TCoinTitle) => {

		console.log(item);
	};

	return (
		<main className="flex">
			<div className="w-48">
				<h1>Stock</h1>
				{Object.values(coins || {}).map((coin) => (
					<CoinTab code={coin.code} price={coin.trade_price}></CoinTab>
				))}
				{/*{titleNames?.map((item, index) => (*/}
				{/*	<div key={index} onClick={() => onClickTitle(item)} className="cursor-pointer">*/}
				{/*		{item.korean_name}*/}
				{/*	</div>*/}
				{/*))}*/}
			</div>
			<div className="flex-1">
				hihi
			</div>
		</main>
	);
}
