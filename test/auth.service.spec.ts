import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { comparePassword } from '@common/helpers';
import { AuthService } from '../src/routes/v1/customer/auth/auth.service';

jest.mock('@common/helpers', () => ({
  comparePassword: jest.fn(),
  decryptOtp: jest.fn(),
  encryptOtp: jest.fn(),
  hashPassword: jest.fn(),
}));

describe('Customer AuthService.login', () => {
  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SUPPORT_EMAIL') {
        return 'support@example.com';
      }
      return undefined;
    }),
  } as unknown as ConfigService;

  const mockJwtTokenService = {
    generateAuthTokens: jest.fn(),
  };

  const mockOtpService = {
    generateVerifyEmailOTP: jest.fn(),
    generateResetPasswordOTP: jest.fn(),
  };

  const mockEmailService = {
    sendMail: jest.fn(),
  };

  const mockSocialAuthVerifyService = {
    verifyFacebookToken: jest.fn(),
    verifyGoogleToken: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn((key: string) => key),
  };

  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();

    authService = new AuthService(
      mockPrisma as any,
      mockConfigService,
      mockJwtTokenService as any,
      mockOtpService as any,
      mockEmailService as any,
      mockSocialAuthVerifyService as any,
      mockI18nService as any,
    );
  });

  it('throws when user does not exist', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'no-user@example.com', password: 'x' }),
    ).rejects.toThrow(BadRequestException);

    expect(mockI18nService.t).toHaveBeenCalledWith(
      'message.invalidLoginCredentials',
    );
  });

  it('throws when password is invalid', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      password: 'hashed-password',
      is_banned: false,
      is_deleted: false,
      is_active: true,
      is_email_verified: true,
    });
    (comparePassword as jest.Mock).mockResolvedValue(false);

    await expect(
      authService.login({ email: 'john@example.com', password: 'wrong' }),
    ).rejects.toThrow(BadRequestException);

    expect(mockI18nService.t).toHaveBeenCalledWith('message.invalidPassword');
  });

  it('returns verify-email response when email is not verified', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      password: 'hashed-password',
      is_banned: false,
      is_deleted: false,
      is_active: true,
      is_email_verified: false,
    });
    (comparePassword as jest.Mock).mockResolvedValue(true);

    const result = await authService.login({
      email: 'john@example.com',
      password: 'secret',
    });

    expect(result).toEqual({
      message: 'message.pleaseVerifyYourEmailToContinue',
      data: { is_email_verified: false },
    });
    expect(mockJwtTokenService.generateAuthTokens).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('returns tokens and updates last login on successful login', async () => {
    const user = {
      id: 'user-1',
      email: 'john@example.com',
      password: 'hashed-password',
      is_banned: false,
      is_deleted: false,
      is_active: true,
      is_email_verified: true,
      last_login_time: null,
    };

    const tokens = {
      access: { token: 'a', expires: new Date() },
      refresh: { token: 'r', expires: new Date() },
    };

    mockPrisma.user.findFirst.mockResolvedValue(user);
    (comparePassword as jest.Mock).mockResolvedValue(true);
    mockJwtTokenService.generateAuthTokens.mockResolvedValue(tokens);

    const result = await authService.login({
      email: 'john@example.com',
      password: 'secret',
    });

    expect(mockJwtTokenService.generateAuthTokens).toHaveBeenCalledWith(user);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { last_login_time: expect.any(Date) },
    });
    expect(result.message).toBe('message.youAreSignedInSuccessfully');
    expect(result.data.tokens).toEqual(tokens);
  });
});
