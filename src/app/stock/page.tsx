'use client';

import {useEffect, useRef, useState, memo} from "react";
import {useRecoilState} from "recoil";
import {selectedStockState} from "@/app/recoil/stock";
import Chart from "@/app/stock/components/Chart";

const CoinTab = memo(function coinTab({code, price: price2}: any) {
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
		<div className="flex space-x-2">
			<div className="w-[94px]">
				<span className="text-xs text-gray-500">
					{code}
				</span>
				<span>
				</span>
			</div>
			<div className="w-[98px]">
				<span
					className={`text-right transition-colors duration-500 ${priceChange === 'up' ? 'bg-green-500 text-white' : ''} ${priceChange === 'down' ? 'bg-red-500 text-white' : ''}`}>

				{price}
				</span>
			</div>
			<div className="w-[58px]"></div>
		</div>
	);
});

export default function Page() {
	const [titleNames, setTitleNames] = useState<TCoinTitle[]>();
	const [coins, setCoins] = useState<TCoins>();

	const [selectedStock, setSelectedStock] = useRecoilState(selectedStockState);

	const socket = useRef<WebSocket | null>(null);

	useEffect(() => {
		const getAll = async () => {
			await fetch("/api/stock", {
					method: 'GET',
				}
			).then((response) => response.json())
				.then((data: TCoinTitle[]) => {
					const resolveData = data.filter((item) => item.market.includes("KRW"));
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
				});
			};
			socket.current.onclose = () => console.log("closed!");
		})();
	}, [titleNames]);


	const onClickTitle = async (item: TCoinTitle) => {

		console.log(item);
	};

	return (
		<main className="flex">
			<div>
				<h1>Stock</h1>
				<table className="w-[400px] flex flex-col">
					{Object.values(coins || {}).map((coin) => (
						<th onClick={() => setSelectedStock(coin)}>
							<CoinTab code={coin.code} price={coin.trade_price}></CoinTab>
						</th>
					))}
				</table>
			</div>
			<div className="flex-1">
				<CoinDetailTab/>
			</div>
		</main>
	);
}


const CoinDetailTab = memo(function coinDetailTab() {
	const [selectedStock, setSelectedStock] = useRecoilState(selectedStockState);


	if (!selectedStock) return;

	return (
		<div>
			{selectedStock && selectedStock.code}
			<div className="flex space-x-4">
				<Chart/>

			</div>
		</div>
	);

});
