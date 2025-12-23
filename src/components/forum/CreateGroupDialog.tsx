import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCreateForumGroup } from '@/hooks/useForumGroups';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({ open, onOpenChange }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const createGroup = useCreateForumGroup();

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await createGroup.mutateAsync({ name, description, isPrivate });
    setName('');
    setDescription('');
    setIsPrivate(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Discussion Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Group Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter group name" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the group..." rows={3} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Private Group</Label>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>
          <Button onClick={handleSubmit} disabled={createGroup.isPending || !name} className="w-full">
            {createGroup.isPending ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
