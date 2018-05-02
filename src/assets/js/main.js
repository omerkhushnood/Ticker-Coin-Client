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
_tc.value('techIndicators', {

    'candlestick': {value: 'candlestick', label: 'Candle Stick', args: []},
    'sma': {value: 'sma', label: 'SMA', args: []},
    'ama': {value: 'ama', label: 'Adaptive Moving Average', args: []},
    'momentum': {value: 'momentum', label: 'Momentum', args: []},
    'mma': {value: 'mma', label: 'Modified Moving Average', args: []},
    'roc': {value: 'roc', label: 'Rate of change', args: [{label: 'Period', value: '20'}]},
    'rocroc': {value: 'rocroc', label: 'ROC(ROC)', custom: true, args: [{label: 'Period', value: '20'}]},
    'dmi': {value: 'dmi', label: 'Directional Movement Index', args: []},
    'rsi': {value: 'rsi', label: 'Relative Strength Index (RSI)', args: []},
    'ema': {value: 'ema', label: 'Exponential Moving Average (EMA)', args: []},
    'bbands': {value: 'bbands', label: 'Bollinger Bands', args: []},
    'adl': {value: 'adl', label: 'Accumulation Distribution Line (ADL)', args: []},
    'aroon': {value: 'aroon', label: 'Aroon', args: []},
    'atr': {value: 'atr', label: 'Average True Range', args: []},
    'bbandsB': {value: 'bbandsB', label: 'Bollinger Bands %B', args: []},
    'bbandsWidth': {value: 'bbandsWidth', label: 'Bollinger Bands Width', args: []},
    'cmf': {value: 'cmf', label: 'Chaikin Money Flow (CMF)', args: []},
    'cho': {value: 'cho', label: 'Chaikin Oscillator (CHO)', args: []},
    'cci': {value: 'cci', label: 'Commodity Channel Index (CCI)', args: []},
    'kdj': {value: 'kdj', label: 'KDJ', args: [{label: 'Period', value: '10'}]},
    'mfi': {value: 'mfi', label: 'Money Flow Index (MFI)', args: []},
    'macd': {value: 'macd', label: 'Moving Average Convergence/Divergence', args: []},
    'psar': {value: 'psar', label: 'Parabolic SAR (PSAR)', args: []},
    'stochastic': {value: 'stochastic', label: 'Stochastic', args: []},
});


_tc.value('customIndicators', {

    // Returns new mapping.
    'rocroc': function(dataTable, mapping, indicatorRef){

        // Start 1st Roc
        var computer1 = dataTable.createComputer(mapping);
        var context = anychart.math.roc.initContext(indicatorRef.args[0].value);
        computer1.setContext(context);
        computer1.setStartFunction(anychart.math.roc.startFunction);
        computer1.setCalculationFunction(anychart.math.roc.calculationFunction);

        var mapping1 = dataTable.mapAs({roc1Value: computer1.addOutputField("result")});
        // End 1st Roc

        // Start 2nd Roc
        var computer2 = dataTable.createComputer(mapping1);
        var context2 = anychart.math.roc.initContext(indicatorRef.args[0].value);
        computer2.setContext(context2);
        computer2.setStartFunction(anychart.math.roc.startFunction);
        computer2.setCalculationFunction(function(row, context){

            var currValue = row.get('roc1Value');
            currValue = Number(currValue);
            var missing = Number.isNaN(currValue);
            if (!missing)
                context.jc.enqueue(currValue);
            
            var result;
            // context.js is context.queue
            // context.Pb is context.period
            if (missing || context.jc.getLength() <= context.Pb) {
                result = NaN;
            } else {
                var nPeriodsAgo = (context.jc.get(0));
                var currentROC = (context.jc.get(-1));
                result = (currentROC - nPeriodsAgo) / (nPeriodsAgo * 100);
            }
            row.set('result2', result);
            console.log(currValue);
        });
        // End 2nd Roc

        return dataTable.mapAs({value: computer2.addOutputField("result2")});
    }
});

