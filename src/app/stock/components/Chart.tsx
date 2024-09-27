'use client';

import {init, dispose, Nullable, KLineData} from 'klinecharts';
import {useEffect, useRef, useState} from "react";
import {useRecoilValue} from "recoil";
import {selectedStockState} from "@/app/recoil/stock";


const processData = (data: any) => {
	const result = new Array(30);  // 총 30개의 탭 공간을 만들기 위해 배열 크기를 30으로 설정

	// ask 데이터를 16번째 탭부터 차례대로 쌓음
	data.forEach((item, index) => {

		result[14 - index] = {
			type: 'ask',
			price: item.ask_price,
			size: item.ask_size,
		};
	});

	// bid 데이터를 15번째 탭부터 역순으로 쌓음
	data.forEach((item, index) => {
		result[15 + index] = {
			type: 'bid',
			price: item.bid_price,
			size: item.bid_size,
		};
	});
	return result;
};

export default function Chart() {

	const selectedStock = useRecoilValue(selectedStockState);
	const [chartData, setChartData] = useState<TChartData[]>([]);
	const socket = useRef<WebSocket | null>(null);
	const [ordersData, setOrdersData] = useState<TStockOrder>();
	const [orderTableData, setOrderTableData] = useState<any>([]);


	useEffect(() => {
		(async () => {
			const options = {method: 'GET', headers: {accept: 'application/json'}};
			fetch(`https://api.upbit.com/v1/candles/minutes/1?market=${selectedStock?.code}&count=200`, options)
				.then(response => response.json())
				.then(response => setChartData(response))
				.catch(err => console.error(err));
		})();
	}, []);

	useEffect(() => {
		if (selectedStock && !socket.current) {
			socket.current = new WebSocket("wss://api.upbit.com/websocket/v1");
			socket.current.onopen = () => {
				socket.current?.send(JSON.stringify([
					{ticket: "test"},
					{
						type: "orderbook",
						codes: [selectedStock.code],
						// level: 10000,
						isOnlyRealtime: true,
					},
					{
						type: "trade",
						codes: [selectedStock.code],
					}
				]));
			};
			socket.current.onmessage = (data) => {
				// console.log(socketDataEncoder(data.data));
				data.data.arrayBuffer().then((buffer: any) => {
					const decoder = new TextDecoder();
					const message = JSON.parse(decoder.decode(buffer));
					if (message.type === 'trade') {
						const candleInterval = 60 * 1000; // 1분을 밀리초로 환산

						// 거래 타임스탬프를 기준으로 캔들 시간 계산
						const tradeTimestamp = message.trade_timestamp; // 밀리초 단위 타임스탬프
						const candleTimestamp = tradeTimestamp - (tradeTimestamp % candleInterval);

						// candles 배열의 마지막 캔들 가져오기
						let lastCandle = chartRef.current?.getDataList()[chartRef.current?.getDataList().length - 1];

						// 현재 캔들의 타임스탬프와 일치하는지 확인
						if (lastCandle && lastCandle.timestamp === candleTimestamp) {
							// 기존 캔들 업데이트
							lastCandle.high = Math.max(lastCandle.high, message.trade_price);
							lastCandle.low = Math.min(lastCandle.low, message.trade_price);
							lastCandle.close = message.trade_price;
							lastCandle.volume += message.trade_volume;
							console.log(lastCandle);
							// 차트의 마지막 캔들을 업데이트
							chartRef.current?.updateData(lastCandle);
						} else {
							const newCandle = {
								timestamp: candleTimestamp,
								open: message.trade_price,
								high: message.trade_price,
								low: message.trade_price,
								close: message.trade_price,
								volume: message.trade_volume,
							};

							console.log(newCandle);
							chartRef.current.updateData(newCandle);
						}
					} else if (message.type === 'orderbook') {
						setOrdersData(message);
						setOrderTableData(processData(message.orderbook_units));
					}
				});
			};
		}

		return () => {
			socket.current?.close();
			socket.current = null;
		};

	}, [selectedStock]);


	if (!selectedStock) return;

	const chartRef = useRef<Nullable<Chart>>(null);


	useEffect(() => {
		const chart = init('chart');
		const data = chartData.map(item => {
			console.log(item.timestamp / 1000);
			return {
				close: item.trade_price,
				high: item.high_price,
				low: item.low_price,
				open: item.opening_price,
				timestamp: item.timestamp / 1000,
				volume: item.candle_acc_trade_volume,
			};
		});
		console.log(chartData);
		// 배열을 거꾸로

		chart.applyNewData(data.reverse());
		chartRef.current = chart;
		return () => {
			dispose('chart');
		};
	}, [chartData]);

	return (
		<div>
			{selectedStock && selectedStock.code}
			<div className="flex space-x-4">
				<div>
					<button onClick={() => {
						console.log(chartRef.current?.getDataList());
					}}>
						dasd
					</button>
					{selectedStock?.code}
					<div id="chart" style={{width: 600, height: 600}}/>
				</div>
				<div>
					{ordersData && orderTableData.map((order, index) => (
						<div key={index} className="flex space-x-4">
							<div className="w-20">
								{index < 15 && order.size}

							</div>
							<div>
								{order.price}
							</div>
							<div className="w-20">
								{index > 14 && order.size}

							</div>
						</div>
					))}
				</div>
			</div>


		</div>
	);
}
