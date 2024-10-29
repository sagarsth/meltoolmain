import React from 'react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface DatePickerProps {
  id: string;
  name: string;
  onChange?: (date: string) => void;  // Add this prop
}

export const DatePicker: React.FC<DatePickerProps> = ({ id, name, onChange }) => {
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [inputValue, setInputValue] = React.useState<string>('');
  const [errorMessage, setErrorMessage] = React.useState<string>('');

  // Function to validate date format and future date
  const validateDate = (value: string) => {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/; // yyyy-mm-dd format
    const today = new Date();

    // Check if the value matches the date format
    if (!datePattern.test(value)) {
      return "Please enter a date in the format yyyy-mm-dd.";
    }

    const date = new Date(value);

    // Check if the parsed date is valid and not in the future
    if (isNaN(date.getTime())) {
      return "Invalid date. Please enter a valid date.";
    } else if (date > today) {
      return "The date cannot be in the future.";
    }

    return ""; // No error
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Perform validation
    const error = validateDate(value);
    setErrorMessage(error);

    if (!error) {
      // If no error, update the selectedDate state and call onChange
      setSelectedDate(new Date(value));
      onChange?.(value);  // Add this line
    }
  };

  return (
    <div>
      <ReactDatePicker
        id={id}
        name={name}
        selected={selectedDate}
        onChange={(date: Date | null) => {
          setSelectedDate(date);
          setInputValue(date ? date.toISOString().split('T')[0] : "");
          setErrorMessage(""); // Clear error on successful date selection
        }}
        dateFormat="yyyy-MM-dd"
        placeholderText="yyyy-mm-dd" // Hint for date format
        autoComplete="off" // Turn off browser autocomplete
        customInput={
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="yyyy-mm-dd"
            autoComplete="off"
          />
        }
        showYearDropdown // Enable year dropdown
        yearDropdownItemNumber={15} // Show 15 years in the dropdown
        scrollableYearDropdown // Allow scrolling through the year dropdown
        showMonthDropdown // Enable month dropdown
        renderCustomHeader={({ date, changeYear, changeMonth, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled}>
              {"<"}
            </button>
            <select
              value={date.getFullYear()}
              onChange={({ target: { value } }) => changeYear(parseInt(value))}
            >
              {Array.from({ length: 15 }, (_, i) => (
                <option key={i} value={date.getFullYear() - 7 + i}>
                  {date.getFullYear() - 7 + i}
                </option>
              ))}
            </select>
            <select
              value={date.getMonth()}
              onChange={({ target: { value } }) => changeMonth(parseInt(value))}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
            <button onClick={increaseMonth} disabled={nextMonthButtonDisabled}>
              {">"}
            </button>
          </div>
        )}
      />

      {/* Display validation error if any */}
      {errorMessage && <p className="error" style={{ color: "red" }}>{errorMessage}</p>}
    </div>
  );
};
