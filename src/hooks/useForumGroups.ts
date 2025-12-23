import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ForumGroup {
  id: string;
  name: string;
  description: string | null;
  subject_id: string | null;
  created_by: string;
  is_private: boolean;
  max_members: number;
  member_count: number;
  is_active: boolean;
  created_at: string;
  subject?: {
    name: string;
  } | null;
  is_member?: boolean;
}

export function useForumGroups() {
  return useQuery({
    queryKey: ['forum-groups'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('forum_groups')
        .select(`
          *,
          subject:popular_subjects(name)
        `)
        .eq('is_active', true)
        .order('member_count', { ascending: false });

      if (error) throw error;

      // Check membership for each group if user is logged in
      if (user.user) {
        const { data: memberships } = await supabase
          .from('forum_group_members')
          .select('group_id')
          .eq('user_id', user.user.id);

        const memberGroupIds = new Set(memberships?.map(m => m.group_id) || []);

        return (data || []).map(group => ({
          ...group,
          is_member: memberGroupIds.has(group.id),
        })) as ForumGroup[];
      }

      return data as ForumGroup[];
    },
  });
}

export function useCreateForumGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      name, 
      description, 
      subjectId, 
      isPrivate 
    }: { 
      name: string; 
      description?: string;
      subjectId?: string;
      isPrivate?: boolean;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Create group
      const { data: group, error: groupError } = await supabase
        .from('forum_groups')
        .insert({
          name,
          description,
          subject_id: subjectId || null,
          created_by: user.user.id,
          is_private: isPrivate || false,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('forum_group_members')
        .insert({
          group_id: group.id,
          user_id: user.user.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-groups'] });
      toast({
        title: 'Success',
        description: 'Discussion group created!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create group',
        variant: 'destructive',
      });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('forum_group_members')
        .insert({
          group_id: groupId,
          user_id: user.user.id,
          role: 'member',
        });

      if (error) throw error;

      // Increment member count manually
      const { data: group } = await supabase
        .from('forum_groups')
        .select('member_count')
        .eq('id', groupId)
        .single();
      
      if (group) {
        await supabase
          .from('forum_groups')
          .update({ member_count: (group.member_count || 0) + 1 })
          .eq('id', groupId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-groups'] });
      toast({
        title: 'Joined!',
        description: 'You have joined the group.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join group',
        variant: 'destructive',
      });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('forum_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-groups'] });
      toast({
        title: 'Left Group',
        description: 'You have left the group.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to leave group',
        variant: 'destructive',
      });
    },
  });
}
