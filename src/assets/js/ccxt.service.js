

_ccxtSrvc= (function($){

    // Switch API HOST according to environment.
    // For local development.
    //var _API_HOST = 'http://127.0.0.1:3000';
    // For production.
    var _API_HOST = 'http://169.60.157.140:3001';


    var _CSS_LOADER_CLASS = 'ccxt-loader';

    var bodyRef = $(document.body);

    // Fetchs available exchanges.
    function _fetchExchanges(cb){

        bodyRef.addClass(_CSS_LOADER_CLASS);

        var url = _API_HOST + '/api/ccxt/exchanges';

        $.ajax(url, {

            method: 'GET',
            contentType: 'application/json',
            success: function(data){

                _exchanges = data;
                cb(null, data);
                bodyRef.removeClass(_CSS_LOADER_CLASS);
            },
            error: function(xhrObj){

                cb(xhrObj.responseJSON);

                console.error('Failed:', url);
                alert('Failed to fetch exchanges.');
                bodyRef.removeClass(_CSS_LOADER_CLASS);
            }
        });
    }

    // Fetchs available markets for specified exchange.
    function _fetchMarkets(exchange, cb){

        bodyRef.addClass(_CSS_LOADER_CLASS);

        var url = _API_HOST +
            '/api/ccxt/exchanges/' +
            exchange +
            '/markets'
        ;

        $.ajax(url, {

            method: 'GET',
            contentType: 'application/json',
            success: function(data){

                cb(null, data);
                bodyRef.removeClass(_CSS_LOADER_CLASS);
            },
            error: function(xhrObj){

                cb(xhrObj.responseJSON);

                console.error('Failed:', url);
                alert('Failed to fetch markets for exchange "'+ exchange +'".');
                bodyRef.removeClass(_CSS_LOADER_CLASS);
            }
        });
    }

    // Fetchs OHLCV data for specified market in specified exchange.
    function _loadOHLCVData(exchange, market, options, cb){

        bodyRef.addClass(_CSS_LOADER_CLASS);

        var url = _API_HOST +
            '/api/ccxt/exchanges/' +
            encodeURIComponent(exchange) +
            '/markets/' +
            encodeURIComponent(market) +
            '/ohlcv'
        ;

        $.ajax(url, {

            method: 'GET',
            contentType: 'application/json',
            data: options,
            success: function(data){

                cb(null, data);
                bodyRef.removeClass(_CSS_LOADER_CLASS);
            },
            error: function(xhrObj){

                cb(xhrObj.responseJSON);

                console.error('Failed:', url);
                alert('Failed to fetch OHLCV data for market "'+ market +'".');
                bodyRef.removeClass(_CSS_LOADER_CLASS);
            }
        });
    }

    return {

        fetchExchanges: _fetchExchanges,
        fetchMarkets: _fetchMarkets,
        loadOHLCVData: _loadOHLCVData
    };
})(jQuery);