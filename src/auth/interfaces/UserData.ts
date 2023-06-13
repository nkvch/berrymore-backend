import { roles, users } from "@prisma/client"

export interface UserData {
  id: users['id']
  roleName: roles['roleName']
  ownerId: users['id']
}
