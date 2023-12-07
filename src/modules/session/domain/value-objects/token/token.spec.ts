import { JwtPayload } from 'jsonwebtoken';
import Token from '~/modules/session/domain/value-objects/token';
import Crypto from '~/services/cryptography/crypto';
import JwtService from '~/services/jwt/jsonwebtoken';

describe('Token Value Object', () => {
  type TokenPublicClass = Token & {
    isValid(): boolean;
    decryptValue(value: string, cryptoService: Crypto): string;
  };

  const cryptoService = new Crypto();
  const jwtService = new JwtService();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create a token value object', async () => {
    const isValidSpy = jest.spyOn(
      Token as unknown as TokenPublicClass,
      'isValid',
    );
    const decryptValueSpy = jest.spyOn(
      Token as unknown as TokenPublicClass,
      'decryptValue',
    );

    const tokenValue = 'valid_token';
    const token = Token.create({ value: tokenValue });

    expect(token.isRight()).toBeTruthy();
    expect(token.value).toBeInstanceOf(Token);
    expect(isValidSpy).toHaveBeenCalled();
    expect(decryptValueSpy).not.toHaveBeenCalled();

    const tokenValueObject = token.value as Token;

    const encryptedValue = jwtService.signToken({ value: tokenValue });
    expect(tokenValueObject.value).toBe(encryptedValue);

    const decodedValue =
      (await tokenValueObject.getDecodedValue()) as JwtPayload;
    expect(decodedValue.value).toBe(tokenValue);
  });

  it('Should create a token value object with encrypted value', async () => {
    const isValidSpy = jest.spyOn(
      Token as unknown as TokenPublicClass,
      'isValid',
    );
    const decryptValueSpy = jest.spyOn(
      Token as unknown as TokenPublicClass,
      'decryptValue',
    );

    const tokenValue = 'valid_token';
    const jwtToken = jwtService.signToken({ value: tokenValue });
    const encryptedValue = cryptoService.encryptValue(jwtToken);
    const token = Token.create(encryptedValue, {
      isEncrypted: true,
    });

    expect(token.isRight()).toBeTruthy();
    expect(token.value).toBeInstanceOf(Token);
    expect(isValidSpy).toHaveBeenCalled();
    expect(decryptValueSpy).toHaveBeenCalled();

    const tokenValueObject = token.value as Token;
    expect(tokenValueObject.value).toBe(jwtToken);

    const decodedValue =
      (await tokenValueObject.getDecodedValue()) as JwtPayload;
    expect(decodedValue.value).toBe(tokenValue);
  });
});
