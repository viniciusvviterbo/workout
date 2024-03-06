import { HttpException, HttpStatus, Provider } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import UtilClone from 'test/utils/clone';
import { SessionDomainMock } from 'test/utils/domains/session-domain-mock';
import { UserDomainMock } from 'test/utils/domains/user-domain-mock';
import getTokenRepositoryProvider from 'test/utils/providers/token-repository';
import getUserRepositoryProvider from 'test/utils/providers/user-repository';
import SessionMapper from '~/modules/session/domain/mappers/session.mapper';
import SessionDomain from '~/modules/session/domain/session.domain';
import { SessionUseCaseError } from '~/modules/session/domain/use-cases/errors';
import { VerifyEmail } from '~/modules/session/domain/use-cases/verify-email';
import Token from '~/modules/session/domain/value-objects/token';
import UserMapper from '~/modules/users/domain/mappers/users.mapper';
import { UserDomain } from '~/modules/users/domain/users.domain';
import TokenRepository from '~/services/database/typeorm/repositories/token-repository';
import UserRepository from '~/services/database/typeorm/repositories/users-repository';
import JwtService from '~/services/jwt/jsonwebtoken';
import { right } from '~/shared/either';

type GetModuleTestParams = {
  userRepositoryProvider?: Provider;
  tokenRepositoryProvider?: Provider;
};

describe('VerifyEmail Use Case', () => {
  let userDomain: UserDomain;
  let sessionDomain: SessionDomain;
  let verifyEmail: VerifyEmail;
  let module: TestingModule;
  const userMapper = new UserMapper();
  let token: string;

  const getUserRepositoryMock = () => {
    const findOneByIdMock = jest.fn().mockResolvedValue(userDomain);
    const userRepositoryMock = new UserRepository(userMapper) as jest.Mocked<
      InstanceType<typeof UserRepository>
    >;
    userRepositoryMock.findOneById = findOneByIdMock;

    const userDomainClone = UtilClone.deepInstanceClone(userDomain);
    userDomainClone.isEmailVerified.verifyEmail();
    userRepositoryMock.update = jest
      .fn()
      .mockResolvedValue(right(userDomainClone));

    return userRepositoryMock;
  };

  const getTokenRepositoryMock = () => {
    const findLastByUserIdAndTypedMock = jest
      .fn()
      .mockResolvedValue(sessionDomain);
    const tokenRepositoryMock = new TokenRepository(
      new SessionMapper(),
    ) as jest.Mocked<InstanceType<typeof TokenRepository>>;
    tokenRepositoryMock.findLastByUserIdAndType = findLastByUserIdAndTypedMock;

    const sessionDomainClone = UtilClone.deepInstanceClone(sessionDomain);
    sessionDomainClone.token.useToken();
    tokenRepositoryMock.update = jest
      .fn()
      .mockResolvedValue(right(sessionDomainClone));

    return tokenRepositoryMock;
  };

  const getModuleTest = async ({
    userRepositoryProvider,
    tokenRepositoryProvider,
  }: GetModuleTestParams = {}) => {
    if (!userRepositoryProvider) {
      userRepositoryProvider = await getUserRepositoryProvider({
        userRepositoryMock: getUserRepositoryMock(),
        userDomain,
      });
    }

    if (!tokenRepositoryProvider) {
      tokenRepositoryProvider = getTokenRepositoryProvider({
        tokenRepositoryMock: getTokenRepositoryMock(),
        sessionDomain,
      });
    }

    return Test.createTestingModule({
      imports: [],
      providers: [
        userRepositoryProvider,
        tokenRepositoryProvider,
        UserMapper,
        SessionMapper,
        VerifyEmail,
        JwtService,
      ],
    }).compile();
  };

  beforeAll(async () => {
    userDomain = await UserDomainMock.mountUserDomain();
    sessionDomain = SessionDomainMock.mountSessionDomain();
    token = (
      Token.create({ value: { userId: userDomain.id?.toValue() } })
        .value as Token
    ).value;
    module = await getModuleTest();

    verifyEmail = module.get<VerifyEmail>(VerifyEmail);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Should verify user email', async () => {
    const userRepositoryUpdateSpy = jest.spyOn(
      module.get<UserRepository>(UserRepository),
      'update',
    );
    const tokenRepositoryUpdateSpy = jest.spyOn(
      module.get<TokenRepository>(TokenRepository),
      'update',
    );

    expect(await verifyEmail.execute({ token })).toBe(true);
    expect(userRepositoryUpdateSpy).toHaveBeenCalled();
    expect(tokenRepositoryUpdateSpy).toHaveBeenCalled();
  });

  it('Should not verify user email if token is invalid', async () => {
    const userRepositoryUpdateSpy = jest.spyOn(
      module.get<UserRepository>(UserRepository),
      'update',
    );
    const tokenRepositoryUpdateSpy = jest.spyOn(
      module.get<TokenRepository>(TokenRepository),
      'update',
    );

    await expect(
      verifyEmail.execute({ token: 'invalidToken' }),
    ).rejects.toThrow(
      new HttpException(
        {
          message: SessionUseCaseError.messages.invalidToken,
        },
        HttpStatus.UNAUTHORIZED,
      ),
    );
    expect(userRepositoryUpdateSpy).not.toHaveBeenCalled();
    expect(tokenRepositoryUpdateSpy).not.toHaveBeenCalled();
  });
});
