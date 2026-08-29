export const getInventoryStatusColor = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'AVAILABLE':
      return '#4CAF50'; // Green
    case 'RESERVED':
      return '#2196F3'; // Blue
    case 'HOLD':
      return '#FF9800'; // Orange
    case 'BOOKED':
      return '#E91E63'; // Pink/Red
    case 'REGISTERED':
      return '#9C27B0'; // Purple
    case 'SOLD':
      return '#607D8B'; // Blue Grey
    default:
      return '#9E9E9E'; // Grey for unknown status
  }
};
