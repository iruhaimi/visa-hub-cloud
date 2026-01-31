import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useUrgentTasks } from '@/hooks/useUrgentTasks';

interface Agent {
  id: string;
  full_name: string;
  avatar_url: string | null;
  pending_count: number;
  completion_rate: number;
}

interface Application {
  id: string;
  applicant_name: string;
  country: string;
  visa_type: string;
}

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedApplications: Application[];
  onSuccess: () => void;
}

export function BulkAssignDialog({
  open,
  onOpenChange,
  selectedApplications,
  onSuccess,
}: BulkAssignDialogProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const { agentWorkloads, getSuggestedAgent } = useUrgentTasks();

  useEffect(() => {
    if (open) {
      fetchAgents();
    }
  }, [open]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const { data: agentRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'agent');

      if (!agentRoles || agentRoles.length === 0) {
        setAgents([]);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('user_id', agentRoles.map(r => r.user_id));

      const { data: apps } = await supabase
        .from('applications')
        .select('assigned_agent_id, status');

      const agentsWithStats: Agent[] = (profiles || []).map(p => {
        const agentApps = apps?.filter(a => a.assigned_agent_id === p.id) || [];
        const pending = agentApps.filter(a => 
          !['approved', 'rejected', 'cancelled', 'draft', 'pending_payment'].includes(a.status)
        ).length;
        const completed = agentApps.filter(a => a.status === 'approved').length;
        const total = agentApps.length;

        return {
          id: p.id,
          full_name: p.full_name || 'وكيل',
          avatar_url: p.avatar_url,
          pending_count: pending,
          completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      }).sort((a, b) => a.pending_count - b.pending_count);

      setAgents(agentsWithStats);

      // Auto-select suggested agent
      const suggested = getSuggestedAgent();
      if (suggested) {
        setSelectedAgent(suggested.agent_id);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAgent || selectedApplications.length === 0) return;

    setAssigning(true);
    try {
      // Update all selected applications
      const { error } = await supabase
        .from('applications')
        .update({ assigned_agent_id: selectedAgent })
        .in('id', selectedApplications.map(a => a.id));

      if (error) throw error;

      // Get agent name for notification
      const agent = agents.find(a => a.id === selectedAgent);

      // Create notifications for the agent
      await supabase.from('notifications').insert({
        user_id: selectedAgent,
        title: '📋 تم تعيين طلبات جديدة لك',
        message: `تم تعيين ${selectedApplications.length} طلب جديد لك للمتابعة`,
        type: 'bulk_assignment',
        action_url: '/agent/applications',
      });

      toast.success(`تم تعيين ${selectedApplications.length} طلب إلى ${agent?.full_name || 'الوكيل'}`);
      onOpenChange(false);
      setSelectedAgent('');
      onSuccess();
    } catch (error) {
      console.error('Error assigning applications:', error);
      toast.error('حدث خطأ في تعيين الطلبات');
    } finally {
      setAssigning(false);
    }
  };

  const suggestedAgent = getSuggestedAgent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            تعيين جماعي للطلبات
          </DialogTitle>
          <DialogDescription>
            تعيين {selectedApplications.length} طلب لوكيل واحد
          </DialogDescription>
        </DialogHeader>

        {/* Selected Applications Preview */}
        <div className="space-y-3">
          <p className="text-sm font-medium">الطلبات المحددة:</p>
          <ScrollArea className="h-32 rounded-md border p-2">
            <div className="space-y-2">
              {selectedApplications.map(app => (
                <div key={app.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{app.applicant_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {app.country}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Agent Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">اختر الوكيل:</p>
            {suggestedAgent && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                الوكيل المقترح
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الوكيل" />
              </SelectTrigger>
              <SelectContent>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={agent.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {agent.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{agent.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({agent.pending_count} قيد العمل)
                      </span>
                      {suggestedAgent?.agent_id === agent.id && (
                        <Sparkles className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedAgent && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground">
                بعد التعيين سيكون لدى الوكيل{' '}
                <span className="font-medium text-foreground">
                  {(agents.find(a => a.id === selectedAgent)?.pending_count || 0) + selectedApplications.length}
                </span>{' '}
                طلب قيد العمل
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedAgent || assigning}
          >
            {assigning && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
            تعيين {selectedApplications.length} طلب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