_tc.run([

            '$rootScope','tcStorage',
    function($rootScope , tcStorage){

        var savedConfig = tcStorage.getChartConfig();

        if(savedConfig)
            $rootScope.globalChartConfig = savedConfig;
        else{
            $rootScope.globalChartConfig = {

                height: 600,
                plots: [{

                    height: null,
                    indicators: [

                        {
                            key: 'candlestick',
                            indicatorObject: {value: 'candlestick', label: 'Candle Stick', args: []}
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

        var actualConfigRef;
        vm.actualConfigRef = null;

        var locals = $scope.localProps;

        if(locals && locals.isLocalSett){

            actualConfigRef = locals.chartConfig;
            vm.actualConfigRef = actualConfigRef;
        }
        
        $scope.chartConfig = angular.copy($rootScope.globalChartConfig);

        vm.closeModal = function(){

            chartOptionsModal.deactivate();
        };

        vm.addIndicator = function(plot){

            plot.indicators.push({

                key: 'roc',
                indicatorObject: angular.copy(techIndicators['roc'])
            });
        };

        vm.updateIndicator = function(indicator, key){

            indicator.key = key;
            indicator.indicatorObject = angular.copy(techIndicators[key]);
        };

        vm.removeIndicator = function(indicator, plot){

            var index = plot.indicators.indexOf(indicator);

            if(index > -1)
                plot.indicators.splice(index, 1);
        };

        vm.addPlot = function(){

            $scope.chartConfig.plots.push({

                height: 30,
                indicators: []
            });
        };

        vm.removePlot = function(plot){

            var index = $scope.chartConfig.plots.indexOf(plot);

            if(index>-1)
                $scope.chartConfig.plots.splice(index, 1);
        };

        vm.applyConfig = function(remember){

            if(remember)
                vm.saveConfig();

            $rootScope.$broadcast('tc.apply-charts-config', $scope.chartConfig, actualConfigRef);
            
            if(!actualConfigRef)
                $rootScope.globalChartConfig = angular.copy($scope.chartConfig);

            vm.closeModal();
        };

        vm.saveConfig = function(){

            if(!actualConfigRef)
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

            // Temporary
            if(config && config.plots.length && !angular.isArray(config.plots[0].indicators)){

                config = null;
                storage.removeItem('tc_chart_config');
            }

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

            'tickerCoinSrvc','$rootScope','chartOptionsModal','customIndicators',
    function(tickerCoinSrvc , $rootScope , chartOptionsModal , customIndicators){

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
                '           <div ng-if="false" style="float: right;cursor: pointer;margin-left: 1em;" ng-click="chartSettings(chart)"><img src="assets/images/icons/setting.svg" style="width: 1.5em;vertical-align: middle;"> Settings</div>' +
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
                    chart.chart = null;
                    chart.chart = anychart.stock();

                    for(var i=0; i<chart.config.plots.length; i++){

                        var plotSett = chart.config.plots[i];

                        if(plotSett.height)
                            chart.chart.plot(i).height(plotSett.height+'%');

                        angular.forEach(plotSett.indicators, function(indicator){

                            var indicatorObj = indicator.indicatorObject;
                            if(indicatorObj.custom){

                                var customMapping = customIndicators[indicatorObj.value](chart.dataTable, chart.mapping, indicatorObj);
                                chart.chart.plot(i).line(customMapping).name(indicatorObj.value+'('+ (indicatorObj.args.length?indicatorObj.args[0].value:'') +')');
                            }
                            else{

                                chart.chart.plot(i)[indicatorObj.value](chart.mapping, indicatorObj.args[0]?indicatorObj.args[0].value:undefined, indicatorObj.args[1]?indicatorObj.args[1].value:undefined);
                            }
                        });
                    }

                    chart.chart.title(chart.exchange + ' - (' + chart.market + ')');
                    chart.chart.container(chart.id);
                    chart.chart.draw();
                }

                scope.$on('tc.apply-charts-config', function(e, config, updateFor){

                    angular.forEach(scope.charts, function(chart){

                        if(!updateFor){

                            chart.config = angular.copy(config);
                            _drawChart(chart);
                        }
                        else if(updateFor == chart.config){
                            chart.config = angular.copy(config);
                            _drawChart(chart);
                        }
                    });
                });

                scope.chartSettings = function(chart){

                    var localProps = {chartConfig: chart.config, isLocalSett: true};
                    chartOptionsModal.activate({'localProps': localProps});
                };
                
                scope.charts = [];
                angular.forEach(pair.presence, function(exchange){

                    scope.charts.push({

                        market: pair.symbol,
                        exchange: exchange,
                        id: pair.symbol + '-' + exchange + '-' + Date.now(),
                        chart: anychart.stock(),
                        mapping: null,
                        volume: 0,
                        config: angular.copy($rootScope.globalChartConfig)
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
                            chart.dataTable = table;

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

            var localProps = {chartConfig: $rootScope.globalChartConfig};
            chartOptionsModal.activate({'localProps': localProps});
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