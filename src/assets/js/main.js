'use strict';

//
// Declare module
var _tc = angular.module('tickercoin', []);

//
// Dev API host.
_tc.constant('API_HOST', 'http://localhost:3000');

//
// Prod API host.
// _tc.constant('API_HOST', 'http://169.60.157.140:3001');

//
// Ticker coin api service.
_tc.factory('tickerCoinSrvc', [

            '$http','API_HOST',
    function($http , API_HOST){

        function _fetchExchanges(){

            var url = API_HOST + '/api/ccxt/exchanges';
            return $http.get(url)
                .then(function(res){

                    return res.data;
                })
            ;
        }

        function _fetchArbitragePairs(markets){

            var url = API_HOST + '/api/ccxt/arbitrage?exchanges=' + markets.join(',');
            return $http.get(url)
                .then(function(res){

                    return res.data
                })
            ;
        }

        function _fetchOHLCVData(exchange, market, options){

            var url = API_HOST + '/api/ccxt/exchanges/' + 
                encodeURIComponent(exchange) +
                '/markets/' + encodeURIComponent(market) +
                '/ohlcv?' +
                'limit=' + (options.limit||0) +
                '&since=' + (options.since||Date.now()) +
                '&timeframe=' + (options.timeframe||'15m')
            ;

            return $http.get(url)
                .then(function(res){

                    return res.data;
                })
            ;
        }

        return {

            fetchExchanges: _fetchExchanges,
            fetchArbitragePairs: _fetchArbitragePairs,
            fetchOHLCVData: _fetchOHLCVData
        };
    }
]);

//
// Any chart directive.
_tc.directive('tcAnyChart', [

            'tickerCoinSrvc',
    function(tickerCoinSrvc){

        var _DEFAULT_SINCE_DATE = new Date();
        _DEFAULT_SINCE_DATE.setDate(_DEFAULT_SINCE_DATE.getDate()-1);

        var OHLCVOptions = {

            timeframe: '15m',
            since: _DEFAULT_SINCE_DATE.getTime(),
            limit: 0
        };

        var techIndicators = [

            {value: 'sma', label: 'SMA'},
            {value: 'ama', label: 'Adaptive Moving Average'},
            {value: 'momentum', label: 'Momentum'},
            {value: 'mma', label: 'Modified Moving Average'},
            {value: 'roc', label: 'Rate of change'},
            {value: 'dmi', label: 'Directional Movement Index'},
            {value: 'rsi', label: 'Relative Strength Index (RSI)'},
            {value: 'ema', label: 'Exponential Moving Average (EMA)'},
            {value: 'bbands', label: 'Bollinger Bands'},
            {value: 'adl', label: 'Accumulation Distribution Line (ADL)'},
            {value: 'aroon', label: 'Aroon'},
            {value: 'atr', label: 'Average True Range'},
            {value: 'bbandsB', label: 'Bollinger Bands %B'},
            {value: 'bbandsWidth', label: 'Bollinger Bands Width'},
            {value: 'cmf', label: 'Chaikin Money Flow (CMF)'},
            {value: 'cho', label: 'Chaikin Oscillator (CHO)'},
            {value: 'cci', label: 'Commodity Channel Index (CCI)'},
            {value: 'kdj', label: 'KDJ'},
            {value: 'mfi', label: 'Money Flow Index (MFI)'},
            {value: 'macd', label: 'Moving Average Convergence/Divergence'},
            {value: 'psar', label: 'Parabolic SAR (PSAR)'},
            {value: 'stochastic', label: 'Stochastic'},
        ];

        return {

            template: '' +
                '<div>' +
                '   <div ng-class="{\'tc-loader\': !plot.mapping}" ng-repeat="plot in plots">' +
                '       <h4></h4>' +
                '       <span>Indicator: </span>' +
                '       <select ng-model="plot.indicator" ng-change="applyIndicator(plot)">' +
                '           <option value="{{ind.value}}" ng-repeat="ind in indicators">{{ind.label}}</option>' +
                '       </select>' +
                '       <div id="{{plot.id}}" style="height: 450px;width: 100%;"></div>' +
                '   </div>' +
                '</div>'
            ,
            link: function(scope, iEle, iAttrs){

                var pair = scope.$eval(iAttrs.tcAnyChart);
                scope.indicators = techIndicators;









                scope.applyIndicator = function(plot){

                    plot.chart.plot(0)[plot.indicator](plot.mapping, undefined, 'line');
                };










                scope.plots = [];
                angular.forEach(pair.presence, function(exchange){

                    scope.plots.push({

                        market: pair.symbol,
                        exchange: exchange,
                        id: pair.symbol + '-' + exchange + '-' + Date.now(),
                        chart: anychart.stock(),
                        mapping: null,
                        indicator: 'sma'
                    });
                });









                angular.forEach(scope.plots, function(plot){

                    tickerCoinSrvc.fetchOHLCVData(plot.exchange, plot.market, OHLCVOptions)
                        .then(function(OHLCVData){

                            var table = anychart.data.table();
                            table.addData(OHLCVData);

                            var mapping = table.mapAs();
                            mapping.addField('open', 1, 'first');
                            mapping.addField('high', 2, 'max');
                            mapping.addField('low', 3, 'min');
                            mapping.addField('close', 4, 'last');
                            mapping.addField('value', 4, 'last');
                            mapping.addField('volumn', 5, 'volume');

                            plot.mapping = mapping;

                            plot.chart.plot(0).candlestick(mapping).name('ohlc');

                            scope.applyIndicator(plot);

                            plot.chart.title(plot.exchange);

                            plot.chart.container(plot.id);
                            plot.chart.draw();
                        })
                    ;
                });
            }
        };
    }
]);

//
// Main controller
_tc.controller('TickerCoinCtrl', [

            'tickerCoinSrvc',
    function(tickerCoinSrvc){

        var vm = this;

        vm.exchanges = [];
        vm.selectedExchanges = [];
        vm.arbitragePairs = [];
        vm.selectedPairs = [];
        vm.pairsToPlot = [];

        // For loader
        vm.loadingPairs = 0;

        function _refreshMarkets(){

            if(vm.selectedExchanges.length<2)
                return;

            vm.loadingPairs++;
            tickerCoinSrvc.fetchArbitragePairs(vm.selectedExchanges)
                .then(function(pairs){

                    vm.arbitragePairs = pairs;
                })
                .finally(function(){

                    vm.loadingPairs--;
                })
            ;
        }

        vm.toggleExchangeSelection = function(exchange){

            var index = vm.selectedExchanges.indexOf(exchange);

            if(index>-1)
                vm.selectedExchanges.splice(index, 1);
            else
                vm.selectedExchanges.push(exchange);
            
            vm.pairsToPlot = vm.arbitragePairs = vm.selectedPairs = [];
            _refreshMarkets();
        };

        vm.togglePairSelection = function(pair){

            var index = vm.selectedPairs.indexOf(pair);

            if(index>-1)
                vm.selectedPairs.splice(index, 1);
            else
                vm.selectedPairs.push(pair);
        };

        tickerCoinSrvc.fetchExchanges()
            .then(function(exchanges){

                vm.exchanges = exchanges;
            })
        ;
    }
]);