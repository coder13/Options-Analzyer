import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components'
import qs from 'qs';
import OptionsChain from './OptionsChain';
import { AuthContext } from './AuthProvider';
import { safeFixed, dollar } from './util';

const Styles = styled.div`
  // padding: 1rem;
  // table {
  //   border-spacing: 0;
  //   border: 1px solid black;
  //   tr {
  //     :last-child {
  //       td {
  //         border-bottom: 0;
  //       }
  //     }
  //   }
  //   th,
  //   td {
  //     margin: 0;
  //     padding: 0.5rem;
  //     border-bottom: 1px solid black;
  //     border-right: 1px solid black;
  //     :last-child {
  //       border-right: 0;
  //     }
  //   }
  // }
`;

function Legs({ optionsData, legs }) {
  if (optionsData.status !== 'SUCCESS') {
    return <div />
  }
  
  const getOption = ({ expDate, strike, side }) => optionsData[`${side}ExpDateMap`][expDate][safeFixed(1)(strike).toString()][0]
  
  let deltaSum = 0;
  let gammaSum = 0;
  let thetaSum = 0;
  let totalPrice = 0;
  
  legs.forEach((leg) => {
    let callOption = getOption(leg);
    deltaSum += leg.quantity * callOption.delta;
    gammaSum += leg.quantity * callOption.gamma;
    thetaSum += leg.quantity * callOption.theta;
    totalPrice += leg.quantity * ((callOption.bid + callOption.ask) / 2);
  })

  return (
    <div className="rounded border p-1 sticky top-0">
      <p>Legs:</p>
      <Styles>
        <table style={{ width: '100%' }} className="table-auto">
          <thead>
            <tr>
              <th style={{textAlign: 'center'}}>Quantity</th>
              <th style={{textAlign: 'center'}}>Strike</th>
              <th style={{textAlign: 'center'}}>Side</th>
              <th style={{textAlign: 'center'}}>Exp Date</th>
              <th style={{textAlign: 'center'}}>Days</th>
              <th style={{textAlign: 'center'}}>Mid</th>
              <th style={{textAlign: 'center'}}>Delta</th>
              <th style={{textAlign: 'center'}}>Gamma</th>
              <th style={{textAlign: 'center'}}>Theta</th>
            </tr>
          </thead>
          <tbody>
            {legs.map(({ quantity, strike, side, expDate }) => {
              let callOption = getOption({ expDate, side, strike });

              return (
                <tr key={strike + side + expDate}>
                  <td>{quantity}</td>
                  <td>{strike}</td>
                  <td>{side}</td>
                  <td>{expDate.split(':')[0]}</td>
                  <td>{expDate.split(':')[1]}</td>
                  <td style={{textAlign: 'right'}}>{dollar((callOption.bid + callOption.ask) / 2)}</td>
                  <td style={{textAlign: 'right'}}>{safeFixed(3)(quantity * callOption.gamma)}</td>
                  <td style={{textAlign: 'right'}}>{safeFixed(3)(quantity * callOption.delta)}</td>
                  <td style={{textAlign: 'right'}}>{safeFixed(3)(quantity * callOption.theta)}</td>
                </tr>
              );
            })}
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td style={{textAlign: 'right'}}>{dollar(totalPrice)}</td>
              <td style={{textAlign: 'right'}}>{safeFixed(3)(deltaSum)}</td>
              <td style={{textAlign: 'right'}}>{safeFixed(3)(gammaSum)}</td>
              <td style={{textAlign: 'right'}}>{safeFixed(3)(thetaSum)}</td>
            </tr>
          </tbody>
        </table>
      </Styles>
    </div>
  );
};

function LegBuilder({ symbol, expirationDate }) {
  const { auth } = useContext(AuthContext);
  const [optionsData, setOptionsData] = useState({});
  const [error, setError] = useState(null);
  const [legs, setLegs] = useState([]);
  const [ticker, setTicker] = useState(symbol);
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

  return (
    <div className="col">
      <div className="row">
        {error && error}
      </div>
      <div className="row">
        <div className="col w-8 m-2">
          <form className="flex flex-direction-row items-center" action={fetch}>
            <label className="mr-4" for="ticker">Ticker: </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="ticker"
              value={ticker}
              />
          </form>
        </div>
        <div className="col justify-center m2">
          <p>Underlying Price: ${optionsData.underlyingPrice && optionsData.underlyingPrice.toFixed(2)}</p>
        </div>
      </div>
      <hr/>
      <div className="row">
        <div className="col p-2">
          { optionsData.status === 'SUCCESS' &&
            <OptionsChain legs={legs} expirationDate={expirationDate} optionsData={optionsData} onCellClick={cellClicked}/>
          }
        </div>
        <div className="col p-2">
          <Legs optionsData={optionsData} legs={legs} expirationDate={expirationDate} />
        </div>
      </div>
    </div>
  );
}

export default LegBuilder;
