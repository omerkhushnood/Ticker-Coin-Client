/*
    Main script.
*/

jQuery(function(){

    //
    // Populates exchanges dropdown.
    (function($){

        var _EXCHANGE_SELECT_SELECTOR = '#ccxt-exchange-select';
        var _MARKET_SELECT_SELECTOR = '#ccxt-market-select';
        var _TIMEFRAME_VALUE_SELECTOR = '#ccxt-timeframe-value';
        var _TIMEFRAME_UNIT_SELECTOR = '#ccxt-timeframe-unit';
        var _DATA_SINCE_SELECTOR = '#ccxt-data-since';
        var _PLOT_DATA_BUTTON_SELECTOR = '#ccxt-plot-data';
        var _INDICATOR_SELECT_SELECTOR = '#ccxt-indicator-select';
        var _INDICATOR_PLOT_SELECT_SELECTOR = '#ccxt-indicator-plot';
        var _CHART_CONTAINER_SELECTOR = 'ccxt-chart-container';
        var _ERROR_LOG_SELECTOR = '#ccxt-err-log';

        var exchangeSelect = $(_EXCHANGE_SELECT_SELECTOR);
        var marketSelect = $(_MARKET_SELECT_SELECTOR);
        var timeframeValueInput = $(_TIMEFRAME_VALUE_SELECTOR);
        var timeframeUnitSelect = $(_TIMEFRAME_UNIT_SELECTOR);
        var dataSinceInput = $(_DATA_SINCE_SELECTOR);
        var plotDataButton = $(_PLOT_DATA_BUTTON_SELECTOR);
        var indicatorSelect = $(_INDICATOR_SELECT_SELECTOR);
        var indicatorPlotSelect = $(_INDICATOR_PLOT_SELECT_SELECTOR);
        var chartContainer = $(_CHART_CONTAINER_SELECTOR);
        var errorLogContainer = $(_ERROR_LOG_SELECTOR);

        var _chart = null;
        var _currOHLCVData = null;

        var _DEFAULT_SINCE_DATE = new Date();
        _DEFAULT_SINCE_DATE.setDate(_DEFAULT_SINCE_DATE.getDate()-1);

        function _logError(err){

            errorLogContainer.empty();
            errorLogContainer.text(err);
        }

        function _clearErrorLog(){

            errorLogContainer.empty();
        }

        // Populates exchanges dropdown.
        function _populateExchanges(err, exchanges){

            if(err)
                return _logError(err);

            exchangeSelect.empty();

            exchanges.forEach(function(exchange){

                var option = $('<option/>');
                option.text(exchange);
                option.attr('value', exchange);
                exchangeSelect.append(option);
            });

            _clearErrorLog();
        }

        // Populates markets dropdown.
        function _populateMarkets(err, marketsHash){

            if(err)
                return _logError(err);

            var markets = Object.keys(marketsHash);

            marketSelect.empty();
            markets.forEach(function(market){

                var option = $('<option/>');
                option.text(market);
                option.attr('value', market);
                marketSelect.append(option);
            });

            _clearErrorLog();
        }

        // Plots OHLC Chart.
        function _plotOHLCV(){

            if(!_currOHLCVData)
                return;

            if(_chart)
                _chart.dispose();

            var table = anychart.data.table();
            table.addData(_currOHLCVData);

            var mapping = table.mapAs();
            mapping.addField('open', 1, 'first');
            mapping.addField('high', 2, 'max');
            mapping.addField('low', 3, 'min');
            mapping.addField('close', 4, 'last');
            mapping.addField('value', 4, 'last');
            mapping.addField('volumn', 5, 'volume');

            _chart = anychart.stock();
            
            _chart.plot(0).ohlc(mapping);

            _chart.plot(0)[indicatorSelect.val()](mapping, undefined, indicatorPlotSelect.val());

            _chart.title('Technical Indicators Test Chart.');

            _chart.container(_CHART_CONTAINER_SELECTOR);
            _chart.draw();

            _clearErrorLog();
        }

        // Handles exchange selection change.
        function _onExchangeSelect(){

            if(_chart)
                _chart.dispose();

            _ccxtSrvc.fetchMarkets(exchangeSelect.eq(0).val(), _populateMarkets);
        }

        // Handles fetching OHLC data and plotting.
        function _onPlotData(){

            var dataSince = dataSinceInput.val()?(new Date(dataSinceInput.val())).getTime():_DEFAULT_SINCE_DATE.getTime();
            var timeFrame = Math.abs(Math.round(timeframeValueInput.val()))+timeframeUnitSelect.val();

            var options = {

                timeframe: timeFrame,
                since: dataSince,
                limit: 0
            }

            _ccxtSrvc.loadOHLCVData(exchangeSelect.val(), marketSelect.val(), options, function(err, OHLCVData){

                if(err)
                    return _logError(err);

                _currOHLCVData = OHLCVData;
                _plotOHLCV();
            });
        }

        //
        // Initialize.

        // Add event listeners.
        exchangeSelect.on('change', _onExchangeSelect);
        plotDataButton.on('click', _onPlotData);
        indicatorSelect.on('change', _plotOHLCV);
        indicatorPlotSelect.on('change', _plotOHLCV);

        // Fetch exchanges and populate dropdown.
        _ccxtSrvc.fetchExchanges(_populateExchanges);

    })(jQuery);
});