export const generateOtp = (digit = 4) => {
    return Math.floor(Math.random() * Math.pow(10, digit)).toString().padStart(digit, "0");
};
