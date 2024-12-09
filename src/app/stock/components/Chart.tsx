'use client';

import {memo, useRef, useState} from "react";
import {useRecoilValue} from "recoil";
import {selectedStockState} from "@/recoil/stock";
import ChartDataDisplay from "@/app/stock/components/ChartDataDisplay";
import TradeForm from "@/app/stock/components/TradeForm";

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

const Chart = () => {

	const selectedStock = useRecoilValue(selectedStockState);
	const [chartData, setChartData] = useState([]);
	const [ordersData, setOrdersData] = useState();
	const [orderTableData, setOrderTableData] = useState<any>([]);


	// useEffect(() => {
	// 	if (selectedStock && !socket.current) {
	// 		(async () => {
	// 			const options = {method: 'GET', headers: {accept: 'application/json'}};
	// 			fetch(`https://api.upbit.com/v1/candles/minutes/1?market=${selectedStock?.code}&count=200`, options)
	// 				.then(response => response.json())
	// 				.then(response => setChartData(response))
	// 				.catch(err => console.error(err));
	// 		})();
	// 		socket.current = new WebSocket("wss://api.upbit.com/websocket/v1");
	// 		socket.current.onopen = () => {
	// 			socket.current?.send(JSON.stringify([
	// 				{ticket: "test"},
	// 				{
	// 					type: "orderbook",
	// 					codes: [selectedStock.code],
	// 					// level: 10000,
	// 					isOnlyRealtime: true,
	// 				},
	// 				{
	// 					type: "trade",
	// 					codes: [selectedStock.code],
	// 				}
	// 			]));
	// 		};
	// 		socket.current.onmessage = (data) => {
	// 			data.data.arrayBuffer().then((buffer: any) => {
	// 				const decoder = new TextDecoder();
	// 				const message = JSON.parse(decoder.decode(buffer));
	// 				if (message.type === 'trade') {
	// 					const candleInterval = 60 * 1000; // 1분을 밀리초로 환산
	//
	// 					// 거래 타임스탬프를 기준으로 캔들 시간 계산
	// 					const tradeTimestamp = message.trade_timestamp; // 밀리초 단위 타임스탬프
	// 					const candleTimestamp = tradeTimestamp - (tradeTimestamp % candleInterval);
	//
	// 					// candles 배열의 마지막 캔들 가져오기
	// 					let lastCandle = chartRef.current?.getDataList()[chartRef.current?.getDataList().length - 1];
	//
	// 					// 현재 캔들의 타임스탬프와 일치하는지 확인
	// 					if (lastCandle && lastCandle.timestamp === candleTimestamp) {
	// 						// 기존 캔들 업데이트
	// 						lastCandle.high = Math.max(lastCandle.high, message.trade_price);
	// 						lastCandle.low = Math.min(lastCandle.low, message.trade_price);
	// 						lastCandle.close = message.trade_price;
	// 						lastCandle.volume += message.trade_volume;
	// 						// 차트의 마지막 캔들을 업데이트
	// 						chartRef.current?.updateData(lastCandle);
	// 					} else {
	// 						const newCandle = {
	// 							timestamp: candleTimestamp,
	// 							open: message.trade_price,
	// 							high: message.trade_price,
	// 							low: message.trade_price,
	// 							close: message.trade_price,
	// 							volume: message.trade_volume,
	// 						};
	// 						chartRef.current.updateData(newCandle);
	// 					}
	// 				} else if (message.type === 'orderbook') {
	// 					setOrdersData(message);
	// 					setOrderTableData(processData(message.orderbook_units));
	// 				}
	// 			});
	// 		};
	// 	}
	//
	// 	return () => {
	// 		socket.current?.close();
	// 		socket.current = null;
	// 	};
	//
	// }, [selectedStock]);


	if (!selectedStock) return;

	return (
		<div>
			<div className="flex space-x-4">
				<div>
					{selectedStock?.code}
					<ChartDataDisplay/>
				</div>
				<div>
					<TradeForm/>
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
};

export default memo(Chart);
