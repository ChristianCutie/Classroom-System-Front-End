import React from 'react';

const Avatar = ({ name = "User", avatar, size = 40, color = "#1a73e8", className = "" }) => {
  const getDisplayName = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      const fullName = [value.first_name || value.firstName, value.last_name || value.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      return fullName || value.fullName || value.name || "";
    }
    return String(value);
  };

  const getInitials = (str) => {
    if (!str) return "U";
    const parts = str.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  const displayName = getDisplayName(name);
  const displayValue = avatar || displayName;
  const label = typeof displayValue === "string" && displayValue.trim()
    ? displayValue.trim()
    : "U";
  const initials = avatar ? label.toUpperCase() : getInitials(displayName || label);

  return (
    <div
      className={`avatar-circle shadow-sm ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${Math.max(12, size * 0.42)}px`,
        backgroundColor: color
      }}
      title={displayName || label}
    >
      {initials}
    </div>
  );
};

export default Avatar;
