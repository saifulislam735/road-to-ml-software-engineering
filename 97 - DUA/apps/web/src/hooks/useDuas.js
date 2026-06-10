import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { duaApi } from '../services/api';

export function useInbox(page = 1) {
  return useQuery({
    queryKey: ['inbox', page],
    queryFn: () => duaApi.getInbox({ page, limit: 20 }).then((response) => response.data),
    placeholderData: (previous) => previous
  });
}

export function useSendDua(username) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => duaApi.send(username, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inbox'] })
  });
}

export function useDeleteDua() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => duaApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inbox'] })
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => duaApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inbox'] })
  });
}
