import React from 'react';

const Avatar = ({ name = "User", size = 40, color = "#1a73e8", className = "" }) => {
  const getInitials = (str) => {
    if (!str) return "U";
    const parts = str.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div
      className={`avatar-circle shadow-sm ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${Math.max(12, size * 0.42)}px`,
        backgroundColor: color
      }}
      title={name}
    >
      {initials}
    </div>
  );
};

export default Avatar;
