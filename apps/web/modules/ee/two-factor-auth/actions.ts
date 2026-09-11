"use server";

import { randomUUID } from "node:crypto";
import { Authenticator } from "@otplib/core";
import { createDigest, createRandomBytes } from "@otplib/plugin-crypto";
import { keyDecoder, keyEncoder } from "@otplib/plugin-thirty-two";
import { prisma } from "@formbricks/database";
import { logger } from "@formbricks/logger";
import { symmetricDecrypt, symmetricEncrypt } from "@/lib/crypto";
import { ENCRYPTION_KEY } from "@/lib/constants";

const authenticator = new Authenticator({
  createDigest,
  createRandomBytes,
  keyDecoder,
  keyEncoder,
});

export async function enableTwoFactorAuth(userId: string): Promise<{ secret: string; qrCode: string }> {
  const secret = authenticator.generateSecret();
  const serviceName = "Formbricks";
  const otpauth = authenticator.keyuri(userId, serviceName, secret);

  const encryptedSecret = symmetricEncrypt(secret, ENCRYPTION_KEY);

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: encryptedSecret },
  });

  return { secret, qrCode: otpauth };
}

export async function disableTwoFactorAuth(userId: string): Promise<{ success: boolean }> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: null,
    },
  });

  logger.info({ userId }, "Two-factor authentication disabled");
  return { success: true };
}

export async function verifyTwoFactorCode(userId: string, code: string): Promise<{ valid: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, backupCodes: true },
  });

  if (!user?.twoFactorSecret) {
    return { valid: false };
  }

  const secret = symmetricDecrypt(user.twoFactorSecret, ENCRYPTION_KEY);
  const isValid = authenticator.check(code, secret);

  if (!isValid && user.backupCodes) {
    const backupCodes: { code: string; used: boolean }[] = JSON.parse(user.backupCodes);
    const unusedCode = backupCodes.find((bc) => bc.code === code && !bc.used);
    if (unusedCode) {
      unusedCode.used = true;
      await prisma.user.update({
        where: { id: userId },
        data: { backupCodes: JSON.stringify(backupCodes) },
      });
      return { valid: true };
    }
  }

  return { valid: isValid };
}

export async function finalizeTwoFactorSetup(userId: string): Promise<{ backupCodes: string[] }> {
  const backupCodes = Array.from({ length: 8 }, () => randomUUID().replace(/-/g, "").substring(0, 10));

  const backupCodesData = backupCodes.map((code) => ({ code, used: false }));

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      backupCodes: JSON.stringify(backupCodesData),
    },
  });

  return { backupCodes };
}
