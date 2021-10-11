import { useMemo } from 'react';
import styled from 'styled-components'
import { useTable } from 'react-table';

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

function OptionsChain({ expirationDate, optionsData }) {
  const daysTillExpiration = Math.ceil(((new Date(expirationDate) - Date.now()))/1000/60/60/24);
  const expDate = expirationDate + ':' + daysTillExpiration;

  const columns = useMemo(() => [{
    Header: 'Calls',
    columns: [{
      Header: 'Gamma',
      accessor: 'gamma',
    }, {
      Header: 'Delta',
      accessor: 'delta',
    }, {
      Header: 'Bid',
      accessor: 'bid',
    }, {
      Header: 'Ask',
      accessor: 'ask',
    }],
  }, {
    Header: 'Strike',
    accessor: 'strikePrice',
  }, {
    Header: 'Puts',
    columns: [{
      Header: 'Bid',
      accessor: (originalRow, rowIndex) => {
        console.log(75, originalRow);
        return optionsData.putExpDateMap[expDate][originalRow.strikePrice.toFixed(1).toString()][0].bid;
      },
    }, {
      Header: 'Ask',
      accessor: (originalRow, rowIndex) => {
        console.log(75, originalRow);
        return optionsData.putExpDateMap[expDate][originalRow.strikePrice.toFixed(1).toString()][0].ask;
      },
    }, {
      Header: 'Delta',
      accessor: (originalRow, rowIndex) => {
        console.log(75, originalRow);
        return optionsData.putExpDateMap[expDate][originalRow.strikePrice.toFixed(1).toString()][0].delta;
      },
    }, {
      Header: 'Gamma',
      accessor: (originalRow, rowIndex) => {
        console.log(75, originalRow);
        return optionsData.putExpDateMap[expDate][originalRow.strikePrice.toFixed(1).toString()][0].gamma;
      },
    }],
  }], [expDate, optionsData]);

  const data = useMemo(() =>
    Object.keys(optionsData.callExpDateMap[expDate]).map((key) => ({
      ...optionsData.callExpDateMap[expDate][key][0]
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
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => {
                  return <td {...cell.getCellProps()} style={{ textAlign: 'center' }}>{cell.render('Cell')}</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </Styles>
  );
}

export default OptionsChain;
