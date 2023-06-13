import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { roles, users } from '@prisma/client';
import * as crypto from 'crypto';
import { UserData } from 'src/auth/interfaces/UserData';

@Injectable()
export class EncryptService {
  constructor(private readonly config: ConfigService) { }

  userHashMap: Record<string, string> = {};

  generateEncryptKey(user: users & { roles: roles }, origPassword: string) {
    const isForeman = user.roles.roleName === 'foreman';

    const hash = crypto.createHash('sha512');

    hash.update(origPassword);

    const myHash = hash.digest('hex');

    let hashForDataEncryption;

    if (isForeman) {
      const saltForOwnerHash = Buffer.from(
        this.config.get('SALT_FOR_OWNER_HASH') as string,
        'hex',
      );
      const ivForOwnerHash = Buffer.from(
        this.config.get('IV_FOR_OWNER_HASH') as string,
        'hex',
      );

      const keyToDecrpytOwnerHash = crypto.pbkdf2Sync(
        myHash,
        saltForOwnerHash,
        10000,
        32,
        'sha256',
      );

      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        keyToDecrpytOwnerHash,
        ivForOwnerHash,
      );

      const ownerHash = Buffer.from(user.ownerHash as string, 'hex');

      hashForDataEncryption = Buffer.concat([
        decipher.update(ownerHash),
        decipher.final(),
      ]).toString();
    } else {
      hashForDataEncryption = myHash;
    }

    this.userHashMap[user.id] = hashForDataEncryption;
  }

  encryptData(data: Record<string, string>, userId: number) {
    const hash = this.userHashMap[userId];

    if (!hash) {
      throw new Error('No hash for user');
    }

    const iv = crypto.randomBytes(16);
    const salt = crypto.randomBytes(64);

    const key = crypto.pbkdf2Sync(hash, salt, 10000, 32, "sha256");

    for (const _key in data) {
      const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

      const value = data[_key];

      if (!value) {
        continue;
      }

      const encrypted = Buffer.concat([
        cipher.update(value),
        cipher.final(),
      ]);

      data[_key] = encrypted.toString("hex");
    }

    return {
      iv: iv.toString("hex"),
      salt: salt.toString("hex"),
      ...data,
    };
  }

  decryptData(data: Record<string, string>, userId: number) {
    const hash = this.userHashMap[userId];

    if (!hash) {
      throw new Error('No hash for user');
    }

    const iv = Buffer.from(data.iv, "hex");
    const salt = Buffer.from(data.salt, "hex");

    const key = crypto.pbkdf2Sync(hash, salt, 10000, 32, "sha256");

    for (const _key in data) {
      if (_key === "iv" || _key === "salt") {
        continue;
      }

      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

      const value = data[_key];

      if (!value) {
        continue;
      }

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(value, "hex")),
        decipher.final(),
      ]);

      data[_key] = decrypted.toString();
    }

    delete data.iv;
    delete data.salt;

    return data;
  }

  encryptOwnerHashWithForemanHash(
    ownerId: UserData['ownerId'],
    foremanHash: string,
  ): string {
    const ownerHash = this.userHashMap[ownerId];

    const saltForOwnerHash = Buffer.from(
      this.config.get('SALT_FOR_OWNER_HASH') as string,
      'hex',
    );
    const ivForOwnerHash = Buffer.from(
      this.config.get('IV_FOR_OWNER_HASH') as string,
      'hex',
    );

    const keyToEncryptOwnerHash = crypto.pbkdf2Sync(
      foremanHash,
      saltForOwnerHash,
      10000,
      32,
      'sha256',
    );

    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      keyToEncryptOwnerHash,
      ivForOwnerHash,
    );

    const encrypted = Buffer.concat([
      cipher.update(ownerHash),
      cipher.final(),
    ]);

    return encrypted.toString('hex');
  }
}
