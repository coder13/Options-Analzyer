import { useMemo, useState } from 'react';
import styled from 'styled-components'
import { useTable } from 'react-table';
import { safeFixed, dollar } from './util';
import ExpirationDatePicker from './components/ExpirationDatePicker';

const StrikeTD = styled.td`
  text-align: center;
  background-color: #dfdfdf;
`;

const OptionsDataTD = styled.td`
  text-align: center;
  background-color: ${props => props.quantity < 0 ? '#FF7F7F' : (props.quantity > 0 ? '#98fb98' : (props.inTheMoney ? '#FFFFBF' : 'white'))};
`;

const OptionsDataTR = styled.tr`
  :hover {
    filter: brightness(90%);
  }
`;

function OptionsChain({
  optionsData,
  fields = {
    gamma: true,
    delta: true,
    theta: true,
    bid: true,
    ask: true,
  },
  legs,
  onCellClick = () => {},
}) {
  const expirationDates = Object.keys(optionsData.callExpDateMap);
  const [selectedExpirationDate, setSelectedExpirationDate] = useState(expirationDates[0])
  const highlight = useMemo(() => {
    let h = {};
    console.log('rendering highlight');
    for (let i in legs) {
      const leg = legs[i];
  
      if (!h[leg.expDate]) {
        h[leg.expDate] = { call: {}, put: {} };
      }
  
      h[leg.expDate][leg.side][leg.strike] = leg.quantity;
    }

    return h;
  }, [legs]);

  const columns = useMemo(() => [{
    Header: 'Calls',
    columns: [{
      Header: 'Gamma',
      id: 'call-gamma',
      accessor: ({ call }) => call.gamma,
      Cell: ({ value }) => dollar(value),
    }, {
      Header: 'Delta',
      id: 'call-delta',
      accessor: ({ call }) => call.delta,
      Cell: ({ value }) => dollar(value),
    }, {
      Header: 'Bid',
      id: 'call-bid',
      accessor: ({ call }) => dollar(call.bid),
    }, {
      Header: 'Ask',
      id: 'call-ask',
      accessor: ({ call }) => dollar(call.ask),
    }].filter(({ id }) => fields[id.split('-')[1]]),
  }, {
    Header: 'Strike',
    accessor: 'strikePrice',
  }, {
    Header: 'Puts',
    columns: [{
      Header: 'Bid',
      id: 'put-bid',
      accessor: ({ put }) => put.bid,
    }, {
      Header: 'Ask',
      id: 'put-ask',
      accessor: ({ put }) => put.ask,
    }, {
      Header: 'Delta',
      id: 'put-delta',
      accessor: ({ put }) => put.delta,
      Cell: ({ value }) => safeFixed(3)(value),
    }, {
      Header: 'Gamma',
      id: 'put-gamma',
      accessor: ({ put }) => put.gamma,
      Cell: ({ value }) => safeFixed(3)(value),
    }].filter(({ id }) => fields[id.split('-')[1]]),
  }], []);

  const data = useMemo(() =>
    Object.keys(optionsData.callExpDateMap[selectedExpirationDate]).map((key) => ({
      strikePrice: optionsData.callExpDateMap[selectedExpirationDate][key][0].strikePrice,
      call: optionsData.callExpDateMap[selectedExpirationDate][key][0],
      put: optionsData.putExpDateMap[selectedExpirationDate][key][0],
    })).filter(({ strikePrice }) => Math.abs(strikePrice - optionsData.underlyingPrice) < 25)
  , [optionsData, selectedExpirationDate]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({
    columns,
    data,
  });

  return (
    <div className="p-1">
      <ExpirationDatePicker
        dates={expirationDates}
        selectedDate={selectedExpirationDate}
        onDateSelected={(date) => setSelectedExpirationDate(date)}
      />
      <table {...getTableProps()} className="table-auto border border-collapse">
        <thead className="border">
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row)
            return (
              <OptionsDataTR {...row.getRowProps()}>
                {row.cells.map(cell => {
                  if (cell.column.id === 'strikePrice') {
                    return <StrikeTD {...cell.getCellProps()} className="border p-1" onClick={() => onCellClick(cell, selectedExpirationDate)}>{cell.render('Cell')}</StrikeTD>
                  }

                  const side = cell.column.id.split('-')[0];
                  const inTheMoney = cell.row.original[side].inTheMoney;

                  return <OptionsDataTD
                    {...cell.getCellProps()}
                    className="border p-1"
                    inTheMoney={inTheMoney}
                    quantity={highlight[selectedExpirationDate] && highlight[selectedExpirationDate][side] && highlight[selectedExpirationDate][side][cell.row.original.strikePrice]}
                    onClick={() => onCellClick(cell, selectedExpirationDate)}
                  >
                    {cell.render('Cell')}
                  </OptionsDataTD>
                })}
              </OptionsDataTR>
            )
          })}
        </tbody>
      </table>
    </div>
  );
}

export default OptionsChain;
