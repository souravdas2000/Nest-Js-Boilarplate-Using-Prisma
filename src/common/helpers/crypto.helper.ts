/**
 * Encrypt the OTP using Base64 encoding
 * @param otp
 * @returns encrypted OTP
 */
export const encryptOtp = (otp: string): string => {
  const buffer = Buffer.from(otp, 'utf8');
  return buffer.toString('base64');
};

/**
 * Decrypt the OTP using Base64 decoding
 * @param encryptedOtp
 * @returns decrypted OTP
 */
export const decryptOtp = (encryptedOtp: string): string => {
  const buffer = Buffer.from(encryptedOtp, 'base64');
  return buffer.toString('utf8');
};
