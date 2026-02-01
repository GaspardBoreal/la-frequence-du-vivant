import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Plus, 
  UserPlus, 
  Trash2, 
  Edit,
  Shield,
  User,
  Footprints
} from 'lucide-react';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useCrmRole } from '@/hooks/useCrmRole';
import type { TeamMember, CrmRole } from '@/types/crm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';

const memberSchema = z.object({
  prenom: z.string().min(1, 'Le prénom est requis'),
  nom: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  fonction: z.string().optional(),
  telephone: z.string().optional(),
  is_active: z.boolean().default(true),
});

type MemberFormData = z.infer<typeof memberSchema>;

const TeamManagement: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { 
    members, 
    isLoading, 
    createMember, 
    updateMember, 
    deleteMember,
    getRoleForUser,
    assignRole
  } = useTeamMembers();
  const { canManageTeam } = useCrmRole();

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      prenom: '',
      nom: '',
      email: '',
      fonction: '',
      telephone: '',
      is_active: true,
    },
  });

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    form.reset({
      prenom: member.prenom,
      nom: member.nom,
      email: member.email || '',
      fonction: member.fonction || '',
      telephone: member.telephone || '',
      is_active: member.is_active,
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: MemberFormData) => {
    if (editingMember) {
      updateMember.mutate({ id: editingMember.id, ...data });
    } else {
      createMember.mutate({
        prenom: data.prenom,
        nom: data.nom,
        email: data.email || null,
        fonction: data.fonction || null,
        telephone: data.telephone || null,
        is_active: data.is_active,
        user_id: null,
        photo_url: null,
      });
    }
    setIsFormOpen(false);
    setEditingMember(null);
    form.reset();
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingMember(null);
    form.reset();
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMember.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleRoleChange = (userId: string, role: CrmRole) => {
    assignRole.mutate({ userId, role });
  };

  const getRoleBadge = (role: CrmRole | null) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-destructive text-destructive-foreground"><Shield className="h-3 w-3 mr-1" /> Admin</Badge>;
      case 'member':
        return <Badge className="bg-primary text-primary-foreground"><User className="h-3 w-3 mr-1" /> Membre</Badge>;
      case 'walker':
        return <Badge className="bg-accent text-accent-foreground"><Footprints className="h-3 w-3 mr-1" /> Marcheur</Badge>;
      default:
        return <Badge variant="outline">Aucun rôle</Badge>;
    }
  };

  const getInitials = (prenom: string, nom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  if (!canManageTeam) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Accès refusé</h1>
          <p className="text-muted-foreground">Seuls les administrateurs peuvent gérer l'équipe.</p>
          <Link to="/admin">
            <Button variant="outline" className="mt-4">
              Retour à l'administration
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gestion de l'Équipe</h1>
              <p className="text-sm text-muted-foreground">Gérer les membres et les rôles CRM</p>
            </div>
          </div>

          <Button onClick={() => setIsFormOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Ajouter un membre
          </Button>
        </div>

        {/* Members Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {isLoading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : members.length === 0 ? (
            <Card className="col-span-2">
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucun membre dans l'équipe. Cliquez sur "Ajouter un membre" pour commencer.
              </CardContent>
            </Card>
          ) : (
            members.map((member) => (
              <Card key={member.id} className={!member.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.photo_url || undefined} />
                        <AvatarFallback>{getInitials(member.prenom, member.nom)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {member.prenom} {member.nom}
                        </CardTitle>
                        {member.fonction && (
                          <p className="text-sm text-muted-foreground">{member.fonction}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(member)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive"
                        onClick={() => setDeleteId(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {member.email && (
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    )}
                    {member.telephone && (
                      <p className="text-sm text-muted-foreground">{member.telephone}</p>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Rôle :</span>
                        {member.user_id ? (
                          getRoleBadge(getRoleForUser(member.user_id))
                        ) : (
                          <Badge variant="outline">Non lié</Badge>
                        )}
                      </div>
                      
                      {member.user_id && (
                        <Select
                          value={getRoleForUser(member.user_id) || ''}
                          onValueChange={(value) => handleRoleChange(member.user_id!, value as CrmRole)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue placeholder="Attribuer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Membre</SelectItem>
                            <SelectItem value="walker">Marcheur</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {!member.is_active && (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Member Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleFormClose()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMember ? 'Modifier le membre' : 'Nouveau membre'}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="prenom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fonction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fonction</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telephone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Membre actif</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleFormClose}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createMember.isPending || updateMember.isPending}>
                    {editingMember ? 'Mettre à jour' : 'Ajouter'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer ce membre ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default TeamManagement;
