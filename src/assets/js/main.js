'use strict';

//
// Declare module
var _tc = angular.module('tickercoin', ['btford.modal']);

//
// Dev API host.
// _tc.constant('API_HOST', 'http://localhost:3000');

//
// Prod API host.
_tc.constant('API_HOST', 'http://169.60.157.140:3001');

//
// Technical indicators.
_tc.value('techIndicators', [

    {value: 'candlestick', label: 'Candle Stick', args: []},
    {value: 'sma', label: 'SMA', args: [{label: 'Period', value: '20'}]},
    {value: 'ama', label: 'Adaptive Moving Average', args: [{label: 'Period', value: '20'}]},
    {value: 'momentum', label: 'Momentum', args: [{label: 'Period', value: '20'}]},
    {value: 'mma', label: 'Modified Moving Average', args: [{label: 'Period', value: '20'}]},
    {value: 'roc', label: 'Rate of change', args: [{label: 'Period', value: '20'}]},
    {value: 'dmi', label: 'Directional Movement Index', args: [{label: 'Period', value: '20'}]},
    {value: 'rsi', label: 'Relative Strength Index (RSI)', args: [{label: 'Period', value: '20'}]},
    {value: 'ema', label: 'Exponential Moving Average (EMA)', args: [{label: 'Period', value: '20'}]},
    {value: 'bbands', label: 'Bollinger Bands', args: [{label: 'Period', value: '20'}]},
    {value: 'adl', label: 'Accumulation Distribution Line (ADL)', args: [{label: 'Period', value: '20'}]},
    {value: 'aroon', label: 'Aroon', args: [{label: 'Period', value: '20'}]},
    {value: 'atr', label: 'Average True Range', args: [{label: 'Period', value: '20'}]},
    {value: 'bbandsB', label: 'Bollinger Bands %B', args: [{label: 'Period', value: '20'}]},
    {value: 'bbandsWidth', label: 'Bollinger Bands Width', args: [{label: 'Period', value: '20'}]},
    {value: 'cmf', label: 'Chaikin Money Flow (CMF)', args: [{label: 'Period', value: '20'}]},
    {value: 'cho', label: 'Chaikin Oscillator (CHO)', args: [{label: 'Period', value: '20'}]},
    {value: 'cci', label: 'Commodity Channel Index (CCI)', args: [{label: 'Period', value: '20'}]},
    {value: 'kdj', label: 'KDJ', args: [{label: 'Period', value: '20'}]},
    {value: 'mfi', label: 'Money Flow Index (MFI)', args: [{label: 'Period', value: '20'}]},
    {value: 'macd', label: 'Moving Average Convergence/Divergence', args: [{label: 'Period', value: '20'}]},
    {value: 'psar', label: 'Parabolic SAR (PSAR)', args: [{label: 'Period', value: '20'}]},
    {value: 'stochastic', label: 'Stochastic', args: [{label: 'Period', value: '20'}]},
]);

_tc.run([

            '$rootScope','tcStorage',
    function($rootScope , tcStorage){

        var savedConfig = tcStorage.getChartConfig();

        if(savedConfig)
            $rootScope.chartConfig = savedConfig;
        else{
            $rootScope.chartConfig = {

                height: 600,
                plots: [{

                    height: null,
                    series: [

                        {
                            label: 'Candle Stick',
                            value: 'candlestick',
                            args: []
                        }
                    ]
                }]
            };
        }
    }
]);

_tc.controller('ChartOptionsModalCtrl', [

            '$scope','techIndicators','chartOptionsModal','$rootScope','tcStorage',
    function($scope , techIndicators , chartOptionsModal , $rootScope , tcStorage){

        $scope.indicators = techIndicators;
        var vm = this;

        $scope.chartConfig = angular.copy($scope.chartConfig);

        vm.closeModal = function(){

            chartOptionsModal.deactivate();
        };

        vm.addSeries = function(series, plot){

            if(!series || !plot) return;
            plot.series.push(angular.copy(series));
        };

        vm.removeSeries = function(series, plot){

            if(!series || !plot) return;
            var index = plot.series.indexOf(series);

            if(index>-1)
                plot.series.splice(index, 1);
        };

        vm.addPlot = function(){

            $scope.chartConfig.plots.push({

                height: 30,
                series: []
            });
        };

        vm.removePlot = function(plot){

            var index = $scope.chartConfig.plots.indexOf(plot);

            if(index>-1)
                $scope.chartConfig.plots.splice(index, 1);
        };

        vm.applyConfig = function(){

            $rootScope.$broadcast('tc.apply-charts-config', $scope.chartConfig);
            $rootScope.chartConfig = $scope.chartConfig;
            vm.closeModal();
        };

        vm.saveConfig = function(){

            tcStorage.saveChartConfig($scope.chartConfig);
        };
    }
]);

