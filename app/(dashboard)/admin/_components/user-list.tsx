"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheckIcon, UserIcon, SearchIcon, LoaderIcon, AlertCircleIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function UserList() {
  const users = useQuery(api.userAdmin.getAllUsersForAdmin, { limit: 100 });
  const setUserRole = useMutation(api.userAdmin.setUserRole);
  const approveUserAccess = useMutation(api.userAdmin.approveUserAccess);
  const revokeUserAccess = useMutation(api.userAdmin.revokeUserAccess);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [changingRole, setChangingRole] = useState<Id<"users"> | null>(null);
  const [changingAccess, setChangingAccess] = useState<Id<"users"> | null>(null);

  const handleToggleAdmin = async (userId: Id<"users">, currentRole: "user" | "admin") => {
    setChangingRole(userId);
    try {
      const newRole = currentRole === "admin" ? "user" : "admin";
      await setUserRole({ userId, role: newRole });
      
      toast({
        title: "Sucesso",
        description: `Usuário agora é ${newRole === "admin" ? "administrador" : "usuário"}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao alterar role do usuário",
        variant: "destructive",
      });
    } finally {
      setChangingRole(null);
    }
  };

  const handleApproveAccess = async (userId: Id<"users">) => {
    setChangingAccess(userId);
    try {
      await approveUserAccess({ userId });
      
      toast({
        title: "Acesso Aprovado",
        description: "Usuário agora tem acesso completo à plataforma",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao aprovar acesso",
        variant: "destructive",
      });
    } finally {
      setChangingAccess(null);
    }
  };

  const handleRevokeAccess = async (userId: Id<"users">) => {
    setChangingAccess(userId);
    try {
      await revokeUserAccess({ userId });
      
      toast({
        title: "Acesso Revogado",
        description: "Acesso do usuário foi removido",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao revogar acesso",
        variant: "destructive",
      });
    } finally {
      setChangingAccess(null);
    }
  };

  // Filter users by search query
  const filteredUsers = users?.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const email = user.email.toLowerCase();
    const firstName = user.firstName.toLowerCase();
    const lastName = user.lastName.toLowerCase();
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    
    return email.includes(query) || firstName.includes(query) || lastName.includes(query) || fullName.includes(query);
  }) || [];

  if (users === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Handle error case (user not admin or not authenticated)
  if (users === null) {
    return (
      <div className="text-center py-12">
        <AlertCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 font-medium mb-2">Erro ao carregar usuários</p>
        <p className="text-muted-foreground text-sm">
          Você precisa ter permissões de administrador para visualizar esta lista.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user.imageUrl ? (
                    <img src={user.imageUrl} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="h-5 w-5 text-gray-500" />
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    {user.role === "admin" && (
                      <Badge variant="default" className="bg-blue-600">
                        <ShieldCheckIcon className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={user.status === "active" ? "default" : "secondary"} className="text-xs">
                      {user.status === "active" ? "Ativo" : user.status === "inactive" ? "Inativo" : "Suspenso"}
                    </Badge>
                    {user.hasActiveYearAccess && (
                      <Badge variant="outline" className="text-xs">
                        Acesso Ativo
                      </Badge>
                    )}
                    {user.paid && (
                      <Badge variant="outline" className="text-xs">
                        Pago
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Approve/Revoke Access Button */}
                {user.hasActiveYearAccess && user.paid ? (
                  <Button
                    onClick={() => handleRevokeAccess(user._id)}
                    disabled={changingAccess === user._id}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    {changingAccess === user._id ? (
                      <LoaderIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Revogar Acesso
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleApproveAccess(user._id)}
                    disabled={changingAccess === user._id}
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {changingAccess === user._id ? (
                      <LoaderIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Aprovar Acesso
                      </>
                    )}
                  </Button>
                )}

                {/* Admin Role Button */}
                <Button
                  onClick={() => handleToggleAdmin(user._id, user.role)}
                  disabled={changingRole === user._id}
                  variant={user.role === "admin" ? "outline" : "default"}
                  size="sm"
                  className={cn(
                    user.role === "admin" && "border-orange-300 text-orange-600 hover:bg-orange-50"
                  )}
                >
                  {changingRole === user._id ? (
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                  ) : user.role === "admin" ? (
                    "Remover Admin"
                  ) : (
                    "Tornar Admin"
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Total de usuários: {users.length}</span>
          <span>Administradores: {users.filter(u => u.role === "admin").length}</span>
        </div>
      </div>
    </div>
  );
}

