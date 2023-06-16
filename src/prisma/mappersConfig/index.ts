export interface MappersConfig {
  fields: string[];
  fieldsMappers: Record<string, (value: any) => any>;
}

export const mappersConfig: Record<string, MappersConfig> = {
  history: {
    fields: ['amount'],
    fieldsMappers: {
      amount: (value: any) => Number(value),
    }
  },
  products: {
    fields: ['productPrice'],
    fieldsMappers: {
      productPrice: (value: any) => Number(value),
    },
  },
};
