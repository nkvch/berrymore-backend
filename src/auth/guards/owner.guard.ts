// import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
// import { Prisma, PrismaClient } from '@prisma/client';
// import { PrismaService } from 'src/prisma/prisma.service';

// @Injectable()
// export class OwnerGuard<T extends Prisma.ModelName> implements CanActivate {
//   private modelName: T;
//   private prisma: PrismaService;

//   constructor(
//     modelName: T,
//   ) {
//     this.modelName = modelName;
//     this.prisma = new PrismaService();
//   }

//   async canActivate<T extends Prisma.ModelName>(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest();
//     const user = request.user;

//     if (!user) {
//       return false;
//     }

//     const id = parseInt(request.params.id, 10);

//     const args: Parameters<PrismaClient[T]['findFirst']>['0'] = {
//       where: {
//         id,
//         ownerId: user.id,
//       },
//     };

//     if (user.roleName === 'foreman') {
//       args.where = {
//         ...args.where,
//         foremanId: user.id,
//       };
//     }

//     const client = this.service.prisma[this.modelName] as any;

//     const myEntity = await client.findFirst(args);

//     return !!myEntity;
//   }
// }
