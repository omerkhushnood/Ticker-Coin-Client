'use strict';

//
// Declare module
var _tc = angular.module('tickercoin', []);

//
// Dev API host.
// _tc.constant('API_HOST', 'http://localhost:3000');

//
// Prod API host.
_tc.constant('API_HOST', 'http://169.60.157.140:3001');

_tc.run([

            '$rootScope',
    function($rootScope){

        $rootScope.globalChartSettings = {

            indicator: {

                applyToAll: true
            }
        };
    }
]);

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

            'tickerCoinSrvc','$rootScope',
    function(tickerCoinSrvc , $rootScope){

        var _DEFAULT_SINCE_DATE = new Date();
        _DEFAULT_SINCE_DATE.setDate(_DEFAULT_SINCE_DATE.getDate()-1);

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

        function _getSummedUpVolume(OHLCVData){

            var volume = 0;
            if(!angular.isArray(OHLCVData) || !OHLCVData.length)
                return 0;
            
            angular.forEach(OHLCVData, function(dataUnit){

                if(angular.isArray(dataUnit) && dataUnit.length >= 5)
                    volume += dataUnit[4] || 0;
            });

            return volume;
        }

        return {

            template: '' +
                '<div>' +
                '   <div ng-class="{\'tc-loader\': !plot.mapping}" ng-repeat="plot in plots | orderBy:\'-volume\'">' +
                '       <h4></h4>' +
                '       <div>' +
                '           <div style="float:right;">Volume: <b>{{plot.volume || \'--\'}}</b></div>' +
                '           <span ng-show="$index==0">Apply indicator to all: </span>' +
                '           <input ng-show="$index==0" type="checkbox" ng-model="globalChartSettings.indicator.applyToAll">' +
                '           <br>' +
                '           <span ng-show="$index==0 || !globalChartSettings.indicator.applyToAll">Indicator: </span>' +
                '           <select ng-show="$index==0 || !globalChartSettings.indicator.applyToAll" ng-model="plot.indicator" ng-change="applyIndicator(plot)">' +
                '               <option value="">-- Select --</option>' +
                '               <option value="{{ind.value}}" ng-repeat="ind in indicators">{{ind.label}}</option>' +
                '           </select>' +
                '       </div>' +
                '       <div id="{{plot.id}}" style="height: 450px;width: 100%;"></div>' +
                '   </div>' +
                '</div>'
            ,
            scope: {

                ccxtOptions: '=',
                pair: '=tcAnyChart'
            },
            link: function(scope, iEle, iAttrs){

                var pair = scope.pair;
                scope.indicators = techIndicators;
                scope.globalChartSettings = $rootScope.globalChartSettings;

                function _applyIndicator(plot, indicator){

                    plot.chart.plot(0)[indicator || plot.indicator](plot.mapping, undefined, 'line');
                    plot.indicator = indicator;
                }
                
                scope.applyIndicator = function(plot){

                    if(scope.globalChartSettings.indicator.applyToAll)
                        $rootScope.$broadcast('apply-indicator.tc', plot.indicator);
                    else
                        _applyIndicator(plot, plot.indicator);
                };

                // Apply indicator to all plots.
                scope.$on('apply-indicator.tc', function(e, indicator){

                    angular.forEach(scope.plots, function(plot){

                        _applyIndicator(plot, indicator);
                    });
                });
                
                scope.plots = [];
                angular.forEach(pair.presence, function(exchange){

                    scope.plots.push({

                        market: pair.symbol,
                        exchange: exchange,
                        id: pair.symbol + '-' + exchange + '-' + Date.now(),
                        chart: anychart.stock(),
                        mapping: null,
                        indicator: '',
                        volume: 0 
                    });
                });
                
                var OHLCVOptions = angular.copy(scope.ccxtOptions);
                OHLCVOptions.since = OHLCVOptions.since.getTime();
                OHLCVOptions.timeframe = (Math.abs(Math.round(OHLCVOptions.timeframe.amount))||0) + (OHLCVOptions.timeframe.unit||'m');
                
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
                            plot.volume = _getSummedUpVolume(OHLCVData);

                            plot.chart.plot(0).candlestick(mapping).name('ohlc');

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

        var _DEFAULT_SINCE_DATE = new Date();
        _DEFAULT_SINCE_DATE.setDate(_DEFAULT_SINCE_DATE.getDate()-1);

        vm.ccxtOptions = {

            limit: 0,
            timeframe: {

                amount: 15,
                unit: 'm'
            },
            since: _DEFAULT_SINCE_DATE
        };

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
            
            vm.pairsToPlot = [];
            vm.arbitragePairs = [];
            vm.selectedPairs = [];

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

        vm.plotData = function(){

            vm.pairsToPlot = angular.copy(vm.selectedPairs);
        };
    }
]);