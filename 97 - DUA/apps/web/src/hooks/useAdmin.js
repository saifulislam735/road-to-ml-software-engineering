import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api';

export function useAdminStats(params) {
  return useQuery({
    queryKey: ['admin', 'stats', params],
    queryFn: () => adminApi.getStats(params).then((response) => response.data),
    refetchInterval: params?.chart ? false : 60000
  });
}

export function useAdminUsers(params) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.getUsers(params).then((response) => response.data),
    placeholderData: (previous) => previous
  });
}

export function useAdminUser(id) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => adminApi.getUser(id).then((response) => response.data),
    enabled: Boolean(id)
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => adminApi.banUser(id, { reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminApi.unbanUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminApi.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
  });
}

export function useAdminDuas(params) {
  return useQuery({
    queryKey: ['admin', 'duas', params],
    queryFn: () => adminApi.getDuas(params).then((response) => response.data),
    placeholderData: (previous) => previous
  });
}

export function useHideDua() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hidden }) => (hidden ? adminApi.hideDua(id) : adminApi.unhideDua(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'duas'] })
  });
}

export function useAdminDeleteDua() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminApi.deleteDua(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'duas'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    }
  });
}

export function useAdminReports(params) {
  return useQuery({
    queryKey: ['admin', 'reports', params],
    queryFn: () => adminApi.getReports(params).then((response) => response.data),
    placeholderData: (previous) => previous
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hideDua }) => adminApi.resolveReport(id, { hideDua }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'duas'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    }
  });
}

export function useDismissReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminApi.dismissReport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
  });
}
