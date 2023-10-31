import { v4 as uuid } from 'uuid';
import UserMapper from '~/modules/users/domain/mappers/users.mapper';
import {
  CreateUser,
  CreateUserParams,
} from '~/modules/users/domain/use-cases/create-user';
import {
  UserDomain,
  UserDomainCreateParams,
} from '~/modules/users/domain/users.domain';
import { UserDto } from '~/modules/users/dto/user.dto';
import UserRepository from '~/services/database/typeorm/repositories/users-repository';
import { UniqueEntityID } from '~/shared/domain/unique-entity-id';
import { right } from '~/shared/either';

jest.mock('~/modules/users/domain/event/user-created');

describe('CreateUser', () => {
  let userRepository: UserRepository;
  let createUser: CreateUser;
  let userParams: UserDomainCreateParams;
  let userDomain: UserDomain;

  const mockUserParams = () => {
    userParams = {
      username: 'valid_username',
      email: 'valid@email.com',
      password: {
        value: 'valid_password',
      },
      age: 20,
      weight: 80,
      height: 180,
    };
  };

  const mockUserDomain = async () => {
    const userDomainOrError = await UserDomain.create(
      userParams,
      new UniqueEntityID(uuid()),
    );
    if (userDomainOrError.isLeft()) {
      throw new Error('Invalid user domain');
    }
    userDomain = userDomainOrError.value;
  };

  const mockUserRepository = () => {
    const useMapper = new UserMapper();

    const repositoryCreateUserMock = jest
      .fn()
      .mockResolvedValue(right(userDomain));
    const userRepositoryMock = new UserRepository(useMapper) as jest.Mocked<
      InstanceType<typeof UserRepository>
    >;
    userRepositoryMock.create = repositoryCreateUserMock;

    userRepository = userRepositoryMock;
  };

  const mockCreateUser = () => {
    createUser = new CreateUser(userRepository);
  };

  beforeAll(async () => {
    mockUserParams();
    await mockUserDomain();
    mockUserRepository();
    mockCreateUser();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('Should create a user', async () => {
    const createUserParams: CreateUserParams = {
      username: userParams.username,
      email: userParams.email,
      password: userParams.password.value,
      age: userParams.age,
      weight: userParams.weight,
      height: userParams.height,
    };

    const newUser = await createUser.execute(createUserParams);
    expect(newUser).toBeInstanceOf(UserDto);
    expect(newUser).toMatchObject({
      username: userParams.username,
      email: userParams.email,
      age: userParams.age,
      weight: userParams.weight,
      height: userParams.height,
    });
  });
});