_tc.factory('chartOptionsModal', [

            'btfModal',
    function(btfModal){

        return btfModal({

            controller: 'ChartOptionsModalCtrl',
            controllerAs: 'modalCtrl',
            templateUrl: 'chart-options-modal.html'
        });
    }
]);

_tc.factory('tcStorage', [

            '$window',
    function($window){

        var storage = $window.localStorage;
        
        function _saveChartConfig(config){

            var configString = angular.toJson(config);
            storage.setItem('tc_chart_config', configString);
        }

        function _getChartConfig(){

            var configString = storage.getItem('tc_chart_config');
            var config = angular.fromJson(configString);

            return config;
        }

        return {

            saveChartConfig: _saveChartConfig,
            getChartConfig: _getChartConfig
        };
    }
]);


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
                '   <div ng-class="{\'tc-loader\': !chart.mapping}" ng-repeat="chart in charts | orderBy:\'-volume\'">' +
                '       <h4></h4>' +
                '       <div>' +
                '           <div style="float:right;">Volume: <b>{{chart.volume || \'--\'}}</b></div>' +
                '       </div>' +
                '       <div id="{{chart.id}}" ng-style="{height: chart.config.height+\'px\'}" style="width: 100%;"></div>' +
                '   </div>' +
                '</div>'
            ,
            scope: {

                ccxtOptions: '=',
                pair: '=tcAnyChart'
            },
            link: function(scope, iEle, iAttrs){

                var pair = scope.pair;

                function _drawChart(chart){

                    chart.chart.dispose();
                    chart.chart = anychart.stock();

                    for(var i=0; i<chart.config.plots.length; i++){

                        var plotSett = chart.config.plots[i];

                        if(plotSett.height)
                            chart.chart.plot(i).height(plotSett.height+'%');
                            
                        //chart.chart.plot(i).removeAllSeries();

                        angular.forEach(plotSett.series, function(seriesObj){

                            chart.chart.plot(i)[seriesObj.value](chart.mapping, seriesObj.args[0]?seriesObj.args[0].value:undefined, seriesObj.args[1]?seriesObj.args[1].value:undefined);
                        });
                    }

                    chart.chart.title(chart.exchange);
                    chart.chart.container(chart.id);
                    chart.chart.draw();
                }

                scope.$on('tc.apply-charts-config', function(e, config){

                    angular.forEach(scope.charts, function(chart){

                        chart.config = angular.copy(config);
                        _drawChart(chart);
                    });
                });
                
                scope.charts = [];
                angular.forEach(pair.presence, function(exchange){

                    scope.charts.push({

                        market: pair.symbol,
                        exchange: exchange,
                        id: pair.symbol + '-' + exchange + '-' + Date.now(),
                        chart: anychart.stock(),
                        mapping: null,
                        volume: 0,
                        config: angular.copy($rootScope.chartConfig)
                    });
                });
                
                var OHLCVOptions = angular.copy(scope.ccxtOptions);
                OHLCVOptions.since = OHLCVOptions.since.getTime();
                OHLCVOptions.timeframe = (Math.abs(Math.round(OHLCVOptions.timeframe.amount))||0) + (OHLCVOptions.timeframe.unit||'m');
                
                angular.forEach(scope.charts, function(chart){

                    tickerCoinSrvc.fetchOHLCVData(chart.exchange, chart.market, OHLCVOptions)
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

                            chart.mapping = mapping;
                            chart.volume = _getSummedUpVolume(OHLCVData);

                            _drawChart(chart);
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

            'tickerCoinSrvc','$rootScope','chartOptionsModal',
    function(tickerCoinSrvc , $rootScope , chartOptionsModal){

        var vm = this;

        vm.exchanges = [];
        vm.selectedExchanges = [];
        vm.arbitragePairs = [];
        vm.selectedPairs = [];
        vm.pairsToPlot = [];

        vm.openChartConfigDialog = function(){

            chartOptionsModal.activate({'chartConfig': $rootScope.chartConfig});
        };

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

        vm.clearSelection = function(){

            vm.pairsToPlot = [];
            vm.selectedPairs = [];
            vm.selectedExchanges = [];
        };
    }
]);