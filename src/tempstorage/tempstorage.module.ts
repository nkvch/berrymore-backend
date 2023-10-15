import { Module } from '@nestjs/common';
import { TempStorage } from './tempstorage.service';

@Module({
  providers: [
    {
      provide: 'TempStorage',
      useClass: TempStorage,
    },
  ],
  exports: ['TempStorage'],
})
export class TempStorageModule {}
