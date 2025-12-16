import React, { useState, useRef, useEffect } from "react";
import "./CustomSelect.css";

const CustomSelect = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    const options = [
        { value: "ko", label: "한국어" },
        { value: "en", label: "English" },
        { value: "ja", label: "日本語" },
    ];

    const current = options.find((o) => o.value === value);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="custom-select" ref={dropdownRef}>
            <button
                className="custom-select-btn"
                onClick={() => setOpen(!open)}
            >
                {current.label}
                <span className={`arrow ${open ? "open" : ""}`}>▼</span>
            </button>

            {open && (
                <ul className="custom-select-list">
                    {options.map((opt) => (
                        <li
                            key={opt.value}
                            className="custom-select-item"
                            onClick={() => {
                                onChange(opt.value);
                                setOpen(false);
                            }}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CustomSelect;
