import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components'
import qs from 'qs';
import OptionsChain from './OptionsChain';
import { Store } from './Store';
import FixedTD from './components/FixedTD';

const Styles = styled.div`
  padding: 1rem;
  table {
    border-spacing: 0;
    border: 1px solid black;
    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }
    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;
      :last-child {
        border-right: 0;
      }
    }
  }
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
`;

const Col = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

function Legs({ expirationDate, optionsData, legs }) {
  const daysTillExpiration = Math.ceil(((new Date(expirationDate) - Date.now()))/1000/60/60/24);

  if (optionsData.status !== 'SUCCESS') {
    return <div />
  }

  console.log(50, expirationDate + ':' + daysTillExpiration)
  
  const getOption = ({ expDate, strike, side }) => optionsData[`${side}ExpDateMap`][expDate + ':' + Math.ceil(((new Date(expDate) - Date.now()))/1000/60/60/24)][strike.toFixed(1).toString()][0]
  
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
    <div style={{
      border: '1px solid black',
      margin: '1em',
      padding: '1em',
      position: 'sticky',
      top: 0,
    }}>
      <p>Legs:</p>
      <Styles>
        <table style={{width: '100%'}}>
          <thead>
            <tr>
              <th style={{textAlign: 'center'}}>Quantity</th>
              <th style={{textAlign: 'center'}}>Strike</th>
              <th style={{textAlign: 'center'}}>Side</th>
              <th style={{textAlign: 'center'}}>Exp Date</th>
              <th style={{textAlign: 'center'}}>Mid</th>
              <th style={{textAlign: 'center'}}>Delta</th>
              <th style={{textAlign: 'center'}}>Gamma</th>
              <th style={{textAlign: 'center'}}>Theta</th>
            </tr>
          </thead>
          <tbody>
            {legs.map(({quantity, strike, side, expDate}) => {
              let callOption = getOption({expDate, side, strike});
              console.log(quantity, strike, side, expDate, callOption);
              return (
                <tr key={strike + side + expDate}>
                  <td>{quantity}</td>
                  <td>{strike}</td>
                  <td>{side}</td>
                  <td>{expDate}</td>
                  <FixedTD style={{textAlign: 'right'}} value={((callOption.bid + callOption.ask) / 2)} />
                  <FixedTD style={{textAlign: 'right'}} toFixed={3} value={callOption.delta} />
                  <FixedTD style={{textAlign: 'right'}} toFixed={3} value={callOption.gamma} />
                  <FixedTD style={{textAlign: 'right'}} toFixed={3} value={callOption.theta} />
                </tr>
              );
            })}
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <FixedTD style={{textAlign: 'right'}} value={totalPrice} />
              <FixedTD style={{textAlign: 'right'}} toFixed={3}>{deltaSum}</FixedTD>
              <FixedTD style={{textAlign: 'right'}} toFixed={3}>{gammaSum}</FixedTD>
              <FixedTD style={{textAlign: 'right'}} toFixed={3}>{thetaSum}</FixedTD>
            </tr>
          </tbody>
        </table>
      </Styles>
    </div>
  );
};

function LegBuilder({ symbol, expirationDate }) {
  const { state } = useContext(Store);
  const [optionsData, setOptionsData] = useState({});
  const [error, setError] = useState(null);
  const [legs, setLegs] = useState([{
    quantity: 1,
    strike: 454.0,
    side: 'call',
    expDate: expirationDate,
  }, {
    quantity: -1,
    strike: 449.0,
    side: 'call',
    expDate: expirationDate,
  }]);
  console.log(21, optionsData);

  useEffect(() => {
    let interval;
    async function fetchData() {
      let data = await fetch(`${process.env.REACT_APP_TDA_ORIGIN}/v1/marketdata/chains?${qs.stringify({
        apikey: process.env.REACT_APP_CLIENT_ID,
        symbol: symbol,
        contractType: 'ALL',
        includeQuotes: 'FALSE',
        fromDate: expirationDate,
        toDate: expirationDate,
      })}`, {
        headers: {
          Authorization: `Bearer ${state.user.access_token}`,
        },
      });
      let json = await data.json();
      if (json.error) {
        setError(json.error);
        return;
      }
      setOptionsData(json);
    }

    if (state.user.access_token) {
      fetchData();
      interval = setInterval(() => {
        console.log('fetching')
        fetchData();
      }, 60 * 1000);
    }

    return () => {
      clearInterval(interval);
    }
  }, [state.user.access_token, expirationDate, symbol]);

  const cellClicked = (cell) => {
    if (cell.column.id === 'strikePrice') {

    } else {
      let side = cell.column.id.split('-')[0]
      let field = cell.column.id.split('-')[1];
      if (field !== 'bid' && field !== 'ask') {
        return;
      }

      let option = cell.row.original[cell.column.id.split('-')[0]];
      console.log(side, field, option.strikePrice, option.expirationDate, option);
      let oldOption = legs.find((leg) => leg.side === side && leg.strike == option.strikePrice);
      if (oldOption) {
        if ((field === 'bid' && oldOption.quantity > 0 ) || (field === 'ask' && oldOption.quantity < 0 )) {
          setLegs([...legs.filter((leg) => leg.side !== side || leg.strike != option.strikePrice)]);
        } else {
          setLegs([...legs.filter((leg) => leg.side !== side || leg.strike != option.strikePrice), {
            quantity: field === 'bid' ? 1 : -1,
            strike: option.strikePrice,
            side,
            expDate: expirationDate,
          }])
        }
      } else {
        console.log('addding leg')
        setLegs([...legs, {
          quantity: field === 'bid' ? 1 : -1,
          strike: option.strikePrice,
          side,
          expDate: expirationDate,
        }])
      }
    }
  }

  return (
    <Col className="App">
      <Row className="row">
        {error && error}
        <p>Underlying Price: ${optionsData.underlyingPrice && optionsData.underlyingPrice.toFixed(2)}</p>
      </Row>
      <Row className="row">
        <Col className="col">
          { optionsData.status === 'SUCCESS' &&
            <OptionsChain legs={legs} expirationDate={expirationDate} optionsData={optionsData} onCellClick={cellClicked}/>
          }
        </Col>
        <Col className="col">
          <Legs optionsData={optionsData} legs={legs} expirationDate={expirationDate} />
        </Col>
      </Row>
    </Col>
  );
}

export default LegBuilder;
