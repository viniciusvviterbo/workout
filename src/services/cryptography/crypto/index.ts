import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import Env from '~/shared/env';

@Injectable()
export default class Crypto {
  private readonly algorithm: string;
  private readonly securityKey: string;
  private readonly initVector: string;

  constructor() {
    this.algorithm = Env.cryptographyAlgorithm;
    this.securityKey = Env.cryptographySecurityKey;
    this.initVector = Env.cryptographyInitVector;
  }

  public encryptValue(value: string): string {
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.securityKey,
      this.initVector,
    );

    let encryptedData = cipher.update(value, 'utf-8', 'base64');
    encryptedData += cipher.final('base64');
    value = encryptedData;

    return encryptedData;
  }

  public decryptValue(value: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.securityKey,
      this.initVector,
    );

    let decryptedData = decipher.update(value, 'base64', 'utf-8');
    decryptedData += decipher.final('utf8');

    return decryptedData;
  }
}
