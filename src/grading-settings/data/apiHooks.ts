import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getGradingSettings, sendGradingSettings } from './api';

export const useGradingSettings = (courseId: string) => (
  useQuery({
    queryKey: ['gradingSettings', courseId],
    queryFn: () => getGradingSettings(courseId),
  })
);

export const useGradingSettingUpdater = (courseId: string) => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (settings) => sendGradingSettings(courseId, settings),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['gradingSettings', courseId] });
    },
  });

  return {
    ...mutation,
    isLoading: mutation.isPending,
  };
};
