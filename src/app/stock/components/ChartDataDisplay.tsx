'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActionType, Chart, dispose, init, Nullable} from 'klinecharts';
import {useChartInfinityQuery} from "@/hooks/query/useChartData";
import {debounce} from "lodash";
import {useRecoilValue} from "recoil";
import {selectedStockState} from "@/recoil/stock";
import {useQueryClient} from "@tanstack/react-query";

const ChartDataDisplay = () => {
	const chartRef = useRef<Nullable<Chart>>(null);
	const socket = useRef<Nullable<WebSocket>>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isReconnecting = useRef<boolean>(false);
	const selectedStock = useRecoilValue(selectedStockState);
	const socketIdRef = useRef<number>(0); // 소켓 ID를 추적하기 위한 Ref\

	const queryClient = useQueryClient();

	const connectWebSocket = () => {
		if (socket.current) {
			// 이미 소켓이 연결되어 있으면 아무 것도 하지 않음
			return;
		}

		const currentStock = selectedStock; // 현재의 selectedStock을 캡처
		const currentSocketId = ++socketIdRef.current; // 소켓 ID 증가

		socket.current = new WebSocket("wss://api.upbit.com/websocket/v1");

		socket.current.onopen = () => {
			isReconnecting.current = false; // 재연결 플래그 초기화
			socket.current?.send(JSON.stringify([
				{ticket: "test"},
				{
					type: "trade",
					codes: [currentStock.code],
				}
			]));
		};

		socket.current.onmessage = (data) => {
			// 현재 소켓이 아닌 경우 메시지 무시
			if (currentSocketId !== socketIdRef.current) {
				return;
			}
			data.data.arrayBuffer().then((buffer: any) => {
				const decoder = new TextDecoder();
				const message = JSON.parse(decoder.decode(buffer));
				if (message.type === 'trade') {
					console.log(message.code);
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
						chartRef.current?.updateData(newCandle);
					}
				}
			});
		};

		socket.current.onclose = () => {
			socket.current = null;
			if (!isReconnecting.current) {
				isReconnecting.current = true;
				attemptReconnect();
			}
		};

		socket.current.onerror = () => {
			socket.current?.close();
		};
	};

	const attemptReconnect = () => {
		if (reconnectTimeoutRef.current) return; // 이미 재연결 시도가 예약되어 있으면 무시
		reconnectTimeoutRef.current = setTimeout(() => {
			reconnectTimeoutRef.current = null;
			connectWebSocket();
		}, 5000); // 5초 후에 재연결 시도
	};

	useEffect(() => {
		if (selectedStock) {
			connectWebSocket();
		}

		return () => {
			if (socket.current) {
				socket.current.onmessage = null;
				socket.current.onerror = null;
				socket.current.onclose = null;
				socket.current.close();
				socket.current = null;
			}
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
				reconnectTimeoutRef.current = null;
			}
		};
	}, [selectedStock]);

	const {data, fetchNextPage, isFetching, isFetchingNextPage} = useChartInfinityQuery();

	const handleScroll = useCallback(debounce(async () => {
		const visibleRange = chartRef.current?.getVisibleRange();
		const fromPosition = visibleRange?.from || 0;
		if (fromPosition < 50 && !isFetchingNextPage) {
			await fetchNextPage();
		}
	}, 300), []);

	useEffect(() => {
		// 이전 차트 인스턴스가 있으면 제거
		if (chartRef.current) {
			dispose('chart');
			chartRef.current = null;
		}
		// 새로운 차트 인스턴스 생성
		chartRef.current = init('chart');
		chartRef.current?.subscribeAction('onScroll' as ActionType, handleScroll);
	}, [selectedStock]);

	useEffect(() => {
		const chartData = data?.pages;
		if (chartData?.length === 0) return;

		if (chartRef.current?.getDataList().length === 0 && chartData) {
			const mappingData = chartData?.reverse().flat().map((item: any) => {
				return {
					close: item.trade_price,
					high: item.high_price,
					low: item.low_price,
					open: item.opening_price,
					timestamp: item.timestamp,
					volume: item.candle_acc_trade_volume,
				};
			});
			chartRef.current?.applyNewData(mappingData);
		} else {
			if (chartData?.length! * 200 === chartRef.current?.getDataList().length) return;
			const flatData = data?.pages?.[data.pages.length - 1];

			const mappingData = flatData?.map((item: any) => {
				return {
					close: item.trade_price,
					high: item.high_price,
					low: item.low_price,
					open: item.opening_price,
					timestamp: item.timestamp,
					volume: item.candle_acc_trade_volume,
				};
			});

			if (!mappingData) return;
			// 차트에 데이터 적용
			if (data?.pages.length === 1) {
				chartRef.current?.applyNewData(mappingData);
			} else {
				chartRef.current?.applyMoreData(mappingData);
			}
		}
	}, [data]);

	return (
		<>
			<button onClick={() => {
				console.log(socketIdRef.current, socket.current);
			}}>asd
			</button>
			<div id="chart" style={{width: '600px', height: '600px'}}></div>
		</>
	);
};

export default React.memo(ChartDataDisplay);
