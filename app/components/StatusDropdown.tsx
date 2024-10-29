import React from 'react';
import type { Status } from "@prisma/client";

interface StatusDropdownProps {
  id: string;
  name: string;
  value?: Status;
  onChange: (value: Status) => void;
  onBlur: () => void;
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({ 
  id, 
  name, 
  value = 'ON_TRACK', // Default value
  onChange, 
  onBlur 
}) => {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value as Status)}
      onBlur={onBlur}
      className="form-select"
      style={{
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        marginTop: '5px'
      }}
    >
      <option value="ON_TRACK">On Track</option>
      <option value="AT_RISK">At Risk</option>
      <option value="DELAYED">Delayed</option>
      <option value="COMPLETED">Completed</option>
    </select>
  );
};