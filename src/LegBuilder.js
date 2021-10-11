import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components'
import qs from 'qs';
import OptionsChain from './OptionsChain';
import { Store } from './Store';

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
  
  const getCallOption = ({ expDate, strike }) => optionsData.callExpDateMap[expDate + ':' + Math.ceil(((new Date(expDate) - Date.now()))/1000/60/60/24)][strike.toFixed(1).toString()][0]
  
  let deltaSum = 0;
  let gammaSum = 0;
  let thetaSum = 0;
  let totalPrice = 0;
  
  legs.forEach((leg) => {
    let callOption = getCallOption(leg);
    deltaSum += leg.quantity * callOption.delta;
    gammaSum += leg.quantity * callOption.gamma;
    thetaSum += leg.quantity * callOption.theta;
    totalPrice += leg.quantity * ((callOption.bid + callOption.ask) / 2);
  })

  return (
    <div style={{border: '1px solid black', margin: '1em', padding: '1em'}}>
      <p>Legs:</p>
      <table style={{width: '100%'}}>
        <thead>
          <tr>
            <td style={{textAlign: 'center'}}>Quantity</td>
            <td style={{textAlign: 'center'}}>Strike</td>
            <td style={{textAlign: 'center'}}>Side</td>
            <td style={{textAlign: 'center'}}>Exp Date</td>
            <td style={{textAlign: 'center'}}>Mid</td>
            <td style={{textAlign: 'center'}}>Delta</td>
            <td style={{textAlign: 'center'}}>Gamma</td>
            <td style={{textAlign: 'center'}}>Theta</td>
          </tr>
        </thead>
        <tbody>
          {legs.map(({quantity, strike, side, expDate}) => {
            let callOption = getCallOption({expDate, strike});
            return (
              <tr key={strike + side + expDate}>
                <td>{quantity}</td>
                <td>{strike}</td>
                <td>{side}</td>
                <td>{expDate}</td>
                <td>{((callOption.bid + callOption.ask) / 2).toFixed(2)}</td>
                <td style={{textAlign: 'right'}}>{callOption.delta}</td>
                <td style={{textAlign: 'right'}}>{callOption.gamma}</td>
                <td style={{textAlign: 'right'}}>{callOption.theta}</td>
              </tr>
            );
          })}
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>{totalPrice.toFixed(2)}</td>
            <td style={{textAlign: 'right'}}>{deltaSum.toFixed(4)}</td>
            <td style={{textAlign: 'right'}}>{gammaSum.toFixed(4)}</td>
            <td style={{textAlign: 'right'}}>{thetaSum.toFixed(4)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

function LegBuilder({ symbol, expirationDate }) {
  const { state } = useContext(Store);
  const [optionsData, setOptionsData] = useState({});
  const [error, setError] = useState(null);
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

  const legs = [{
    quantity: 1,
    strike: 454.0,
    side: 'call',
    expDate: expirationDate,
  }, {
    quantity: -1,
    strike: 449.0,
    side: 'call',
    expDate: expirationDate,
  }];

  return (
    <Col className="App">
      <Row className="row">
        {error && error}
        <p>Underlying Price: ${optionsData.underlyingPrice && optionsData.underlyingPrice.toFixed(2)}</p>
      </Row>
      <Row className="row">
        <Col className="col">
          { optionsData.status === 'SUCCESS' &&
            <OptionsChain expirationDate={expirationDate} optionsData={optionsData} />
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
