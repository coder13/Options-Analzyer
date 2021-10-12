const FixedTD = ({ value, toFixed = 2, ...props }) => <td {...props}>{isNaN(value) ? value : value.toFixed(toFixed)}</td>

export default FixedTD;
