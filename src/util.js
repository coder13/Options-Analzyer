export const safeFixed = (toFixed) => (value) => isNaN(value) ? value : value.toFixed(toFixed);
export const dollar = safeFixed(2);
