import { safeFixed, dollar } from '../../util';

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
    </div>
  );
};

export default Legs;
