import { useQuery } from '@tanstack/react-query'
import { getUsers } from '@/api/client'
import type { User } from '@/types/domain'

export function useUsers() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => getUsers(),
  })

  function findUser(id: string | null | undefined): User | undefined {
    if (!id) return undefined
    return users.find((u) => u.id === id)
  }

  return { users, findUser, isLoading }
}
