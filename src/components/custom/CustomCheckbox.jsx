import React from "react";

const CustomCheckbox = ({ label = "", checked, onChange }) => {
  return (
    <label className="container">
      {label}
      <input type="checkbox" checked={checked} onChange={onChange} />
      <div className="checkmark"></div>
    </label>
  );
};

export default CustomCheckbox;
