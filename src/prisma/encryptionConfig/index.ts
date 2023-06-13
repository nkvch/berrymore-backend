import { PrismaService } from "../prisma.service";

type EncryptionConfig = Record<string, {
  shouldCrypt: (data: Record<string, string | number>, prisma: PrismaService) => Promise<boolean>;
  fields: string[]
}>

export const encryptionConfig: EncryptionConfig = {
  users: {
    shouldCrypt: async (data: Record<string, string | number>, prisma: PrismaService) => {
      if (!data.roleId) return false;

      const foremanRole = await prisma.roles.findFirst({
        where: {
          roleName: 'foreman',
          id: data.roleId as number,
        }
      });

      return !!foremanRole;
    },
    fields: ['firstName', 'lastName']
  }
}
