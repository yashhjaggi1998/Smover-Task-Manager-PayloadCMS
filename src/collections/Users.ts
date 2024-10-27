import { CollectionConfig } from 'payload/types'

const Users: CollectionConfig = {
  slug: 'users',
  auth: false,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'username',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'password_hash',
      type: 'text',
      required: true,
    },
  ],
}

export default Users
