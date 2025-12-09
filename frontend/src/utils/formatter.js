// src/utils/formatters.js

// 거래량 포맷팅
export const formatVolume = (num) => {
    if (!num || num === 0) return "0";
    const n = Number(num);
    return n >= 10000 ? Math.round(n / 10000) + "만" : n.toLocaleString();
};

// 금액 포맷팅
export const formatMoney = (num) => {
    if (!num || num === 0) return "0억";
    const n = Number(num);
    if (n >= 1_0000_0000_0000)
        return (n / 1_0000_0000_0000).toFixed(1).replace(/\.0$/, "") + "조";
    if (n >= 10_000_000_000) return Math.round(n / 100_000_000) + "억";
    return (n / 100_000_000).toFixed(1).replace(/\.0$/, "") + "억";
};

// 전일비 포맷팅
export const formatVs = (vs) => {
    if (vs > 0) return `Up ${vs.toLocaleString()}`;
    if (vs < 0) return `Down ${Math.abs(vs).toLocaleString()}`;
    return "Horizontal 0";
};
