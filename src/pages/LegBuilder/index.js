import React, { useState, useEffect, useContext } from 'react';
import qs from 'qs';
import { AuthContext } from '../../providers/AuthProvider';
import OptionsChain from '../../components/OptionsChain';
import Legs from './Legs';

function LegBuilder({ symbol, expirationDate }) {
  const { auth } = useContext(AuthContext);
  const [optionsData, setOptionsData] = useState({});
  const [error, setError] = useState(null);
  const [legs, setLegs] = useState([]);
  const [ticker, setTicker] = useState(symbol);
  const [tickerInput, setTickerInput] = useState(symbol);
  console.log(21, optionsData);

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

  const cellClicked = (cell, expDate) => {
    if (cell.column.id === 'strikePrice') {

    } else {
      let side = cell.column.id.split('-')[0]
      let field = cell.column.id.split('-')[1];
      if (field !== 'bid' && field !== 'ask') {
        return;
      }

      let option = cell.row.original[cell.column.id.split('-')[0]];
      let oldOption = legs.find((leg) => leg.side === side && leg.strike === option.strikePrice && leg.expDate === expDate);
      if (oldOption) {
        if ((field === 'bid' && oldOption.quantity > 0 ) || (field === 'ask' && oldOption.quantity < 0 )) {
          setLegs([...legs.filter((leg) => leg.side !== side || leg.strike !== option.strikePrice)]);
        } else {
          setLegs([...legs.filter((leg) => leg.side !== side || leg.strike !== option.strikePrice), {
            quantity: field === 'bid' ? 1 : -1,
            strike: option.strikePrice,
            side,
            expDate: expDate,
          }])
        }
      } else {
        console.log('addding leg')
        setLegs([...legs, {
          quantity: field === 'bid' ? 1 : -1,
          strike: option.strikePrice,
          side,
          expDate: expDate,
        }])
      }
    }
  }

  console.log('legs', legs);

  const updateTicker = (event) => {
    event.preventDefault();
    setTicker(tickerInput);
  };

  return (
    <div className="col flex-1">
      <div className="flex flex-direction-row flex-initial">
        {error && error}
      </div>
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
      <div className="row flex-1">
        <div className="col flex-1 p-2">
          { optionsData.status === 'SUCCESS' &&
            <OptionsChain legs={legs} expirationDate={expirationDate} optionsData={optionsData} onCellClick={cellClicked}/>
          }
        </div>
        <div className="col flex-1 p-2">
          <Legs optionsData={optionsData} legs={legs} expirationDate={expirationDate} />
        </div>
      </div>
    </div>
  );
}

export default LegBuilder;
