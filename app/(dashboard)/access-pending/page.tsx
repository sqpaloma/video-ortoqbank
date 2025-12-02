'use client';

import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { api } from '@/convex/_generated/api';
import { ClockIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon } from 'lucide-react';
import { useUser, SignOutButton } from '@clerk/nextjs';

export default function AccessPendingPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const accessDetails = useQuery(api.userAccess.getVideoAccessDetails);
  const currentUser = useQuery(api.users.current);

  // If user gains access, redirect to categories
  useEffect(() => {
    if (accessDetails?.hasAccess) {
      router.push('/categories');
    }
  }, [accessDetails, router]);

  if (!clerkUser || accessDetails === undefined || currentUser === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-brand-blue/10 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (accessDetails.status === 'suspended') {
      return <XCircleIcon className="h-20 w-20 text-red-500 mx-auto mb-6" />;
    }
    if (accessDetails.paymentStatus === 'failed' || accessDetails.paymentStatus === 'refunded') {
      return <AlertCircleIcon className="h-20 w-20 text-yellow-500 mx-auto mb-6" />;
    }
    return <ClockIcon className="h-20 w-20 text-blue-500 mx-auto mb-6" />;
  };

  const getStatusMessage = () => {
    if (accessDetails.status === 'suspended') {
      return {
        title: 'Conta Suspensa',
        message: 'Sua conta foi suspensa. Entre em contato com o suporte para mais informações.',
        color: 'text-red-600',
      };
    }

    if (accessDetails.status === 'inactive') {
      return {
        title: 'Conta Inativa',
        message: 'Sua conta está inativa. Entre em contato com o suporte.',
        color: 'text-gray-600',
      };
    }

    if (!accessDetails.paid) {
      return {
        title: 'Pagamento Pendente',
        message: 'Seu pagamento ainda não foi confirmado. Aguarde a aprovação ou entre em contato com o suporte.',
        color: 'text-yellow-600',
      };
    }

    if (!accessDetails.hasActiveYearAccess) {
      return {
        title: 'Acesso Pendente de Aprovação',
        message: 'Seu cadastro foi recebido! Um administrador irá revisar e aprovar seu acesso em breve.',
        color: 'text-blue-600',
      };
    }

    return {
      title: 'Verificando Acesso',
      message: 'Estamos verificando suas credenciais...',
      color: 'text-gray-600',
    };
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-brand-blue/10 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {getStatusIcon()}
          
          <h1 className={`text-3xl font-bold text-center mb-4 ${statusInfo.color}`}>
            {statusInfo.title}
          </h1>
          
          <p className="text-center text-gray-600 mb-8 text-lg">
            {statusInfo.message}
          </p>

          <div className="bg-slate-50 rounded-lg p-6 mb-8">
            <h2 className="font-semibold text-gray-900 mb-4">Detalhes da Conta</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nome:</span>
                <span className="font-medium">{currentUser.firstName} {currentUser.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{currentUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  accessDetails.status === 'active' ? 'text-green-600' :
                  accessDetails.status === 'suspended' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {accessDetails.status === 'active' ? 'Ativo' :
                   accessDetails.status === 'suspended' ? 'Suspenso' :
                   'Inativo'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pagamento:</span>
                <span className={`font-medium ${
                  accessDetails.paid ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {accessDetails.paid ? 'Confirmado' : 'Pendente'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Acesso Liberado:</span>
                <span className={`font-medium ${
                  accessDetails.hasActiveYearAccess ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {accessDetails.hasActiveYearAccess ? 'Sim' : 'Aguardando Aprovação'}
                </span>
              </div>
            </div>
          </div>

          {accessDetails.status !== 'suspended' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>💡 O que fazer agora?</strong><br />
                Após a confirmação do pagamento e aprovação do administrador, você terá acesso completo à plataforma. 
                Você receberá um email quando seu acesso for liberado.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push('/profile')}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Ver Meu Perfil
            </button>
            <SignOutButton>
              <button className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Sair
              </button>
            </SignOutButton>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Precisa de ajuda?{' '}
              <a href="mailto:suporte@ortoqbank.com" className="text-primary hover:underline">
                Entre em contato com o suporte
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

