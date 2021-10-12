import { useMemo } from 'react';
import styled from 'styled-components'
import { useTable } from 'react-table';
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
  expirationDate,
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
  const daysTillExpiration = Math.ceil(((new Date(expirationDate) - Date.now()))/1000/60/60/24);
  const expDate = expirationDate + ':' + daysTillExpiration;

  const columns = useMemo(() => [{
    Header: 'Calls',
    columns: [{
      Header: 'Gamma',
      id: 'call-gamma',
      accessor: ({ call }) => call.gamma,
      Cell: ({ value }) => (+value).toFixed(3),
    }, {
      Header: 'Delta',
      id: 'call-delta',
      accessor: ({ call }) => call.delta,
      Cell: ({ value }) => (+value).toFixed(3),
    }, {
      Header: 'Bid',
      id: 'call-bid',
      accessor: ({ call }) => call.bid,
    }, {
      Header: 'Ask',
      id: 'call-ask',
      accessor: ({ call }) => call.ask,
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
      Cell: ({ value }) => (+value).toFixed(3),
    }, {
      Header: 'Gamma',
      id: 'put-gamma',
      accessor: ({ put }) => put.gamma,
      Cell: ({ value }) => (+value).toFixed(3),
    }].filter(({ id }) => fields[id.split('-')[1]]),
  }], []);

  const data = useMemo(() =>
    Object.keys(optionsData.callExpDateMap[expDate]).map((key) => ({
      strikePrice: optionsData.callExpDateMap[expDate][key][0].strikePrice,
      call: optionsData.callExpDateMap[expDate][key][0],
      put: optionsData.putExpDateMap[expDate][key][0],
    })).filter(({ strikePrice }) => Math.abs(strikePrice - optionsData.underlyingPrice) < 25)
  , [optionsData, expDate]);

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

  const highlight = { call: {}, put: {} };
  for (let i in legs) {
    let leg = legs[i];
    highlight[leg.side][leg.strike] = leg.quantity;
  }

  console.log(130, highlight);

  return (
    <Styles>
      <table {...getTableProps()}>
        <thead>
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
                    return <StrikeTD {...cell.getCellProps()} onClick={() => onCellClick(cell)}>{cell.render('Cell')}</StrikeTD>
                  }

                  let side = cell.column.id.split('-')[0];
                  let inTheMoney = cell.row.original[side].inTheMoney;
                  return <OptionsDataTD
                    {...cell.getCellProps()}
                    inTheMoney={inTheMoney}
                    quantity={highlight[side][cell.row.original.strikePrice]}
                    onClick={() => onCellClick(cell)}
                  >
                    {cell.render('Cell')}
                  </OptionsDataTD>
                })}
              </OptionsDataTR>
            )
          })}
        </tbody>
      </table>
    </Styles>
  );
}

export default OptionsChain;
