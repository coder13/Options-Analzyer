import clsx from 'clsx';

function ExpirationDatePicker({ dates, selectedDate, onDateSelected = () => {}}) {
  return (
    <div className="flex flex-wrap border-collapse">
      {dates.map((expirationDate) => (
        <div className={clsx('border p-1 text-center flex-auto hover:bg-gray-100 cursor-pointer', {
          'bg-yellow-100': expirationDate === selectedDate,
        })} key={expirationDate} onClick={() => onDateSelected(expirationDate)}>
          {expirationDate}
        </div>
      ))}
    </div>
  );
}

export default ExpirationDatePicker;