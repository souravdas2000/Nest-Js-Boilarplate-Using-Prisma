import bcrypt from 'bcrypt';

/**
 * Helper method to hash the raw password
 * @param rawPassword
 */
export const hashPassword = async (rawPassword: string) => {
  const salt = await bcrypt.genSalt();
  return await bcrypt.hash(rawPassword, salt);
};

/**
 * Helper method to compare raw password with hash
 * @param password
 * @param hash
 */
export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};
