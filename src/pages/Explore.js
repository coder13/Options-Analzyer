import React, { useState, useEffect, useContext, useMemo } from 'react';
import qs from 'qs';
import clsx from 'clsx';
import { AuthContext } from '../providers/AuthProvider';
import { dollar } from '../util';

function ExplorePage({ symbol, expirationDate }) {
  const { auth } = useContext(AuthContext);
  const [optionsData, setOptionsData] = useState(null);
  const [error, setError] = useState(null);
  const [ticker, setTicker] = useState(symbol);
  const [tickerInput, setTickerInput] = useState(symbol);
  const [side, setSide] = useState('call');

  useEffect(() => {
    let interval;
    async function fetchData() {
      let data = await fetch(`${process.env.REACT_APP_TDA_ORIGIN}/v1/marketdata/chains?${qs.stringify({
        apikey: process.env.REACT_APP_CLIENT_ID,
        symbol: ticker,
        contractType: 'ALL',
        includeQuotes: 'FALSE',
        fromDate: new Date().toISOString(),
        toDate: expirationDate,
      })}`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });
      let json = await data.json();
      if (json.error) {
        setError(json.error);
        return;
      }
      setOptionsData(json);
    }

    if (auth.accessToken) {
      fetchData();
      interval = setInterval(() => {
        console.log('fetching')
        fetchData();
      }, 60 * 1000);
    }

    return () => {
      clearInterval(interval);
    }
  }, [auth.accessToken, expirationDate, ticker]);

  const updateTicker = (event) => {
    event.preventDefault();
    setTicker(tickerInput);
  };

  const pivot = useMemo(() => {
    let pivotData = {};
    if (optionsData) {
      for (let i = 0; i < Object.keys(optionsData.callExpDateMap).length; i++) {
        let key = Object.keys(optionsData.callExpDateMap)[i];
        let chainForDate = optionsData.callExpDateMap[key];
  
        for (let j = 0; j < Object.keys(chainForDate).length; j++) {
          let strike = Object.keys(chainForDate)[j];
          if (!pivotData[strike]) {
            pivotData[strike] = {};
          }
  
          pivotData[strike][key] = chainForDate[strike];
        }
      }
    }
    return pivotData;
  }, [optionsData]);

  console.log(76, pivot);

  return (
    <div className="col flex-1">
      <div className="flex flex-direction-row flex-initial">
        {error && error}
      </div>
      {optionsData &&
        <>
          <div className="row flex-initial h-16">
            <div className="col w-1/4 m-2 items-center justify-center">
              <form className="flex flex-direction-row items-center" onSubmit={updateTicker}>
                <label className="mr-4" htmlFor="ticker">Ticker: </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="ticker"
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.currentTarget.value)}
                />
              </form>
            </div>
            <div className="col flex-1 justify-center m2">
              <p>Underlying Price: ${optionsData.underlyingPrice && optionsData.underlyingPrice.toFixed(2)}</p>
            </div>
          </div>
          <hr/>
          <row>
            <table className="w-full table-auto">
              <thead className="z-40 bg-gray-400">
                <tr>
                  <th className="sticky top-0 w-4 px-2">Strike</th>
                  {Object.keys(optionsData.callExpDateMap).map((expDate) => (
                    <th key={expDate} className="sticky top-0 text-center">{expDate.split(':')[1]}</th>
                    ))}
                </tr>
              </thead>
            </table>
          </row>
          <div className="row flex-1 h-0 overflow-y-auto">
            <table className="border box-border w-full table-auto">
              <thead className="hidden">
                <tr>
                  <th className="w-4 px-2">Strike</th>
                  {Object.keys(optionsData.callExpDateMap).map((expDate) => (
                    <th key={expDate} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(pivot).sort((a,b) => (+a) - (+b)).map((strikePrice) => (
                  <tr key={strikePrice} className="bg-white hover:filter hover:brightness-90">
                    <td className="px-2">{strikePrice}</td>
                    {Object.keys(optionsData.callExpDateMap).map((expDate) => {
                      let option = pivot[strikePrice][expDate] ? pivot[strikePrice][expDate][0] : null;
                       return (
                          <td
                            key={expDate}
                            className={clsx('text-center', {
                            'bg-yellow-200': +strikePrice < optionsData.underlyingPrice
                            })}
                          >
                            {option ? dollar((option.bid + option.ask)/2) : ''}
                          </td>
                        );
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      }
    </div>
  );
}

export default ExplorePage;
